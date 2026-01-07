import CommonService from '@backend/modules/common/common.service';
import { type IAuditEnergetiqueSimulation, type ICreateAuditEnergetiqueSimulation, type IUpdateAuditEnergetiqueSimulation } from '@shared/interfaces/audit-energetique.interface';
import { AuditEnergetiqueSimulationRepository } from './audit-energetique.repository';
import { HTTP404Error } from '@backend/errors/http.error';
import { HeatingSystemTypes } from '@shared/enums/audit-batiment.enum';
import { BUILDING_COEFFICIENTS, PROCESS_FACTORS, ECS_USAGE_FACTORS, CLIMATE_FACTORS, COOLING_COVERAGE_FACTORS, EMISSION_FACTORS } from './config';

import {
  computeEnvelopeFactor,
  computeCompactnessFactor,
  computeUsageFactor,
  computeHvacLoads,
  computeEquipmentLoads,
  computeDomesticHotWaterLoad,
  computeCo2Emissions,
  computeEnergyClass,
  computeEnergySplit,
  computeProgressiveTariff
} from './helpers';
import { Logger } from '@backend/middlewares';

type AuditEnergetiqueCreateInput = Omit<
  ICreateAuditEnergetiqueSimulation,
  | 'annualConsumption'
  | 'monthlyConsumption'
  | 'energyCostPerYear'
  | 'co2EmissionsKg'
  | 'co2EmissionsTons'
  | 'energyClass'
  | 'energyClassDescription'
  | 'becth'
>;
export type { AuditEnergetiqueCreateInput };

const HEATING_SYSTEM_EFFICIENCIES: Record<HeatingSystemTypes, number> = {
  [HeatingSystemTypes.NONE]: 1,
  [HeatingSystemTypes.ELECTRIC_INDIVIDUAL]: 1,
  [HeatingSystemTypes.ELECTRIC_HEATING]: 0.92,
  [HeatingSystemTypes.REVERSIBLE_AC]: 1,
  [HeatingSystemTypes.GAS_BOILER]: 0.7,
  [HeatingSystemTypes.OTHER]: 0.8
};

/**
 * Service for Energy Audit Simulations
 * Orchestrates the calculation of annual energy consumption for buildings

 */
export class AuditSimulationService extends CommonService<
  IAuditEnergetiqueSimulation,
  ICreateAuditEnergetiqueSimulation,
  IUpdateAuditEnergetiqueSimulation
> {
  constructor() {
    super(new AuditEnergetiqueSimulationRepository());
  }

  /**
   * Creates a new energy audit simulation with full consumption calculation
   * 
   * Steps:
   * 1. Calculate building envelope factors
   * 2. Compute HVAC loads (heating + cooling)
   * 3. Calculate lighting, IT, and base loads
   * 4. Add equipment-specific loads
   * 5. Calculate domestic hot water (ECS) consumption
   * 6. Sum all loads and convert to annual consumption
   */
  public async createSimulation(payload: AuditEnergetiqueCreateInput): Promise<IAuditEnergetiqueSimulation> {

    const envelopeFactor = computeEnvelopeFactor(payload.insulation, payload.glazingType, payload.ventilation);

    const compactnessFactor = computeCompactnessFactor(payload.floors);

    const processFactor = PROCESS_FACTORS[payload.buildingType] ?? 1;
    const climate = CLIMATE_FACTORS[payload.climateZone];

    const usageFactor = computeUsageFactor(payload.openingHoursPerDay, payload.openingDaysPerWeek);


    const buildingCoefficients = BUILDING_COEFFICIENTS[payload.buildingType];

    const lightingLoad = buildingCoefficients.light * usageFactor;
    const itLoad = buildingCoefficients.it * usageFactor * processFactor;
    const baseLoad = buildingCoefficients.base;

    const equipmentLoad = computeEquipmentLoads({
      buildingType: payload.buildingType,
      categories: payload.equipmentCategories ?? [],
      usageFactor,
      processFactor,
      surface: payload.surfaceArea
    });

    const hvacBase = buildingCoefficients.hvac * envelopeFactor * compactnessFactor;

    const hvacLoads = computeHvacLoads({
      hvacBase,
      climate,
      usageFactor,
      heatingSystem: payload.heatingSystem,
      coolingSystem: payload.coolingSystem,
      conditionedCoverage: payload.conditionedCoverage,
      heatingK: Number(process.env.ENERGY_AUDIT_K_CH),
      coolingK: Number(process.env.ENERGY_AUDIT_K_FR)
    });

    const ecsLoad = computeDomesticHotWaterLoad({
      ecsType: payload.domesticHotWater,
      ecsUsageFactor: ECS_USAGE_FACTORS[payload.buildingType] ?? 1,
      reference: buildingCoefficients.ecs,
      gasEfficiency: Number(process.env.ENERGY_AUDIT_ECS_GAS_EFF),
      electricEfficiency: Number(process.env.ENERGY_AUDIT_ECS_ELEC_EFF),
    });


    const perSquareTotal = lightingLoad + itLoad + baseLoad + equipmentLoad.perSquare + ecsLoad.perSquare + hvacLoads.perSquare;


    Logger.info(`perSquareTotal: ${perSquareTotal}`);

    let annualConsumption: number;

 
      // Standard: multiply sum by surface
      annualConsumption =
        (lightingLoad + itLoad + baseLoad + ecsLoad.perSquare + equipmentLoad.perSquare + hvacLoads.perSquare) * payload.surfaceArea ;
    

    const monthlyConsumption = annualConsumption / 12;

    // Calculate total heating and cooling loads in kWh/year
    const annualHeatingLoadKwh = hvacLoads.heatingLoad * payload.surfaceArea;
    const annualEcsLoadKwh = ecsLoad.perSquare * payload.surfaceArea + ecsLoad.absoluteKwh;



    // Split energy consumption between electricity and gas
    const energySplit = computeEnergySplit({
      totalConsumption: annualConsumption,
      heatingSystem: payload.heatingSystem,
      ecsType: payload.domesticHotWater,
      heatingLoadKwh: annualHeatingLoadKwh,
      ecsLoadKwh: annualEcsLoadKwh
    });

    // Calculate conditioned surface for BECTh / Carbon intensity
    const coverageFactor = COOLING_COVERAGE_FACTORS[payload.conditionedCoverage] ?? 1;
    const conditionedSurface = payload.surfaceArea * coverageFactor;

    // Calculate CO₂ emissions + carbon class
    const emissions = computeCo2Emissions({
      electricityConsumption: energySplit.electricityConsumption,
      gasConsumption: energySplit.gasConsumption,
      buildingType: payload.buildingType,
      conditionedSurface,
      emissionFactorElec: EMISSION_FACTORS.ELECTRICITY,
      emissionFactorGas: EMISSION_FACTORS.NATURAL_GAS
    });

    // Energy class
    const gasEfficiency = HEATING_SYSTEM_EFFICIENCIES[payload.heatingSystem] ?? 0.9;

    const energyClassResult = computeEnergyClass({
      buildingType: payload.buildingType,
      electricityConsumption: annualConsumption,  // annualConsumption  ?
      gasConsumption: energySplit.gasConsumption,
      conditionedSurface,
      gasEfficiency
    });

    // Calculate energy cost using progressive tariff structure
    const tariffResult = computeProgressiveTariff({
      monthlyConsumption
    });
    
    const simulationPayload: ICreateAuditEnergetiqueSimulation = {
      ...payload,
      equipmentCategories: payload.equipmentCategories ?? [],
      annualConsumption: Number(annualConsumption.toFixed(2)),
      monthlyConsumption: Number(monthlyConsumption.toFixed(2)),
      energyCostPerYear: tariffResult.annualCost,
      co2EmissionsKg: emissions.totalCo2,
      co2EmissionsTons: emissions.totalCo2Tons,
      co2EmissionsElecKg: emissions.co2FromElectricity,
      co2EmissionsGasKg: emissions.co2FromGas,
      carbonClass: emissions.carbonClass ?? undefined,
      carbonClassDescription: emissions.carbonDescription ?? undefined,
      carbonIntensity: emissions.carbonIntensity ?? undefined,
      energyClass: energyClassResult.joyaClass ?? undefined,
      energyClassDescription: energyClassResult.classDescription ?? undefined,
      totalAnnualEnergy: energyClassResult.totalAnnualEnergy,
      siteIntensity: energyClassResult.siteIntensity,
      referenceIntensity: energyClassResult.referenceIntensity ?? undefined,
      joyaIndex: energyClassResult.joyaIndex ?? undefined
    };

    return await this.create(simulationPayload);
  }

  /**
   * Retrieves a simulation by ID
   */
  public async getSimulationById(id: string): Promise<IAuditEnergetiqueSimulation> {
    const simulation = await this.findById(id);

    if (!simulation) {
      throw new HTTP404Error('Audit simulation not found');
    }

    return simulation;
  }

  /**
   * Deletes a simulation by ID
   */
  public async deleteSimulation(id: string): Promise<void> {
    const deleted = await this.delete(id);

    if (!deleted) {
      throw new HTTP404Error('Audit simulation not found');
    }
  }

}

export const auditSimulationService = new AuditSimulationService();

import CommonService from '@backend/modules/common/common.service';
import {
  type IAuditEnergetiqueSimulation,
  type ICreateAuditEnergetiqueSimulation,
  type IUpdateAuditEnergetiqueSimulation
} from '@shared/interfaces/audit-energetique.interface';
import { AuditEnergetiqueSimulationRepository } from './audit-energetique.repository';
import { HTTP404Error } from '@backend/errors/http.error';
import {
  BUILDING_COEFFICIENTS,
  PROCESS_FACTORS,
  ECS_USAGE_FACTORS,
  CLIMATE_FACTORS,
  COOLING_COVERAGE_FACTORS,
  EMISSION_FACTORS
} from './config';
import {
  computeEnvelopeFactor,
  computeCompactnessFactor,
  computeUsageFactor,
  computeHvacLoads,
  computeEquipmentLoads,
  computeDomesticHotWaterLoad,
  computeCo2Emissions,
  computeEnergyClass,
  computeEnergySplit
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
  
    // Calculate envelope factors F_enveloppe = F_isolation × F_vitrage × F_VMC
    const envelopeFactor = computeEnvelopeFactor(payload.insulation, payload.glazingType, payload.ventilation);
    Logger.info(`Envelope factor: ${envelopeFactor}`);
    const compactnessFactor = computeCompactnessFactor(payload.floors);
    Logger.info(`Compactness factor: ${compactnessFactor}`);
    // Calculate process (Depend on the building type)
    const processFactor = PROCESS_FACTORS[payload.buildingType] ?? 1;
    Logger.info(`Process factor: ${processFactor}`);

    const climate = CLIMATE_FACTORS[payload.climateZone];
    Logger.info(`Climate factor: ${JSON.stringify(climate)}`);

    const usageFactor = computeUsageFactor(payload.openingHoursPerDay, payload.openingDaysPerWeek);
    Logger.info(`Usage factor: ${usageFactor}`);
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

    Logger.info(`HVAC base: ${hvacBase}`);

    Logger.info(`Heating K: ${Number(process.env.ENERGY_AUDIT_K_CH)}`);
    Logger.info(`Cooling K: ${Number(process.env.ENERGY_AUDIT_K_FR)}`);
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
      solarCoverage: Number(process.env.ENERGY_AUDIT_ECS_SOLAR_COVERAGE),
      solarAppointEff: Number(process.env.ENERGY_AUDIT_ECS_SOLAR_APPOINT_EFF),
      heatPumpCop: Number(process.env.ENERGY_AUDIT_ECS_PAC_COP)
    });

    const perSquareTotal =
      hvacLoads.perSquare +
      lightingLoad +
      itLoad +
      baseLoad +
      equipmentLoad.perSquare +
      ecsLoad.perSquare;
    Logger.info(`Per square total: ${perSquareTotal}`);

    const annualConsumption =
      (payload.surfaceArea * perSquareTotal) +
      equipmentLoad.absoluteKwh +
      ecsLoad.absoluteKwh;

    const monthlyConsumption = annualConsumption / 12;

    // Calculate total heating and cooling loads in kWh/year
    const annualHeatingLoadKwh = hvacLoads.heatingLoad * payload.surfaceArea;
    const annualCoolingLoadKwh = hvacLoads.coolingLoad * payload.surfaceArea;
    const annualEcsLoadKwh = ecsLoad.perSquare * payload.surfaceArea + ecsLoad.absoluteKwh;

    // Split energy consumption between electricity and gas
    const energySplit = computeEnergySplit({
      totalConsumption: annualConsumption,
      heatingSystem: payload.heatingSystem,
      ecsType: payload.domesticHotWater,
      heatingLoadKwh: annualHeatingLoadKwh,
      ecsLoadKwh: annualEcsLoadKwh
    });

    // Calculate CO₂ emissions
    const emissions = computeCo2Emissions({
      electricityConsumption: energySplit.electricityConsumption,
      gasConsumption: energySplit.gasConsumption,
      emissionFactorElec: EMISSION_FACTORS.ELECTRICITY,
      emissionFactorGas: EMISSION_FACTORS.NATURAL_GAS
    });

    // Calculate conditioned surface for BECTh
    const coverageFactor = COOLING_COVERAGE_FACTORS[payload.conditionedCoverage] ?? 1;
    const conditionedSurface = payload.surfaceArea * coverageFactor;

    // Calculate energy class (only for offices)
    const energyClassResult = computeEnergyClass({
      buildingType: payload.buildingType,
      heatingLoad: annualHeatingLoadKwh,
      coolingLoad: annualCoolingLoadKwh,
      conditionedSurface
    });

    const energyCostPerKwh = Number(process.env.ENERGY_COST_PER_KWH);
    Logger.info(`Energy cost per kWh: ${energyCostPerKwh}`);
    Logger.info(`Annual consumption: ${annualConsumption}`);
    const simulationPayload: ICreateAuditEnergetiqueSimulation = {
      ...payload,
      equipmentCategories: payload.equipmentCategories ?? [],
      annualConsumption: Number(annualConsumption.toFixed(2)),
      monthlyConsumption: Number(monthlyConsumption.toFixed(2)),
      energyCostPerYear: Number((annualConsumption * energyCostPerKwh).toFixed(2)),
      co2EmissionsKg: emissions.totalCo2,
      co2EmissionsTons: emissions.totalCo2Tons,
      energyClass: energyClassResult.energyClass ?? undefined,
      energyClassDescription: energyClassResult.classDescription ?? undefined,
      becth: energyClassResult.becth ?? undefined
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

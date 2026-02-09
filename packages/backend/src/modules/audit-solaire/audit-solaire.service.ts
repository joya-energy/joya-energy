import CommonService from '@backend/modules/common/common.service';
import {
  type IAuditSolaireSimulation,
  type ICreateAuditSolaireSimulation,
  type IUpdateAuditSolaireSimulation
} from '@shared/interfaces';
import { auditSolaireSimulationRepository } from './audit-solaire.repository';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { PaginationOptions, PaginatedResult } from '@shared/interfaces/pagination.interface';
import { Logger } from '@backend/middlewares';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';
import { extrapolateConsumption } from './helpers/consumption-extrapolation.calculator';
import axios, { type AxiosResponse } from 'axios';
import { calculatePVProduction } from './helpers/pv-production.calculator';
import { analyzeEconomics } from './helpers/economic-analysis.calculator';
import { convertAmountToConsumptionFlatRate } from '../audit-energetique/helpers/progressive-tariff.calculator';
import { PVGISService } from '@shared/services/pvgis.service';
import {
  getBestPairIndex,
  getCoverageRate,
  getSelfConsumptionRatio,
  type OperatingHoursCase,
  type OperatingHoursPairIndex,
} from './config/operating-hours-matrices.config';
import {
  computePVAutoconsumption,
  type PVAutoconsumptionResult,
} from './helpers/pv-autoconsumption.calculator';



const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

const EXTERNAL_APIS = {
  GOOGLE_MAPS: {
    URL: process.env['GOOGLE_MAPS_API_URL'] ?? '',
    API_KEY: process.env['GOOGLE_MAPS_API_KEY'] ?? '',
    TIMEOUT: Number(process.env['EXTERNAL_APIS_TIMEOUT']),
  },
} as const;

/** MT Tarif uniforme (291 millimes) → 0.291 DT/kWh; used for amount→kWh conversion when regime is MT uniforme */
const MT_TARIFF_UNIFORME_DT_PER_KWH = 0.291;
/** MT Tarif horaire (279 millimes) → 0.279 DT/kWh; used for amount→kWh conversion when regime is MT horaire */
const MT_TARIFF_HORAIRE_DT_PER_KWH = 0.279;


export interface CreateSimulationInput {
  address: string;
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  buildingType: BuildingTypes;
  climateZone: ClimateZones;
  measuredAmountTnd: number;
  referenceMonth: number;
  /** Optional MT/BT info coming from frontend (solar-MT branch) */
  tariffTension?: 'BT' | 'MT';
  operatingHoursCase?: OperatingHoursCase | null;
  tariffRegime?: 'uniforme' | 'horaire' | null;
}

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}



interface SolarProductibleData {
  monthlyProductibleKwhPerKwp: number[];
  annualProductibleKwhPerKwp: number;
}

export class AuditSolaireSimulationService extends CommonService<
  IAuditSolaireSimulation,
  ICreateAuditSolaireSimulation,
  IUpdateAuditSolaireSimulation
> {
  constructor() {
    super(auditSolaireSimulationRepository);
  }

  public async createSimulation(input: CreateSimulationInput): Promise<IAuditSolaireSimulation> {


    try {
      // Amount (DT) → consumption (kWh): BT uses bracket tariff (0.391 for 500+ kWh); MT uses regime (Tarif uniforme 0.291, Tarif horaire 0.279)
      let measuredConsumptionKwh: number;
      if (input.tariffTension === 'MT' && (input.tariffRegime === 'uniforme' || input.tariffRegime === 'horaire')) {
        const rate = input.tariffRegime === 'uniforme' ? MT_TARIFF_UNIFORME_DT_PER_KWH : MT_TARIFF_HORAIRE_DT_PER_KWH;
        measuredConsumptionKwh = input.measuredAmountTnd / rate;
      } else {
        const consumptionConversion = convertAmountToConsumptionFlatRate({
          monthlyAmount: input.measuredAmountTnd,
        });
        measuredConsumptionKwh = consumptionConversion.monthlyConsumption;
      }

      const coordinates = await this.resolveGeoCoordinates(input);

      const solarData = await this.fetchSolarProductibleFromPVGIS(coordinates.latitude, coordinates.longitude);

      const consumptionData = extrapolateConsumption({
        measuredConsumption: measuredConsumptionKwh,
        referenceMonth: input.referenceMonth,
        buildingType: input.buildingType,
        climateZone: input.climateZone,
      });

      const monthlyConsumptions = consumptionData.monthlyConsumptions.map(mc => mc.estimatedConsumption);

      const pvSystemData = calculatePVProduction({
       annualConsumption: consumptionData.annualEstimatedConsumption,
        annualProductible: solarData.annualProductibleKwhPerKwp,
        monthlyProductible: solarData.monthlyProductibleKwhPerKwp,
        monthlyConsumptions,
      });

      if (!pvSystemData.monthlyProductions || pvSystemData.monthlyProductions.length !== 12) {
        throw new Error(`Invalid PV system data: monthlyProductions=${pvSystemData.monthlyProductions?.length || 0}`);
      }

      const monthlyBilledConsumptions = pvSystemData.monthlyProductions.map(mp => mp.netConsumption);

      if (monthlyBilledConsumptions.length !== 12 || monthlyConsumptions.length !== 12) {
        throw new Error(`Invalid array lengths: billed=${monthlyBilledConsumptions.length}, raw=${monthlyConsumptions.length}`);
      }

      // Optional: MT autoconsumption analysis using operating-hours matrices (Jour / Jour+soir / 24/7)
      let mtAutoconsumption: PVAutoconsumptionResult | null = null;
      let mtCoverageRate: number | null = null;
      let mtSelfConsumptionRatio: number | null = null;
      let mtPairIndex: OperatingHoursPairIndex | null = null;

      if (input.tariffTension === 'MT' && input.operatingHoursCase) {
        const caseKey: OperatingHoursCase = input.operatingHoursCase;
        // Choose pair with highest coverage (T_couv) and excedent < 30%.
        const pairIndex = getBestPairIndex(caseKey, input.buildingType, 0.3);
        mtPairIndex = pairIndex;

        mtCoverageRate = getCoverageRate(caseKey, input.buildingType, pairIndex);
        mtSelfConsumptionRatio = getSelfConsumptionRatio(caseKey, input.buildingType, pairIndex);

        mtAutoconsumption = computePVAutoconsumption({
          annualConsumption: consumptionData.annualEstimatedConsumption,
          annualProductible: solarData.annualProductibleKwhPerKwp,
          targetCoverageRate: mtCoverageRate,
          selfConsumptionRatio: mtSelfConsumptionRatio,
        });

        Logger.info(
          `MT autoconsumption: case=${caseKey}, pairIndex=${pairIndex}, ` +
          `T_couv=${mtCoverageRate}, r_auto=${mtSelfConsumptionRatio}, ` +
          `P_PV,th=${mtAutoconsumption.theoreticalPVPower}, ` +
          `E_PV=${mtAutoconsumption.annualPVProduction}, ` +
          `E_auto=${mtAutoconsumption.selfConsumedEnergy}, ` +
          `E_exc=${mtAutoconsumption.gridSurplus}`
        );
      }

      let economicData;
      try {
        economicData = analyzeEconomics({
          monthlyBilledConsumptions,
          monthlyRawConsumptions: monthlyConsumptions,
          installedPowerKwp: pvSystemData.installedPower,
          annualPVProduction: pvSystemData.annualPVProduction,
          tariffTension: input.tariffTension,
          tariffRegime: input.tariffRegime ?? undefined,
        });
        Logger.info(`✅ Economic analysis completed successfully`);
      } catch (error) {
        Logger.error(`❌ Economic analysis failed:`, error);
        throw error;
      }

      // MT: recompute financials with T_couv sizing (CAPEX/OPEX) and MT first-year savings (E_auto × Tarif)
      if (input.tariffTension === 'MT' && mtAutoconsumption && consumptionData.annualEstimatedConsumption > 0) {
        const year1BillWithout = economicData.annualResults[0]?.annualBillWithoutPV ?? 0;
        const firstYearSavingsMT =
          mtAutoconsumption.selfConsumedEnergy * (year1BillWithout / consumptionData.annualEstimatedConsumption);
        economicData = analyzeEconomics({
          monthlyBilledConsumptions,
          monthlyRawConsumptions: monthlyConsumptions,
          installedPowerKwp: pvSystemData.installedPower,
          annualPVProduction: pvSystemData.annualPVProduction,
          tariffTension: input.tariffTension,
          tariffRegime: input.tariffRegime ?? undefined,
          installedPowerKwpOverride: mtAutoconsumption.theoreticalPVPower,
          firstYearSavingsOverride: Number(firstYearSavingsMT.toFixed(2)),
        });
        Logger.info(`✅ MT economic analysis (T_couv sizing): CAPEX from ${mtAutoconsumption.theoreticalPVPower} kWc, first-year savings=${firstYearSavingsMT.toFixed(0)} DT`);
      }

      const simulationData = this.buildSimulationPayload(
        input,
        coordinates,
        solarData,
        consumptionData,
        pvSystemData,
        economicData,
        mtCoverageRate,
        mtSelfConsumptionRatio,
        mtAutoconsumption,
        mtPairIndex
      );

      const simulation = await this.create(simulationData);
      Logger.info(`✅ Simulation created successfully with ID: ${simulation.id}`);

      return simulation;

    } catch (error) {
      Logger.error('Failed to create solar audit simulation', error);

      if (error instanceof HTTP400Error || error instanceof HTTP404Error) {
        throw error;
      }

      throw new HTTP400Error('Failed to create solar audit simulation', error);
    }
  }

  /**
   * Get paginated list of simulations
   * 
   * @param options - Pagination parameters (page, limit)
   * @returns Paginated simulation results
   */
  public async getSimulations(
    options: PaginationOptions
  ): Promise<PaginatedResult<IAuditSolaireSimulation>> {
    const page = this.normalizePage(options.page);
    const limit = this.normalizeLimit(options.limit);

    Logger.info(`Fetching simulations: page=${page}, limit=${limit}`);

    return auditSolaireSimulationRepository.paginate({ page, limit });
  }

  /**
   * Get a single simulation by ID
   * 
   * @param id - Simulation ID
   * @returns Simulation data
   * @throws HTTP404Error - Simulation not found
   */
  public async getSimulationById(id: string): Promise<IAuditSolaireSimulation> {
    Logger.info(`Fetching simulation by ID: ${id}`);

    const simulation = await this.findById(id);

    if (!simulation) {
      throw new HTTP404Error(`Solar audit simulation not found: ${id}`);
    }

    return simulation;
  }

  /**
   * Delete a simulation by ID
   * 
   * @param id - Simulation ID
   * @throws HTTP404Error - Simulation not found
   */
  public async deleteSimulation(id: string): Promise<void> {
    Logger.info(`Deleting simulation: ${id}`);

    const deleted = await this.delete(id);

    if (!deleted) {
      throw new HTTP404Error(`Solar audit simulation not found: ${id}`);
    }

    Logger.info(`Simulation deleted successfully: ${id}`);
  }


  private async resolveGeoCoordinates(input: CreateSimulationInput): Promise<GeoCoordinates> {
    return this.geocodeAddress(input.address);
  }

  private async geocodeAddress(address: string): Promise<GeoCoordinates> {
    const apiKey = EXTERNAL_APIS.GOOGLE_MAPS.API_KEY;


    Logger.info(`Geocoding address: ${address}`);

    try {
      const response = await axios.get(EXTERNAL_APIS.GOOGLE_MAPS.URL, {
        params: { address, key: apiKey },
        timeout: EXTERNAL_APIS.GOOGLE_MAPS.TIMEOUT,
      });

      return this.parseGoogleMapsResponse(response, address);

    } catch (error) {
      Logger.error('Google Maps API request failed', error);
      throw new HTTP400Error('Failed to contact Google Geocoding service', error);
    }
  }


  private parseGoogleMapsResponse(response: AxiosResponse, address: string): GeoCoordinates {
    const { data } = response;

    if (!data) {
      throw new HTTP400Error('Empty response from Google Geocoding service');
    }

    if (data.status !== 'OK') {
      const errorMessage = data.error_message ?? data.status;
      throw new HTTP400Error(
        `Unable to geocode address "${address}": ${errorMessage}`
      );
    }

    const location = data.results?.[0]?.geometry?.location;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new HTTP400Error(
        `Invalid coordinates in geocoding response for address "${address}"`
      );
    }

    Logger.info(`Address geocoded: lat=${location.lat}, lon=${location.lng}`);

    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  }


  private async fetchSolarProductibleFromPVGIS(
    latitude: number,
    longitude: number
  ): Promise<SolarProductibleData> {
    Logger.info(`Fetching solar data from PVGIS: lat=${latitude}, lon=${longitude}`);

    try {
      // Validate coordinates
      PVGISService.validateCoordinates(latitude, longitude);

      const irradianceData = await PVGISService.fetchSolarIrradiance(latitude, longitude);

      // Convert to expected format
      return {
        monthlyProductibleKwhPerKwp: irradianceData.monthlyData.map(month => month['E_m']),
        annualProductibleKwhPerKwp: irradianceData.annualYieldKwhPerKwp,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`PVGIS API request failed: ${errorMessage}`, error);
      
      // Provide more helpful error message
      if (errorMessage.includes('Invalid URL') || errorMessage.includes('ENOTFOUND')) {
        throw new HTTP400Error(
          `PVGIS API URL is invalid or unreachable ` +
          `Please check your PVGIS_API_URL environment variable.`,
          error
        );
      }
      
      throw new HTTP400Error(`Failed to fetch solar irradiation data from PVGIS: ${errorMessage}`, error);
    }
  }



  private buildSimulationPayload(
    input: CreateSimulationInput,
    coordinates: GeoCoordinates,
    solarData: SolarProductibleData,
    consumptionData: ReturnType<typeof extrapolateConsumption>,
    pvSystemData: ReturnType<typeof calculatePVProduction>,
    economicData: ReturnType<typeof analyzeEconomics>,
    mtCoverageRate: number | null,
    mtSelfConsumptionRatio: number | null,
    mtAutoconsumption: PVAutoconsumptionResult | null,
    mtPairIndex: OperatingHoursPairIndex | null
  ): ICreateAuditSolaireSimulation {
    const payload = {
      address: input.address,
      fullName: input.fullName,
      companyName: input.companyName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      buildingType: input.buildingType,
      climateZone: input.climateZone,

      measuredAmount: input.measuredAmountTnd,
      referenceMonth: input.referenceMonth,

      baseConsumption: consumptionData.baseConsumption,
      monthlyConsumptions: consumptionData.monthlyConsumptions,
      annualConsumption: consumptionData.annualEstimatedConsumption,

      annualProductible: solarData.annualProductibleKwhPerKwp,

      installedPower: pvSystemData.installedPower,
      annualProducible: pvSystemData.annualProducible,
      expectedProduction: pvSystemData.annualPVProduction,
      systemSize_kWp: pvSystemData.installedPower, // Alias for compatibility
      energyCoverageRate: pvSystemData.energyCoverageRate,

      monthlyPVProductions: pvSystemData.monthlyProductions,

      installationCost: economicData.investmentCost,
      annualOpex: economicData.annualMaintenanceCost,
      annualSavings: economicData.monthlyResults.reduce(
        (sum, month) => sum + month.monthlySavings,
        0
      ),
      totalSavings25Years: economicData.totalSavings25Years,
      coverage: pvSystemData.energyCoverageRate, // Alias for compatibility
      simplePaybackYears: economicData.simplePaybackYears,
      discountedPaybackYears: economicData.discountedPaybackYears,
      roi25Years: economicData.returnOnInvestmentPercent,
      npv: economicData.netPresentValue,
      irr: economicData.internalRateOfReturnPercent,
      annualCo2Avoided: economicData.annualCo2Avoided,
      totalCo2Avoided25Years: economicData.totalCo2Avoided25Years,

      monthlyEconomics: economicData.monthlyResults,
      annualEconomics: economicData.annualResults,

      // Extract first year economic summary
      annualBillWithoutPV: economicData.annualResults[0]?.annualBillWithoutPV || 0,
      annualBillWithPV: economicData.annualResults[0]?.annualBillWithPV || 0,
      averageAnnualSavings: economicData.annualResults[0]?.annualSavings || 0,

      paybackMonths: economicData.simplePaybackYears,

      // Optional MT-specific autoconsumption metadata
      mtPairIndex: input.tariffTension === 'MT' ? mtPairIndex : null,
      mtOperatingHoursCase: input.tariffTension === 'MT' ? input.operatingHoursCase ?? null : null,
      mtCoverageRate: input.tariffTension === 'MT' ? mtCoverageRate : null,
      mtSelfConsumptionRatio: input.tariffTension === 'MT' ? mtSelfConsumptionRatio : null,
      mtTheoreticalPVPower: input.tariffTension === 'MT' ? mtAutoconsumption?.theoreticalPVPower ?? null : null,
      mtAnnualPVProduction: input.tariffTension === 'MT' ? mtAutoconsumption?.annualPVProduction ?? null : null,
      mtSelfConsumedEnergy: input.tariffTension === 'MT' ? mtAutoconsumption?.selfConsumedEnergy ?? null : null,
      mtGridSurplus: input.tariffTension === 'MT' ? mtAutoconsumption?.gridSurplus ?? null : null,
      mtActualCoverageRate: input.tariffTension === 'MT' ? mtAutoconsumption?.actualCoverageRate ?? null : null,
      mtSurplusFraction: input.tariffTension === 'MT' ? mtAutoconsumption?.surplusFraction ?? null : null,
      mtSurplusWithinLimit: input.tariffTension === 'MT' ? mtAutoconsumption?.surplusWithinLimit ?? null : null,
    } as unknown as ICreateAuditSolaireSimulation;

    return payload;
  }


  /**
   * Normalize page number to valid positive integer
   */
  private normalizePage(page?: number): number {
    return Number.isFinite(page) && page && page > 0
      ? page
      : PAGINATION_DEFAULTS.DEFAULT_PAGE;
  }

  /**
   * Normalize limit to valid range [1, MAX_LIMIT]
   */
  private normalizeLimit(limit?: number): number {
    const rawLimit = Number.isFinite(limit) && limit && limit > 0
      ? limit
      : PAGINATION_DEFAULTS.DEFAULT_LIMIT;

    return Math.min(rawLimit, PAGINATION_DEFAULTS.MAX_LIMIT);
  }
}


export const auditSolaireSimulationService = new AuditSolaireSimulationService();

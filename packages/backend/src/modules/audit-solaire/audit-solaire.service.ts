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
import { convertAmountToConsumption } from '../audit-energetique/helpers/progressive-tariff.calculator';
import { PVGISService } from '@shared/services/pvgis.service';



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


export interface CreateSimulationInput {
  address: string;
  buildingType: BuildingTypes;
  climateZone: ClimateZones;
  measuredAmountTnd: number;
  referenceMonth: number;
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
      const consumptionConversion = convertAmountToConsumption({
        monthlyAmount: input.measuredAmountTnd
      });
      
      const coordinates = await this.resolveGeoCoordinates(input);

      const solarData = await this.fetchSolarProductibleFromPVGIS(coordinates.latitude, coordinates.longitude);

      const consumptionData = extrapolateConsumption({
        measuredConsumption: consumptionConversion.monthlyConsumption,
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

      let economicData;
      try {
        economicData = analyzeEconomics({
          monthlyBilledConsumptions,
          monthlyRawConsumptions: monthlyConsumptions,
          installedPowerKwp: pvSystemData.installedPower,
          annualPVProduction: pvSystemData.annualPVProduction,
        });
        Logger.info(`✅ Economic analysis completed successfully`);
      } catch (error) {
        Logger.error(`❌ Economic analysis failed:`, error);
        throw error;
      }

      const simulationData = this.buildSimulationPayload(input, coordinates, solarData, consumptionData, pvSystemData, economicData);

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
      Logger.error('PVGIS API request failed', error);
      throw new HTTP400Error('Failed to fetch solar irradiation data from PVGIS', error);
    }
  }



  private buildSimulationPayload(
    input: CreateSimulationInput,
    coordinates: GeoCoordinates,
    solarData: SolarProductibleData,
    consumptionData: ReturnType<typeof extrapolateConsumption>,
    pvSystemData: ReturnType<typeof calculatePVProduction>,
    economicData: ReturnType<typeof analyzeEconomics>
  ): ICreateAuditSolaireSimulation {
    return {
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
    };
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

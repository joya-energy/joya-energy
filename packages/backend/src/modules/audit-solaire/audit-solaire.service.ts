import CommonService from '@backend/modules/common/common.service';
import {
  type IAuditSolaireSimulation,
  type ICreateAuditSolaireSimulation,
  type IUpdateAuditSolaireSimulation
} from '@shared/interfaces';
import { auditSolaireSimulationRepository } from './audit-solaire.repository';
import axios, { type AxiosResponse } from 'axios';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { PaginationOptions, PaginatedResult } from '@shared/interfaces/pagination.interface';
import { Logger } from '@backend/middlewares';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';
import { extrapolateConsumption } from './helpers/consumption-extrapolation.calculator';
import { calculatePVProduction } from './helpers/pv-production.calculator';
import { analyzeEconomics } from './helpers/economic-analysis.calculator';





const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

const EXTERNAL_APIS = {
  GOOGLE_MAPS: {
    URL: process.env.GOOGLE_MAPS_API_URL ?? '',
    API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
    TIMEOUT: Number(process.env.EXTERNAL_APIS_TIMEOUT) || 10000,
  },
  PVGIS: {
    // PVGIS API v5.2 - Default URL if not configured
    URL: process.env.PVGIS_API_URL ?? 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc',
    DEFAULT_PEAK_POWER: 1,
    DEFAULT_SYSTEM_LOSS: 14,
    DEFAULT_PANEL_ANGLE: 30,
    USE_HORIZON: 1,
    TIMEOUT: Number(process.env.EXTERNAL_APIS_TIMEOUT) || 30000,
  },
} as const;


export interface CreateSimulationInput {
  address: string; 
  buildingType: BuildingTypes;
  climateZone: ClimateZones;
  measuredConsumptionKwh: number;
  referenceMonth: number; 
}

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

interface PVGISMonthlyData {
  month: number;
  'E_d': number; // Daily energy output (kWh/day)
  'E_m': number; // Monthly energy output (kWh/month)
  'H(i)_d': number; // Daily irradiation (kWh/m²/day)
  'H(i)_m': number; // Monthly irradiation (kWh/m²/month)
  'SD_m': number; // Standard deviation
}

interface PVGISResponse {
  outputs: {
    monthly: {
      fixed: PVGISMonthlyData[];
    };
  };
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
    Logger.info(
      `Creating solar audit simulation: ${input.buildingType} in ${input.climateZone}, ` +
      `${input.measuredConsumptionKwh} kWh measured in month ${input.referenceMonth}`
    );

    try {
      const coordinates = await this.resolveGeoCoordinates(input);
      Logger.info(`Geographic coordinates: lat=${coordinates.latitude}, lon=${coordinates.longitude}`);

      const solarData = await this.fetchSolarProductibleFromPVGIS(coordinates.latitude, coordinates.longitude);
      Logger.info(`Solar data fetched: ${solarData.annualProductibleKwhPerKwp.toFixed(2)} kWh/kWp/year`);

      const consumptionData = extrapolateConsumption({
        measuredConsumption: input.measuredConsumptionKwh,
        referenceMonth: input.referenceMonth,
        buildingType: input.buildingType,
        climateZone: input.climateZone,
      });
      Logger.info(`Monthly consumption extrapolated ${JSON.stringify(consumptionData.monthlyConsumptions)}`)
      Logger.info(`Annual consumption extrapolated: ${consumptionData.annualEstimatedConsumption} kWh/year`);

      const monthlyConsumptions = consumptionData.monthlyConsumptions.map(mc => mc.estimatedConsumption);

      const pvSystemData = calculatePVProduction({
       annualConsumption: consumptionData.annualEstimatedConsumption,
        annualProductible: solarData.annualProductibleKwhPerKwp,
        monthlyProductible: solarData.monthlyProductibleKwhPerKwp,
        monthlyConsumptions,
      });
      Logger.info(
        `PV system sized: ${pvSystemData.installedPower} kWp, ` +
        `production: ${pvSystemData.annualPVProduction} kWh/year, ` +
        `coverage: ${pvSystemData.energyCoverageRate}%`
      );

      const economicData = analyzeEconomics({
        monthlyBilledConsumptions: pvSystemData.monthlyProductions.map(mp => mp.netConsumption),
        monthlyRawConsumptions: monthlyConsumptions,
        installedPowerKwp: pvSystemData.installedPower,
      });
      
      // Validate that economic analysis produced valid results
      if (economicData.netPresentValue === null || economicData.netPresentValue === undefined) {
        throw new Error('Economic analysis failed: NPV is null or undefined');
      }
      if (economicData.internalRateOfReturnPercent === null || economicData.internalRateOfReturnPercent === undefined) {
        throw new Error('Economic analysis failed: IRR is null or undefined');
      }
      if (economicData.returnOnInvestmentPercent === null || economicData.returnOnInvestmentPercent === undefined) {
        throw new Error('Economic analysis failed: ROI is null or undefined');
      }
      
      Logger.info(
        `Economic analysis: Investment=${economicData.investmentCost} DT, ` +
        `NPV=${economicData.netPresentValue} DT, IRR=${economicData.internalRateOfReturnPercent}%, ` +
        `Payback=${economicData.simplePaybackYears} years`
      );

      const simulationData = this.buildSimulationPayload(input, coordinates, solarData, consumptionData, pvSystemData, economicData);

      const simulation = await this.create(simulationData);
      Logger.info(`Simulation created successfully with ID: ${simulation.id}`);

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

    const apiUrl = process.env.PVGIS_API_URL ?? EXTERNAL_APIS.PVGIS.URL;
    
    if (!apiUrl || apiUrl.trim() === '') {
      Logger.error('❌ PVGIS_API_URL is not configured. Using default URL.');
      throw new HTTP400Error(
        'PVGIS_API_URL is not configured. ' +
        'Please add PVGIS_API_URL=https://re.jrc.ec.europa.eu/api/v5_2/PVcalc to your .env file. ' +
        'Or the default URL will be used if configured in code.'
      );
    }

    const requestParams = {
      lat: latitude,
      lon: longitude,
      peakpower: EXTERNAL_APIS.PVGIS.DEFAULT_PEAK_POWER,
      loss: EXTERNAL_APIS.PVGIS.DEFAULT_SYSTEM_LOSS,
      angle: EXTERNAL_APIS.PVGIS.DEFAULT_PANEL_ANGLE,
      usehorizon: EXTERNAL_APIS.PVGIS.USE_HORIZON,
      outputformat: 'json',
    };

    try {
      Logger.info(`PVGIS API URL: ${apiUrl}`);
      Logger.info(`PVGIS Request params:`, requestParams);
      
      const response = await axios.get<PVGISResponse>(apiUrl, {
        params: requestParams,
        timeout: EXTERNAL_APIS.PVGIS.TIMEOUT,
      });

      return this.parsePVGISResponse(response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`PVGIS API request failed: ${errorMessage}`, error);
      
      // Provide more helpful error message
      if (errorMessage.includes('Invalid URL') || errorMessage.includes('ENOTFOUND')) {
        throw new HTTP400Error(
          `PVGIS API URL is invalid or unreachable: ${apiUrl}. ` +
          `Please check your PVGIS_API_URL environment variable.`,
          error
        );
      }
      
      throw new HTTP400Error(`Failed to fetch solar irradiation data from PVGIS: ${errorMessage}`, error);
    }
  }

  /**
   * Parse and validate PVGIS API response
   */
  private parsePVGISResponse(response: AxiosResponse<PVGISResponse>): SolarProductibleData {
    const { data } = response;

    if (!data?.outputs?.monthly?.fixed) {
      throw new HTTP400Error('Invalid response structure from PVGIS API');
    }

    const monthlyData = data.outputs.monthly.fixed as PVGISMonthlyData[];

    if (!Array.isArray(monthlyData) || monthlyData.length !== 12) {
      throw new HTTP400Error(
        `PVGIS returned ${monthlyData?.length ?? 0} months, expected 12`
      );
    }

    const monthlyProductibleKwhPerKwp = monthlyData.map(item => {
      const value = item['E_m'];
      if (typeof value !== 'number' || isNaN(value)) {
        throw new HTTP400Error('Invalid monthly energy value from PVGIS');
      }
      return value;
    });

    const annualProductibleKwhPerKwp = monthlyProductibleKwhPerKwp.reduce(
      (sum, value) => sum + value,
      0
    );

    Logger.info(
      `PVGIS data parsed: ${annualProductibleKwhPerKwp.toFixed(2)} kWh/kWp/year ` +
      `(monthly: ${monthlyProductibleKwhPerKwp.map(v => v.toFixed(1)).join(', ')})`
    );

    return {
      monthlyProductibleKwhPerKwp,
      annualProductibleKwhPerKwp,
    };
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

      measuredConsumption: input.measuredConsumptionKwh,
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

      monthlyEconomics: economicData.monthlyResults,
      annualEconomics: economicData.annualResults,

      paybackYears: economicData.simplePaybackYears,
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

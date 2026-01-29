import CommonService from '@backend/modules/common/common.service';
import {
  type IAuditSolaireSimulation,
  type ICreateAuditSolaireSimulation,
  type IUpdateAuditSolaireSimulation
} from '@shared/interfaces';
import { auditSolaireSimulationRepository } from './audit-solaire.repository';
import axios, { type AxiosError } from 'axios';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { PaginationOptions, PaginatedResult } from '@shared/interfaces/pagination.interface';
import { Logger } from '@backend/middlewares';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const SURFACE_PER_KWP = 6; // m² per kWp
const PANEL_EFFICIENCY = 0.2;
const SYSTEM_LOSSES = 0.8;
const DEFAULT_COST_PER_KWP = 3000; // TND
const DEFAULT_ENERGY_COST_PER_KWH = 0.35; // TND

interface CreateAuditSolaireInput {
  address: string;
  surfaceArea: number;
  annualConsumption: number;
  energyCostPerKwh?: number;
  latitude?: number;
  longitude?: number;
}

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

interface NasaDailyResponse {
  properties?: {
    parameter?: {
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
    };
  };
}

export class AuditSolaireSimulationService extends CommonService<
  IAuditSolaireSimulation,
  ICreateAuditSolaireSimulation,
  IUpdateAuditSolaireSimulation
> {
  constructor() {
    super(auditSolaireSimulationRepository);
  }

  public async createSimulation(input: CreateAuditSolaireInput): Promise<IAuditSolaireSimulation & { address: string }> {
    const { latitude, longitude } = await this.resolveCoordinates(input);
    const annualIrradiation = await this.fetchAnnualIrradiation(latitude, longitude);

    const systemSize_kWp = Number((input.surfaceArea / SURFACE_PER_KWP).toFixed(2));
    const expectedProduction = Number(
      (annualIrradiation * input.surfaceArea * PANEL_EFFICIENCY * SYSTEM_LOSSES).toFixed(2)
    );
    const costPerKwp = Number(process.env.SOLAR_COST_PER_KWP ?? DEFAULT_COST_PER_KWP);
    const installationCost = Number((systemSize_kWp * costPerKwp).toFixed(2));
    const energyCostPerKwh = Number(input.energyCostPerKwh ?? process.env.ENERGY_COST_PER_KWH ?? DEFAULT_ENERGY_COST_PER_KWH);

    const matchedConsumption = Math.min(expectedProduction, input.annualConsumption);
    const annualSavings = Number((matchedConsumption * energyCostPerKwh).toFixed(2));
    const coverage = input.annualConsumption > 0 ? Number((expectedProduction / input.annualConsumption).toFixed(2)) : 0;
    const paybackYears = annualSavings > 0 ? Number((installationCost / annualSavings).toFixed(2)) : 0;

    const simulationPayload: ICreateAuditSolaireSimulation & IUpdateAuditSolaireSimulation = {
      latitude,
      longitude,
      surfaceArea: input.surfaceArea,
      annualConsumption: input.annualConsumption,
      annualIrradiation,
      expectedProduction,
      systemSize_kWp,
      installationCost,
      annualSavings,
      coverage,
      paybackYears
    };

    const simulation = await this.create(simulationPayload);

    return {
      ...simulation,
      address: input.address
    };
  }

  public async getSimulations(options: PaginationOptions): Promise<PaginatedResult<IAuditSolaireSimulation>> {
    const page = Number.isFinite(options.page) && options.page && options.page > 0 ? options.page : DEFAULT_PAGE;
    const rawLimit = Number.isFinite(options.limit) && options.limit && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, MAX_LIMIT);

    return auditSolaireSimulationRepository.paginate({ page, limit });
  }

  public async getSimulationById(id: string): Promise<IAuditSolaireSimulation> {
    const simulation = await this.findById(id);

    if (!simulation) {
      throw new HTTP404Error('Solar audit simulation not found');
    }

    return simulation;
  }

  public async deleteSimulation(id: string): Promise<void> {
    const deleted = await this.delete(id);

    if (!deleted) {
      throw new HTTP404Error('Solar audit simulation not found');
    }
  }

  private async resolveCoordinates(input: CreateAuditSolaireInput): Promise<GeoCoordinates> {
    if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
      return { latitude: input.latitude, longitude: input.longitude };
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const googleApiUrl = process.env.GOOGLE_MAPS_API_URL ?? 'https://maps.googleapis.com/maps/api/geocode/json';

    if (!apiKey) {
      throw new HTTP400Error('Google Maps API key is not configured');
    }

    if (!googleApiUrl) {
      throw new HTTP400Error('Google Maps API URL is not configured');
    }

    let response;
    try {
      response = await axios.get(googleApiUrl, {
        params: {
          address: input.address,
          key: apiKey
        }
      });
    } catch (error) {
      throw new HTTP400Error('Failed to contact Google Geocoding service', error);
    }

    const { data } = response;

    if (!data || data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
      const reason = data?.error_message ?? data?.status ?? 'unknown';
      throw new HTTP400Error(`Unable to resolve address to coordinates (Google status: ${reason})`);
    }

    const location = data.results[0]?.geometry?.location;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new HTTP400Error('Google Geocoding response did not include coordinates');
    }

    Logger.info('Google Geocoding resolved coordinates', { lat: location.lat, lng: location.lng });

    return {
      latitude: location.lat,
      longitude: location.lng
    };
  }

  private async fetchAnnualIrradiation(latitude: number, longitude: number): Promise<number> {
    const year = new Date().getFullYear() - 1;
    const start = `${year}0101`;
    const end = `${year}1231`;

    const nasaPowerApiUrl = process.env.NASA_POWER_API_URL ?? 'https://power.larc.nasa.gov/api/temporal/daily/point';
    const nasaPowerCommunity = process.env.NASA_POWER_COMMUNITY ?? 'RE';
    Logger.info(`NASA POWER API URL: ${nasaPowerApiUrl}`);
    if (!nasaPowerApiUrl) {
      throw new HTTP400Error('NASA POWER API URL is not configured');
    }

    let response;
    try {
      response = await axios.get<NasaDailyResponse>(nasaPowerApiUrl, {
        params: {
          parameters: process.env.NASA_POWER_PARAMETER ?? 'ALLSKY_SFC_SW_DWN',
          latitude,
          longitude,
          start,
          end,
          format: 'JSON',
          community: nasaPowerCommunity
        }
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      const data = axiosError.response?.data;
      Logger.error('NASA POWER request failed', { status, statusText, data });
      const explanation = typeof data === 'string' ? data : JSON.stringify(data);
      throw new HTTP400Error(
        `Failed to contact NASA POWER service (status: ${status ?? 'unknown'} - ${statusText ?? 'no status text'}) - ${explanation}`,
        error
      );
    }

    const values = response.data?.properties?.parameter?.ALLSKY_SFC_SW_DWN;

    if (!values || Object.keys(values).length === 0) {
      throw new HTTP400Error('NASA POWER irradiation data not available for the provided coordinates');
    }

    const annualIrradiation = Object.values(values).reduce((total, value) => total + Number(value ?? 0), 0);

    return Number(annualIrradiation.toFixed(2));
  }
}

export const auditSolaireSimulationService = new AuditSolaireSimulationService();

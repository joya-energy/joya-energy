/**
 * PVGIS Service
 * Shared service for fetching solar irradiance data from PVGIS API
 * Used across different modules (audit-solaire, financing-comparison, etc.)
 */

import axios, { type AxiosResponse } from 'axios';

export interface PVGISMonthlyData {
  month: number;
  'E_d': number; // Daily energy output (kWh/day)
  'E_m': number; // Monthly energy output (kWh/month)
  'H(i)_d': number; // Daily irradiation (kWh/m²/day)
  'H(i)_m': number; // Monthly irradiation (kWh/m²/month)
  'SD_m': number; // Standard deviation
}

export interface PVGISResponse {
  outputs: {
    monthly: {
      fixed: PVGISMonthlyData[];
    };
  };
}

export interface SolarIrradianceData {
  monthlyData: PVGISMonthlyData[];
  annualYieldKwhPerKwp: number;
}

export class PVGISService {
  private static readonly API_CONFIG = {
    URL: process.env['PVGIS_API_URL'] ?? 'https://re.jrc.ec.europa.eu/api/PVcalc',
    DEFAULT_PEAK_POWER: 1, // 1 kWp
    DEFAULT_SYSTEM_LOSS: 14, // 14% system losses
    DEFAULT_PANEL_ANGLE: 30, // 30° tilt angle
    USE_HORIZON: 1, // Use horizon data
    TIMEOUT: Number(process.env['EXTERNAL_APIS_TIMEOUT']) || 30000, // 30 seconds
  } as const;

  /**
   * Fetch solar irradiance data for given coordinates
   * @param latitude - Latitude in decimal degrees
   * @param longitude - Longitude in decimal degrees
   * @returns Solar irradiance data including monthly and annual yields
   */
  public static async fetchSolarIrradiance(
    latitude: number,
    longitude: number
  ): Promise<SolarIrradianceData> {
    const requestParams = {
      lat: latitude,
      lon: longitude,
      peakpower: this.API_CONFIG.DEFAULT_PEAK_POWER,
      loss: this.API_CONFIG.DEFAULT_SYSTEM_LOSS,
      angle: this.API_CONFIG.DEFAULT_PANEL_ANGLE,
      usehorizon: this.API_CONFIG.USE_HORIZON,
      outputformat: 'json',
    };

    try {
      const response = await axios.get<PVGISResponse>(this.API_CONFIG.URL, {
        params: requestParams,
        timeout: this.API_CONFIG.TIMEOUT,
      });

      return this.parseResponse(response);
    } catch (error) {
      throw new Error(`PVGIS API request failed: ${error}`);
    }
  }

  /**
   * Parse PVGIS API response into usable data structure
   */
  private static parseResponse(response: AxiosResponse<PVGISResponse>): SolarIrradianceData {
    const { data } = response;

    if (!data?.outputs?.monthly?.fixed) {
      throw new Error('Invalid response structure from PVGIS API');
    }

    const monthlyData = data.outputs.monthly.fixed;

    if (!Array.isArray(monthlyData) || monthlyData.length !== 12) {
      throw new Error(
        `PVGIS returned ${monthlyData?.length ?? 0} months, expected 12`
      );
    }

    // Calculate annual yield
    const annualYieldKwhPerKwp = monthlyData.reduce(
      (sum, month) => sum + (month['E_m'] || 0),
      0
    );

    return {
      monthlyData,
      annualYieldKwhPerKwp: Math.round(annualYieldKwhPerKwp),
    };
  }

  /**
   * Validate that coordinates are within reasonable bounds
   */
  public static validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }
}

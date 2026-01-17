/**
 * Location Service
 * Handles fetching solar irradiance data for Tunisian governorates
 * Uses shared PVGIS service for accurate yield calculations
 */

import { Governorates } from '@shared/enums/audit-general.enum';
import { PVGISService } from '@shared/services/pvgis.service';
import { getGovernorateCoordinates } from '@backend/domain/financing/governorate-coordinates';
import { Logger } from '@backend/middlewares/logger.midddleware';

// Cache for PVGIS responses to avoid repeated API calls
const yieldCache = new Map<Governorates, number>();

export class LocationService {
  /**
   * Get solar yield for a specific governorate
   * Uses PVGIS API with caching for performance
   */
  public async getYieldForGovernorate(governorate: Governorates): Promise<number> {
    // Check cache first
    if (yieldCache.has(governorate)) {
      const cached = yieldCache.get(governorate)!;
      Logger.info(`Using cached yield for ${governorate}: ${cached} kWh/kWp/year`);
      return cached;
    }

    try {
      const coordinates = getGovernorateCoordinates(governorate);

      // Validate coordinates
      PVGISService.validateCoordinates(coordinates.latitude, coordinates.longitude);

      const irradianceData = await PVGISService.fetchSolarIrradiance(
        coordinates.latitude,
        coordinates.longitude
      );

      // Cache the result
      yieldCache.set(governorate, irradianceData.annualYieldKwhPerKwp);

      Logger.info(`Fetched yield for ${governorate}: ${irradianceData.annualYieldKwhPerKwp} kWh/kWp/year`);
      return irradianceData.annualYieldKwhPerKwp;

    } catch (error) {
      Logger.error(`Failed to fetch yield for governorate ${governorate}`, error);

      // Fallback to default value if PVGIS fails
      const defaultYield = 1680; // Tunisian average
      Logger.warn(`Using default yield ${defaultYield} kWh/kWp/year for ${governorate}`);

      return defaultYield;
    }
  }

  /**
   * Get solar yields for all governorates
   * Returns a map of governorate to yield
   */
  public async getAllGovernorateYields(): Promise<Record<Governorates, number>> {
    const yields: Partial<Record<Governorates, number>> = {};

    // Process all governorates concurrently for better performance
    const promises = Object.values(Governorates).map(async (governorate) => {
      const yieldValue = await this.getYieldForGovernorate(governorate);
      return { governorate, yieldValue };
    });

    const results = await Promise.all(promises);

    // Build the result map
    results.forEach(({ governorate, yieldValue }) => {
      yields[governorate] = yieldValue;
    });

    return yields as Record<Governorates, number>;
  }

  /**
   * Clear the yield cache
   * Useful for testing or forcing fresh data
   */
  public clearCache(): void {
    yieldCache.clear();
    Logger.info('Yield cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; governorates: Governorates[] } {
    return {
      size: yieldCache.size,
      governorates: Array.from(yieldCache.keys()),
    };
  }
}

export const locationService = new LocationService();
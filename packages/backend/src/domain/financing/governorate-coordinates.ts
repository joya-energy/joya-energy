/**
 * Governorate coordinates for Tunisia
 * Used to fetch solar irradiance data from PVGIS API
 * Coordinates represent approximate center of each governorate
 */

import { Governorates } from '@shared/enums/audit-general.enum';

export interface GovernorateCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Coordinates for Tunisian governorates (approximate centers)
 * Based on geographical data for solar irradiance calculations
 */
export const GOVERNORATE_COORDINATES: Record<Governorates, GovernorateCoordinates> = {
  [Governorates.TUNIS]: { latitude: 36.8065, longitude: 10.1815 },
  [Governorates.ARIANA]: { latitude: 36.8625, longitude: 10.1956 },
  [Governorates.BEN_AROUS]: { latitude: 36.7545, longitude: 10.2220 },
  [Governorates.MANOUBA]: { latitude: 36.8080, longitude: 10.0970 },
  [Governorates.BIZERTE]: { latitude: 37.2744, longitude: 9.8739 },
  [Governorates.BEJA]: { latitude: 36.7256, longitude: 9.1817 },
  [Governorates.JENDOUBA]: { latitude: 36.5011, longitude: 8.7802 },
  [Governorates.KAIROUAN]: { latitude: 35.6781, longitude: 10.0963 },
  [Governorates.KASSERINE]: { latitude: 35.1676, longitude: 8.8365 },
  [Governorates.MEDENINE]: { latitude: 33.3549, longitude: 10.5055 },
  [Governorates.MONASTIR]: { latitude: 35.7833, longitude: 10.8333 },
  [Governorates.NABEUL]: { latitude: 36.4513, longitude: 10.7357 },
  [Governorates.SFAX]: { latitude: 34.7406, longitude: 10.7603 },
  [Governorates.SOUSSE]: { latitude: 35.8256, longitude: 10.6369 },
  [Governorates.TATAOUINE]: { latitude: 32.9297, longitude: 10.4518 },
  [Governorates.TOZEUR]: { latitude: 33.9197, longitude: 8.1339 },
  [Governorates.ZAGHOUAN]: { latitude: 36.4029, longitude: 10.1429 },
  [Governorates.SILIANA]: { latitude: 36.0843, longitude: 9.3708 },
  [Governorates.KEF]: { latitude: 36.1742, longitude: 8.7147 },
  [Governorates.MAHDIA]: { latitude: 35.5047, longitude: 11.0782 },
  [Governorates.SIDI_BOU_ZID]: { latitude: 35.0382, longitude: 9.4849 },
  [Governorates.GABES]: { latitude: 33.8815, longitude: 10.0982 },
  [Governorates.GAFSA]: { latitude: 34.4250, longitude: 8.7842 },
};

/**
 * Get coordinates for a specific governorate
 */
export function getGovernorateCoordinates(governorate: Governorates): GovernorateCoordinates {
  const coordinates = GOVERNORATE_COORDINATES[governorate];
  if (!coordinates) {
    throw new Error(`Coordinates not found for governorate: ${governorate}`);
  }
  return coordinates;
}

/**
 * Get all governorates with their coordinates
 */
export function getAllGovernorateCoordinates(): Record<Governorates, GovernorateCoordinates> {
  return { ...GOVERNORATE_COORDINATES };
}
import { ClimateZones } from '@shared/enums/audit-general.enum';

export interface ClimateWeights {
  heatingFactor: number;
  coolingFactor: number;
  winterWeight: number;
  summerWeight: number;
  midSeasonWeight: number;
}

export const CLIMATE_FACTORS: Record<ClimateZones, ClimateWeights> = {
  [ClimateZones.NORTH]: {
    heatingFactor: 0.95,
    coolingFactor: 1.05,
    winterWeight: 0.3,
    summerWeight: 0.5,
    midSeasonWeight: 0.2
  },
  [ClimateZones.CENTER]: {
    heatingFactor: 1.1,
    coolingFactor: 0.95,
    winterWeight: 0.4,
    summerWeight: 0.4,
    midSeasonWeight: 0.2
  },
  [ClimateZones.SOUTH]: {
    heatingFactor: 0.9,
    coolingFactor: 1.1,
    winterWeight: 0.2,
    summerWeight: 0.55,
    midSeasonWeight: 0.25
  }
};



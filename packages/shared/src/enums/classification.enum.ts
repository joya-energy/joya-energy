/**
 * Classification enums for energy and carbon ratings
 */

export enum ClassificationGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  NOT_APPLICABLE = 'N/A'
}

export enum EnergyUnit {
  KWH_PER_M2_YEAR = 'kWh/m².an',
  KWH_PER_YEAR = 'kWh/an',
  KWH_PER_MONTH = 'kWh/mois',
  TND_PER_YEAR = 'TND/an',
  TND_PER_MONTH = 'TND/mois'
}

export enum EmissionUnit {
  KG_CO2_PER_YEAR = 'kg CO₂/an',
  TONS_CO2_PER_YEAR = 't CO₂/an',
  KG_CO2_PER_M2_YEAR = 'kg CO₂/m².an'
}


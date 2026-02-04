import { BuildingTypes } from '@shared/enums/audit-general.enum';

export interface BuildingCoefficients {
  hvac: number;
  light: number;
  it: number;
  base: number;
  ecs: number;
}

export const BUILDING_COEFFICIENTS: Record<BuildingTypes, BuildingCoefficients> = {
  [BuildingTypes.SERVICE]: { hvac: 80 , light: 24, it: 35, base: 8, ecs: 3 },
  [BuildingTypes.CAFE_RESTAURANT]: { hvac: 90, light: 22, it: 30, base: 10, ecs: 18 },
  [BuildingTypes.BEAUTY_CENTER]: { hvac: 80, light: 18, it: 30, base: 8, ecs: 12 },
  [BuildingTypes.HOTEL_GUESTHOUSE]: { hvac: 110, light: 18, it: 28, base: 10, ecs: 25 },
  [BuildingTypes.CLINIC_MEDICAL]: { hvac: 110, light: 18, it: 28, base: 10, ecs: 22 },
  [BuildingTypes.OFFICE_ADMIN_BANK]: { hvac: 65, light: 14, it: 25, base: 8, ecs: 3 },
  [BuildingTypes.LIGHT_WORKSHOP]: { hvac: 55, light: 10, it: 20, base: 5, ecs: 3 },
  [BuildingTypes.HEAVY_FACTORY]: { hvac: 45, light: 8, it: 30, base: 5, ecs: 3 },
  [BuildingTypes.TEXTILE_PACKAGING]: { hvac: 50, light: 12, it: 35, base: 6, ecs: 3 },
  [BuildingTypes.FOOD_INDUSTRY]: { hvac: 55, light: 15, it: 40, base: 8, ecs: 8 },
  [BuildingTypes.PLASTIC_INJECTION]: { hvac: 60, light: 12, it: 45, base: 8, ecs: 4 },
  [BuildingTypes.COLD_AGRO_INDUSTRY]: { hvac: 70, light: 10, it: 40, base: 10, ecs: 6 },
  [BuildingTypes.SCHOOL_TRAINING]: { hvac: 60, light: 12, it: 15, base: 6, ecs: 5 }
};

export const PROCESS_FACTORS: Record<BuildingTypes, number> = {
  [BuildingTypes.SERVICE]:1.0,
  [BuildingTypes.CAFE_RESTAURANT]: 1.3,
  [BuildingTypes.BEAUTY_CENTER]: 1.3,
  [BuildingTypes.HOTEL_GUESTHOUSE]: 1.0,
  [BuildingTypes.CLINIC_MEDICAL]: 1.0,
  [BuildingTypes.OFFICE_ADMIN_BANK]: 1.0,
  [BuildingTypes.LIGHT_WORKSHOP]: 1.3,
  [BuildingTypes.HEAVY_FACTORY]: 1.6,
  [BuildingTypes.TEXTILE_PACKAGING]: 1.6,
  [BuildingTypes.FOOD_INDUSTRY]: 1.6,
  [BuildingTypes.PLASTIC_INJECTION]: 1.6,
  [BuildingTypes.COLD_AGRO_INDUSTRY]: 1.6,
  [BuildingTypes.SCHOOL_TRAINING]: 1.0
};

export const ECS_USAGE_FACTORS: Record<BuildingTypes, number> = {
  [BuildingTypes.SERVICE]:0.7,
  [BuildingTypes.CAFE_RESTAURANT]: 1.0,
  [BuildingTypes.BEAUTY_CENTER]: 1.4,
  [BuildingTypes.HOTEL_GUESTHOUSE]: 1.4,
  [BuildingTypes.CLINIC_MEDICAL]: 1.0,
  [BuildingTypes.OFFICE_ADMIN_BANK]: 0.7,
  [BuildingTypes.LIGHT_WORKSHOP]: 0.7,
  [BuildingTypes.HEAVY_FACTORY]: 0.7,
  [BuildingTypes.TEXTILE_PACKAGING]: 0.7,
  [BuildingTypes.FOOD_INDUSTRY]: 1.0,
  [BuildingTypes.PLASTIC_INJECTION]: 0.7,
  [BuildingTypes.COLD_AGRO_INDUSTRY]: 1.0,
  [BuildingTypes.SCHOOL_TRAINING]: 0.7
};


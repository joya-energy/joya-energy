import { BuildingTypes } from '@shared';
import {
  lucideBox,
  lucideDrumstick,
  lucideFactory,
  lucideGraduationCap,
  lucideHammer,
  lucideHotel,
  lucidePill,
  lucideSnowflake,
  lucideSparkles,
  lucideStethoscope,
  lucideBuilding2,
  lucideShirt,
  lucideUtensilsCrossed
} from '@ng-icons/lucide';

export const BUILDING_ICON_REGISTRY = {
  lucidePill,
  lucideUtensilsCrossed,
  lucideBuilding2,
  lucideHammer,
  lucideHotel,
  lucideStethoscope,
  lucideFactory,
  lucideGraduationCap,
  lucideSparkles,
  lucideShirt,
  lucideDrumstick,
  lucideBox,
  lucideSnowflake
};

export type BuildingIconName = keyof typeof BUILDING_ICON_REGISTRY;

export interface BuildingCardConfig {
  id: BuildingTypes;
  label: string;
  icon: BuildingIconName;
}

export const BUILDING_CARD_CONFIG: BuildingCardConfig[] = [
  { id: BuildingTypes.CAFE_RESTAURANT, label: BuildingTypes.CAFE_RESTAURANT, icon: 'lucideUtensilsCrossed' },
  { id: BuildingTypes.OFFICE_ADMIN_BANK, label: BuildingTypes.OFFICE_ADMIN_BANK, icon: 'lucideBuilding2' },
  { id: BuildingTypes.LIGHT_WORKSHOP, label: BuildingTypes.LIGHT_WORKSHOP, icon: 'lucideHammer' },
  { id: BuildingTypes.HOTEL_GUESTHOUSE, label: BuildingTypes.HOTEL_GUESTHOUSE, icon: 'lucideHotel' },
  { id: BuildingTypes.CLINIC_MEDICAL, label: BuildingTypes.CLINIC_MEDICAL, icon: 'lucideStethoscope' },
  { id: BuildingTypes.HEAVY_FACTORY, label: BuildingTypes.HEAVY_FACTORY, icon: 'lucideFactory' },
  { id: BuildingTypes.SCHOOL_TRAINING, label: BuildingTypes.SCHOOL_TRAINING, icon: 'lucideGraduationCap' },
  { id: BuildingTypes.BEAUTY_CENTER, label: BuildingTypes.BEAUTY_CENTER, icon: 'lucideSparkles' },
  { id: BuildingTypes.TEXTILE_PACKAGING, label: BuildingTypes.TEXTILE_PACKAGING, icon: 'lucideShirt' },
  { id: BuildingTypes.FOOD_INDUSTRY, label: BuildingTypes.FOOD_INDUSTRY, icon: 'lucideDrumstick' },
  { id: BuildingTypes.PLASTIC_INJECTION, label: BuildingTypes.PLASTIC_INJECTION, icon: 'lucideBox' },
  { id: BuildingTypes.COLD_AGRO_INDUSTRY, label: BuildingTypes.COLD_AGRO_INDUSTRY, icon: 'lucideSnowflake' }
];





import { EquipmentCategories } from '@shared/enums/audit-usage.enum';

export interface EquipmentLoadConfig {
  value: number;
  is24h: boolean;
}

export const EQUIPMENT_LOADS: Record<EquipmentCategories, EquipmentLoadConfig> = {
  [EquipmentCategories.LIGHTING]: { value: 0, is24h: false },
  [EquipmentCategories.OFFICE]: { value: 0, is24h: false },
  [EquipmentCategories.COMMERCIAL_COOLING]: { value: 30, is24h: false },
  [EquipmentCategories.KITCHEN]: { value: 25, is24h: false },
  [EquipmentCategories.SPECIFIC_EQUIPMENT]: { value: 10, is24h: false },
  [EquipmentCategories.PRODUCTION_MACHINERY]: { value: 40, is24h: false },
  [EquipmentCategories.COMPRESSORS]: { value: 25, is24h: false },
  [EquipmentCategories.PUMPS_CONVEYORS]: { value: 15, is24h: false },
  [EquipmentCategories.INDUSTRIAL_COLD]: { value: 60, is24h: true },
  [EquipmentCategories.AUXILIARY_EQUIPMENT]: { value: 8, is24h: false }
};

export const PHARMACY_COLD_THRESHOLDS = [
  { maxSurface: 40, energy: 4818 },
  { maxSurface: 80, energy: 6132 },
  { maxSurface: 120, energy: 7446 },
  { maxSurface: Infinity, energy: 10950 }
] as const;



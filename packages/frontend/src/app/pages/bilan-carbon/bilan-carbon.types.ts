/**
 * Bilan Carbone form types and option labels.
 * Values sent to API must match backend domain (BuildingTypes keys, tariff types, etc.).
 */

import { FormControl, FormGroup } from '@angular/forms';
import { ClimateZones, Governorates } from '@shared';

export type ElectricityTariffType = 'BT' | 'MT_UNIFORME' | 'MT_HORAIRE';

/** Tunisian governorates (Ville / Gouvernorat) — sorted alphabetically by label */
export const GOVERNORATE_OPTIONS: { value: string; label: string }[] = Object.values(Governorates)
  .map((g) => ({ value: g, label: g }))
  .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

/** Heat usage keys for backend (THERMAL) */
export const HEAT_USAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'DOMESTIC_HOT_WATER', label: 'Eau chaude sanitaire' },
  { value: 'COOKING_KITCHEN', label: 'Cuisson / cuisine' },
  { value: 'INDUSTRIAL_PROCESS', label: 'Process industriel (four, séchage, vapeur…)' },
  { value: 'SPACE_HEATING', label: 'Chauffage des locaux' },
];

/** Heat energy types for backend */
export const HEAT_ENERGY_OPTIONS: { value: string; label: string }[] = [
  { value: 'NATURAL_GAS', label: 'Gaz naturel' },
  { value: 'DIESEL_FUEL', label: 'Diesel / Fuel' },
  { value: 'LPG', label: 'GPL (bouteilles, propane, butane)' },
  { value: 'UNKNOWN', label: 'Je ne sais pas' },
];

/** Sector options: value = BuildingTypes key for API */
export const SECTOR_OPTIONS: { value: string; label: string }[] = [
  { value: 'OFFICE_ADMIN_BANK', label: 'Bureaux / Administration' },
  { value: 'SERVICE', label: 'Retail / Commerce' },
  { value: 'CAFE_RESTAURANT', label: 'Restauration / Café' },
  { value: 'HOTEL_GUESTHOUSE', label: 'Hôtel / Maison d\'hôtes' },
  { value: 'CLINIC_MEDICAL', label: 'Médical / Clinique' },
  { value: 'LIGHT_WORKSHOP', label: 'Atelier léger' },
  { value: 'FOOD_INDUSTRY', label: 'Industrie alimentaire' },
  { value: 'PLASTIC_INJECTION', label: 'Plastique / Injection' },
  { value: 'TEXTILE_PACKAGING', label: 'Textile / Emballage' },
  { value: 'HEAVY_FACTORY', label: 'Usine lourde' },
  { value: 'COLD_AGRO_INDUSTRY', label: 'Agro réfrigérée' },
];

/** Sector cards for grid (id = sector key for API, icon = lucide icon name for NgIcon) */
export interface SectorCardConfig {
  id: string;
  label: string;
  icon: string;
}

export const SECTOR_CARD_CONFIG: SectorCardConfig[] = [
  { id: 'OFFICE_ADMIN_BANK', label: 'Bureaux / Administration', icon: 'lucideBuilding2' },
  { id: 'SERVICE', label: 'Retail / Commerce', icon: 'lucideBuilding2' },
  { id: 'CAFE_RESTAURANT', label: 'Restauration / Café', icon: 'lucideUtensilsCrossed' },
  { id: 'HOTEL_GUESTHOUSE', label: 'Hôtel', icon: 'lucideHotel' },
  { id: 'CLINIC_MEDICAL', label: 'Médical / Clinique', icon: 'lucideStethoscope' },
  { id: 'LIGHT_WORKSHOP', label: 'Atelier léger', icon: 'lucideHammer' },
  { id: 'FOOD_INDUSTRY', label: 'Industrie alimentaire', icon: 'lucideDrumstick' },
  { id: 'PLASTIC_INJECTION', label: 'Plastique / Injection', icon: 'lucideBox' },
  { id: 'TEXTILE_PACKAGING', label: 'Textile / Emballage', icon: 'lucideShirt' },
  { id: 'HEAVY_FACTORY', label: 'Usine lourde', icon: 'lucideFactory' },
  { id: 'COLD_AGRO_INDUSTRY', label: 'Agro réfrigérée', icon: 'lucideSnowflake' },
];

/** Climate zone options */
export const ZONE_OPTIONS: { value: string; label: string }[] = [
  { value: ClimateZones.NORTH, label: 'Nord' },
  { value: ClimateZones.CENTER, label: 'Centre' },
  { value: ClimateZones.SOUTH, label: 'Sud' },
];

/** Intensity (cold) - backend IntensityLevel */
export const INTENSITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'Faible', label: 'Faible' },
  { value: 'Modérée', label: 'Modérée' },
  { value: 'Élevée', label: 'Élevée' },
];

/** Equipment age - backend EquipmentAge */
export const AGE_OPTIONS: { value: string; label: string }[] = [
  { value: '<3 ans', label: 'Moins de 3 ans' },
  { value: '3-7 ans', label: 'Entre 3 et 7 ans' },
  { value: '>7 ans', label: 'Plus de 7 ans' },
  { value: 'NSP', label: 'Je ne sais pas' },
];

/** Maintenance - backend MaintenanceStatus */
export const MAINTENANCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Oui', label: 'Oui' },
  { value: 'Non', label: 'Non' },
  { value: 'NSP', label: 'Je ne sais pas' },
];

/** Fuel type - backend FuelType */
export const FUEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Essence', label: 'Essence' },
  { value: 'MIXTE', label: 'Mixte' },
];

/** Vehicle usage - backend VehicleUsageType */
export const VEHICLE_USAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Déplacements légers', label: 'Déplacements professionnels légers (visites clients, administration)' },
  { value: 'Livraisons / tournées', label: 'Livraisons ou tournées régulières' },
  { value: 'Transport intensif / lourd', label: 'Transport intensif ou marchandises lourdes' },
];

/** Travel frequency - backend TravelFrequency */
export const TRAVEL_FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'Rare', label: 'Rare (1–2 fois/an)' },
  { value: 'Moyenne', label: 'Moyenne (3–10 fois/an)' },
  { value: 'Fréquente', label: 'Fréquente (>10 fois/an)' },
];

/** Reference month 1-12 */
export const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Fév' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Avr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juil' }, { value: 8, label: 'Août' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Déc' },
];

/** Tariff type for electricity */
export const TARIFF_OPTIONS: { value: ElectricityTariffType; label: string }[] = [
  { value: 'BT', label: 'Basse tension (BT)' },
  { value: 'MT_UNIFORME', label: 'Moyenne tension (MT) – uniforme' },
  { value: 'MT_HORAIRE', label: 'Moyenne tension (MT) – horaire' },
];

// Form group types
export interface GeneralForm {
  companyName: FormControl<string>;
  sector: FormControl<string>;
  cityGovernorate: FormControl<string>;
  zone: FormControl<string>;
  referenceYear: FormControl<number | null>;
  surfaceM2: FormControl<number | null>;
  numberOfEmployees: FormControl<number | null>;
}

export interface ElectricityForm {
  monthlyBillAmountDt: FormControl<number | null>;
  tariffType: FormControl<string>;
  referenceMonth: FormControl<number | null>;
}

export interface HeatForm {
  hasHeatUsages: FormControl<boolean>;
  selectedHeatUsage: FormControl<string | null>;
  selectedHeatEnergy: FormControl<string | null>;
}

export interface ColdForm {
  hasCold: FormControl<boolean>;
  intensity: FormControl<string>;
  equipmentAge: FormControl<string>;
  maintenance: FormControl<string>;
}

export interface VehiclesForm {
  hasVehicles: FormControl<boolean>;
  numberOfVehicles: FormControl<number | null>;
  kmPerVehiclePerYear: FormControl<number | null>;
  fuelType: FormControl<string>;
  usageType: FormControl<string>;
}

export interface TravelForm {
  planeFrequency: FormControl<string | null>;
  trainFrequency: FormControl<string | null>;
}

export interface ITEquipmentForm {
  laptopCount: FormControl<number | null>;
  desktopCount: FormControl<number | null>;
  screenCount: FormControl<number | null>;
  proPhoneCount: FormControl<number | null>;
}

export interface BilanCarbonFormValue {
  general: Partial<{ companyName: string; sector: string; cityGovernorate: string; zone: string; referenceYear: number; surfaceM2: number; numberOfEmployees: number }>;
  electricity: Partial<{ monthlyBillAmountDt: number; tariffType: string; referenceMonth: number }>;
  heat: Partial<{ hasHeatUsages: boolean; selectedHeatUsages: string[]; selectedHeatEnergies: string[] }>;
  cold: Partial<{ hasCold: boolean; intensity: string; equipmentAge: string; maintenance: string }>;
  vehicles: Partial<{ hasVehicles: boolean; numberOfVehicles: number; kmPerVehiclePerYear: number; fuelType: string; usageType: string }>;
  travel: Partial<{ planeFrequency: string | null; trainFrequency: string | null }>;
  itEquipment: Partial<{ laptopCount: number; desktopCount: number; screenCount: number; proPhoneCount: number }>;
}

/**
 * Domain constants for carbon simulation
 * These values represent JOYA's business rules for carbon footprint calculations
 */

/**
 * STEG Electricity Tariffs (DT/kWh)
 * Based on Tunisian electricity pricing structure
 * Source: STEG (Société Tunisienne de l'Électricité et du Gaz)
 */

/**
 * Low Voltage (BT - Basse Tension) Tariffs
 * Tiered pricing based on monthly consumption
 */
export const STEG_BT_TARIFFS = {
  /**
   * Tier 1: 0-200 kWh/month
   */
  TIER_1: {
    maxConsumptionKwh: 200,
    rateDtPerKwh: 0.195,
    totalAmountDt: 39,
  },

  /**
   * Tier 2: 201-300 kWh/month
   */
  TIER_2: {
    maxConsumptionKwh: 300,
    rateDtPerKwh: 0.240,
    totalAmountDt: 72,
  },

  /**
   * Tier 3: 301-500 kWh/month
   */
  TIER_3: {
    maxConsumptionKwh: 500,
    rateDtPerKwh: 0.333,
    totalAmountDt: 166.5,
  },

  /**
   * Tier 4: 501+ kWh/month
   */
  TIER_4: {
    maxConsumptionKwh: Infinity,
    rateDtPerKwh: 0.391,
    totalAmountDt: 195.891,
  },
} as const;

/**
 * Medium Voltage (MT - Moyenne Tension) Tariffs
 */
export const STEG_MT_TARIFFS = {
  /**
   * Uniform tariff (tarif uniforme)
   */
  UNIFORME: {
    rateDtPerKwh: 0.291,
  },

  /**
   * Hourly tariff (tarif horaire)
   */
  HORAIRE: {
    rateDtPerKwh: 0.326, // Assuming 326 refers to 0.326 DT/kWh
  },
} as const;

/**
 * Average electricity price for simple simulator (DT/kWh)
 * Default value for DT → kWh conversion
 * Can be refined by STEG tier later
 */
export const DEFAULT_AVERAGE_ELECTRICITY_PRICE_DT_PER_KWH = 0.391; // DT/kWh

/**
 * Emission Factors (Scope 2 & thermal Scope 1)
 * Facteurs d'émission pour le calcul de l'empreinte carbone
 * Source: Standards internationaux et données tunisiennes
 */

/**
 * CO₂ Emission Factors (kg CO₂e per unit)
 * Based on GHG Protocol and Tunisian energy mix
 */
export const CARBON_EMISSION_FACTORS = {
  /**
   * Electricity emission factor (Scope 2)
   * FE_ELEC = 0.463 kgCO2e/kWh
   * Indirect emissions from purchased electricity
   */
  ELECTRICITY: 0.463, // kgCO2e/kWh

  /**
   * Natural gas emission factor (Scope 1 - heat)
   * FE_GN = 0.185 kgCO2e/kWh
   * Direct emissions from natural gas combustion for heat
   */
  NATURAL_GAS: 0.185, // kgCO2e/kWh

  /**
   * LPG emission factor (Scope 1 - heat) - proxy
   * FE_GPL = 0.240 kgCO2e/kWh
   * Direct emissions from LPG combustion for heat
   * Note: Proxy value
   */
  LPG: 0.240, // kgCO2e/kWh

  /**
   * Thermal mix / unknown emission factor (Scope 1) - proxy
   * FE_TH_MIX = 0.230 kgCO2e/kWh
   * Direct emissions from mixed or unknown thermal energy source
   * Note: Proxy value
   */
  THERMAL_MIX: 0.230, // kgCO2e/kWh

  /**
   * Diesel fuel emission factor (Scope 1 - vehicles)
   * FE_DIESEL_L = 2.50 kgCO2e/litre
   * Direct emissions from diesel fuel consumed by vehicles
   */
  DIESEL_LITRE: 2.50, // kgCO2e/litre
} as const;

/**
 * Thermal Ratio by Sector (r_th)
 * Ratio thermique par secteur
 * 
 * Used to estimate thermal energy consumption from electricity consumption
 * when thermal bills are not available (screening approach)
 * 
 * Formula: Thermal consumption (kWh) = Electricity consumption (kWh) × r_th
 */
export const THERMAL_RATIO_BY_SECTOR = {
  /**
   * Bureaux / Administration / Banque
   * r_th = 0.15
   */
  OFFICE_ADMIN_BANK: 0.15,

  /**
   * Retail / Commerce / Service Tertiaire
   * r_th = 0.10
   */
  SERVICE: 0.10,

  /**
   * Restauration / Café
   * r_th = 0.60
   */
  CAFE_RESTAURANT: 0.60,

  /**
   * Hôtel / Maison d'hôtes
   * r_th = 0.50
   */
  HOTEL_GUESTHOUSE: 0.50,

  /**
   * Médical / Clinique
   * r_th = 0.35
   */
  CLINIC_MEDICAL: 0.35,

  /**
   * Atelier léger / Artisanat / Menuiserie
   * r_th = 0.25
   */
  LIGHT_WORKSHOP: 0.25,

  /**
   * Industrie alimentaire
   * r_th = 1.00
   */
  FOOD_INDUSTRY: 1.00,

  /**
   * Plastique / Injection
   * r_th = 0.20
   */
  PLASTIC_INJECTION: 0.20,

  /**
   * Textile / Emballage
   * r_th = 0.40
   */
  TEXTILE_PACKAGING: 0.40,

  /**
   * Usine lourde / Mécanique / Métallurgie
   * r_th = 0.80
   */
  HEAVY_FACTORY: 0.80,

  /**
   * Agro réfrigérée / Industrie agroalimentaire réfrigérée
   * r_th = 0.25
   */
  COLD_AGRO_INDUSTRY: 0.25,

  /**
   * Centre esthétique / Spa
   * Default value when sector not specified
   */
  BEAUTY_CENTER: 0.15, // Default to office-like ratio

  /**
   * École / Centre de formation
   * Default value when sector not specified
   */
  SCHOOL_TRAINING: 0.20, // Default to light workshop-like ratio
} as const;

/**
 * Heat Usage Coefficients (w)
 * Coefficients "usages chaleur" pour ajustement
 * 
 * Used to adjust estimated thermal energy consumption based on selected heat usages
 * User checks usages → we adjust the estimated heat
 * 
 * These weights (w) are used to modulate the thermal consumption estimate
 */
export const HEAT_USAGE_COEFFICIENTS = {
  /**
   * Eau chaude sanitaire (Domestic hot water)
   * w = 0.25
   */
  DOMESTIC_HOT_WATER: 0.25,

  /**
   * Cuisson / cuisine (Cooking / kitchen)
   * w = 0.40
   */
  COOKING_KITCHEN: 0.40,

  /**
   * Process industriel (Industrial process)
   * w = 0.70
   */
  INDUSTRIAL_PROCESS: 0.70,

  /**
   * Chauffage des locaux (Space heating)
   * w = 0.30
   */
  SPACE_HEATING: 0.30,
} as const;

/**
 * Cold Type Enum
 * Types de froid pour la classification des systèmes de refroidissement
 */
export enum ColdType {
  /**
   * Confort (Comfort cooling)
   * For office spaces and light workshops
   */
  COMFORT = 'Confort',

  /**
   * Commercial (Commercial cooling)
   * For retail and commercial spaces
   */
  COMMERCIAL = 'Commercial',

  /**
   * Mixte (Mixed cooling)
   * For restaurants, hotels, medical facilities
   */
  MIXED = 'Mixte',

  /**
   * Industriel (Industrial cooling)
   * For industrial processes and heavy factories
   */
  INDUSTRIAL = 'Industriel',
}

/**
 * Automatic Cold Type Deduction by Sector
 * Déduction automatique "type de froid" par secteur
 * 
 * Maps building sectors to their deduced cold type
 * Used to automatically classify cooling/refrigeration systems
 */
export const COLD_TYPE_BY_SECTOR: Record<string, ColdType> = {
  /**
   * Bureaux / Administration / Banque
   * Type de froid déduit: Confort
   */
  OFFICE_ADMIN_BANK: ColdType.COMFORT,

  /**
   * Atelier léger / Artisanat / Menuiserie
   * Type de froid déduit: Confort
   */
  LIGHT_WORKSHOP: ColdType.COMFORT,

  /**
   * Textile / Emballage
   * Type de froid déduit: Confort
   */
  TEXTILE_PACKAGING: ColdType.COMFORT,

  /**
   * Retail / Commerce / Service Tertiaire
   * Type de froid déduit: Commercial
   */
  SERVICE: ColdType.COMMERCIAL,

  /**
   * Restauration / Café
   * Type de froid déduit: Mixte
   */
  CAFE_RESTAURANT: ColdType.MIXED,

  /**
   * Hôtel / Maison d'hôtes
   * Type de froid déduit: Mixte
   */
  HOTEL_GUESTHOUSE: ColdType.MIXED,

  /**
   * Médical / Clinique
   * Type de froid déduit: Mixte
   */
  CLINIC_MEDICAL: ColdType.MIXED,

  /**
   * Industrie alimentaire
   * Type de froid déduit: Industriel
   */
  FOOD_INDUSTRY: ColdType.INDUSTRIAL,

  /**
   * Agro réfrigérée / Industrie agroalimentaire réfrigérée
   * Type de froid déduit: Industriel
   */
  COLD_AGRO_INDUSTRY: ColdType.INDUSTRIAL,

  /**
   * Plastique / Injection
   * Type de froid déduit: Industriel
   */
  PLASTIC_INJECTION: ColdType.INDUSTRIAL,

  /**
   * Usine lourde / Mécanique / Métallurgie
   * Type de froid déduit: Industriel
   */
  HEAVY_FACTORY: ColdType.INDUSTRIAL,

  /**
   * Centre esthétique / Spa
   * Default: Mixte (similar to medical/clinic)
   */
  BEAUTY_CENTER: ColdType.MIXED,

  /**
   * École / Centre de formation
   * Default: Confort (similar to office)
   */
  SCHOOL_TRAINING: ColdType.COMFORT,
} as const;

/**
 * Cold/Climate Parameters by Type
 * Paramètres froid/clim : surface → unités → charge → fuite → CO2e
 * 
 * Parameters for calculating CO2e emissions from refrigerant leaks
 * Based on surface area, unit count, refrigerant charge, and leak rates
 * 
 * GWP (Global Warming Potential) is an indicator of a gas's climatic power,
 * measuring its impact on global warming relative to CO2 over a given period (generally 100 years)
 */
export interface ColdTypeParameters {
  /**
   * Surface per unit (m²/unité)
   * Estimated surface area covered per cooling unit
   */
  surfacePerUnitM2: number;

  /**
   * Unit charge (kg)
   * Typical refrigerant charge per cooling unit in kilograms
   */
  unitChargeKg: number;

  /**
   * Base leak rate (an⁻¹)
   * Annual refrigerant leak rate as a fraction
   */
  annualLeakRate: number;

  /**
   * Average GWP (Global Warming Potential)
   * Average Global Warming Potential for refrigerants typically used
   * Measures impact relative to CO2 over 100 years
   */
  averageGwp: number;
}

/**
 * Cold/Climate Parameters by Cold Type
 * Maps each cold type to its specific parameters
 */
export const COLD_TYPE_PARAMETERS: Record<ColdType, ColdTypeParameters> = {
  /**
   * Confort (Comfort cooling)
   * - Surface per unit: 35 m²/unité
   * - Unit charge: 2 kg
   * - Annual leak rate: 0.10 (10% per year)
   * - Average GWP: 2000
   */
  [ColdType.COMFORT]: {
    surfacePerUnitM2: 35,
    unitChargeKg: 2,
    annualLeakRate: 0.10,
    averageGwp: 2000,
  },

  /**
   * Commercial (Commercial cooling)
   * - Surface per unit: 25 m²/unité
   * - Unit charge: 3 kg
   * - Annual leak rate: 0.12 (12% per year)
   * - Average GWP: 1800
   */
  [ColdType.COMMERCIAL]: {
    surfacePerUnitM2: 25,
    unitChargeKg: 3,
    annualLeakRate: 0.12,
    averageGwp: 1800,
  },

  /**
   * Mixte (Mixed cooling)
   * - Surface per unit: 30 m²/unité
   * - Unit charge: 4 kg
   * - Annual leak rate: 0.15 (15% per year)
   * - Average GWP: 2000
   */
  [ColdType.MIXED]: {
    surfacePerUnitM2: 30,
    unitChargeKg: 4,
    annualLeakRate: 0.15,
    averageGwp: 2000,
  },

  /**
   * Industriel (Industrial cooling)
   * - Surface per unit: 50 m²/unité
   * - Unit charge: 10 kg
   * - Annual leak rate: 0.20 (20% per year)
   * - Average GWP: 1500
   */
  [ColdType.INDUSTRIAL]: {
    surfacePerUnitM2: 50,
    unitChargeKg: 10,
    annualLeakRate: 0.20,
    averageGwp: 1500,
  },
} as const;

/**
 * Form Coefficients
 * Coefficients formulaire (intensité / âge / maintenance)
 * 
 * Adjustment coefficients for carbon calculations based on equipment characteristics
 * Used to modulate calculations based on intensity, age, and maintenance status
 */

/**
 * Intensity Level Enum
 * Niveaux d'intensité d'utilisation
 */
export enum IntensityLevel {
  /**
   * Faible (Low intensity)
   */
  LOW = 'Faible',

  /**
   * Modérée (Moderate intensity)
   */
  MODERATE = 'Modérée',

  /**
   * Élevée (High intensity)
   */
  HIGH = 'Élevée',
}

/**
 * Intensity Coefficients (C_int)
 * Coefficients d'intensité
 * 
 * Used to adjust calculations based on equipment usage intensity
 */
export const INTENSITY_COEFFICIENTS = {
  /**
   * Faible (Low intensity)
   * C_int = 0.8
   */
  [IntensityLevel.LOW]: 0.8,

  /**
   * Modérée (Moderate intensity) - baseline
   * C_int = 1.0
   */
  [IntensityLevel.MODERATE]: 1.0,

  /**
   * Élevée (High intensity)
   * C_int = 1.2
   */
  [IntensityLevel.HIGH]: 1.2,
} as const;

/**
 * Equipment Age Category Enum
 * Catégories d'âge des équipements
 */
export enum EquipmentAge {
  /**
   * <3 ans (Less than 3 years)
   */
  LESS_THAN_3_YEARS = '<3 ans',

  /**
   * 3-7 ans (3 to 7 years)
   */
  BETWEEN_3_AND_7_YEARS = '3-7 ans',

  /**
   * >7 ans (More than 7 years)
   */
  MORE_THAN_7_YEARS = '>7 ans',

  /**
   * NSP (Ne Sait Pas / Not Specified)
   */
  NOT_SPECIFIED = 'NSP',
}

/**
 * Age Coefficients (C_age)
 * Coefficients d'âge
 * 
 * Used to adjust calculations based on equipment age
 * Newer equipment is more efficient (lower coefficient)
 * Older equipment is less efficient (higher coefficient)
 */
export const AGE_COEFFICIENTS = {
  /**
   * <3 ans (Less than 3 years)
   * C_age = 0.8
   * Newer equipment is more efficient
   */
  [EquipmentAge.LESS_THAN_3_YEARS]: 0.8,

  /**
   * 3-7 ans (3 to 7 years) - baseline
   * C_age = 1.0
   */
  [EquipmentAge.BETWEEN_3_AND_7_YEARS]: 1.0,

  /**
   * >7 ans (More than 7 years)
   * C_age = 1.3
   * Older equipment is less efficient
   */
  [EquipmentAge.MORE_THAN_7_YEARS]: 1.3,

  /**
   * NSP (Not Specified)
   * C_age = 1.1
   * Default value when age is unknown (slight penalty compared to baseline)
   */
  [EquipmentAge.NOT_SPECIFIED]: 1.1,
} as const;

/**
 * Maintenance Status Enum
 * Statut de maintenance
 */
export enum MaintenanceStatus {
  /**
   * Oui (Yes - maintenance performed)
   */
  YES = 'Oui',

  /**
   * Non (No - no maintenance)
   */
  NO = 'Non',

  /**
   * NSP (Ne Sait Pas / Not Specified)
   */
  NOT_SPECIFIED = 'NSP',
}

/**
 * Maintenance Coefficients (C_maint)
 * Coefficients de maintenance
 * 
 * Used to adjust calculations based on maintenance status
 * Regular maintenance improves performance (lower coefficient)
 * Lack of maintenance degrades performance (higher coefficient)
 */
export const MAINTENANCE_COEFFICIENTS = {
  /**
   * Oui (Yes - maintenance performed)
   * C_maint = 0.8
   * Regular maintenance results in better performance
   */
  [MaintenanceStatus.YES]: 0.8,

  /**
   * Non (No - no maintenance)
   * C_maint = 1.2
   * Lack of maintenance leads to worse performance
   */
  [MaintenanceStatus.NO]: 1.2,

  /**
   * NSP (Not Specified) - baseline
   * C_maint = 1.0
   * Neutral factor when maintenance status is unknown
   */
  [MaintenanceStatus.NOT_SPECIFIED]: 1.0,
} as const;

/**
 * Professional Vehicles Parameters
 * Véhicules pro : litres/an par véhicule (simplifié, "très réel")
 * 
 * Uses robust averages for professional vehicle fuel consumption and emissions
 */

/**
 * Vehicle Usage Type Enum
 * Types d'usage principal des véhicules professionnels
 */
export enum VehicleUsageType {
  /**
   * Déplacements légers (Light travel/trips)
   */
  LIGHT_TRAVEL = 'Déplacements légers',

  /**
   * Livraisons / tournées (Deliveries / rounds)
   */
  DELIVERIES_ROUNDS = 'Livraisons / tournées',

  /**
   * Transport intensif / lourd (Intensive / heavy transport)
   */
  INTENSIVE_HEAVY = 'Transport intensif / lourd',
}

/**
 * Average Fuel Consumption by Vehicle Usage (L/100 km)
 * Conso_moy par usage principal
 * 
 * Average fuel consumption in liters per 100 km based on principal vehicle usage
 */
export const VEHICLE_CONSUMPTION_BY_USAGE = {
  /**
   * Déplacements légers (Light travel/trips)
   * Conso_moy = 7.5 L/100 km
   */
  [VehicleUsageType.LIGHT_TRAVEL]: 7.5, // L/100 km

  /**
   * Livraisons / tournées (Deliveries / rounds)
   * Conso_moy = 10 L/100 km
   */
  [VehicleUsageType.DELIVERIES_ROUNDS]: 10, // L/100 km

  /**
   * Transport intensif / lourd (Intensive / heavy transport)
   * Conso_moy = 25 L/100 km
   */
  [VehicleUsageType.INTENSIVE_HEAVY]: 25, // L/100 km
} as const;

/**
 * Fuel Type Enum
 * Types de carburant
 */
export enum FuelType {
  /**
   * Diesel
   */
  DIESEL = 'Diesel',

  /**
   * Essence (Gasoline)
   */
  GASOLINE = 'Essence',

  /**
   * MIXTE (Mixed/Hybrid)
   */
  MIXED = 'MIXTE',
}

/**
 * Fuel Emission Factors (kgCO2e/L)
 * Facteurs d'émission par type de carburant
 * 
 * Emission factors for different fuel types used in professional vehicles
 */
export const FUEL_EMISSION_FACTORS = {
  /**
   * Diesel
   * FE = 2.5 kgCO2e/L
   */
  [FuelType.DIESEL]: 2.5, // kgCO2e/L

  /**
   * Essence (Gasoline)
   * FE = 2.28 kgCO2e/L
   */
  [FuelType.GASOLINE]: 2.28, // kgCO2e/L

  /**
   * MIXTE (Mixed/Hybrid)
   * FE = 2.4 kgCO2e/L
   */
  [FuelType.MIXED]: 2.4, // kgCO2e/L
} as const;

/**
 * Professional Travel Parameters (Scope 3)
 * Déplacements pro (Scope 3) — forfaits simples
 * 
 * Simple flat-rate packages for professional travel emissions
 * Without km: we use "rare / medium / frequent" frequency categories
 * Uses robust averages
 */

/**
 * Travel Mode Enum
 * Modes de transport pour les déplacements professionnels
 */
export enum TravelMode {
  /**
   * Avion (Plane)
   */
  PLANE = 'Avion',

  /**
   * Train
   */
  TRAIN = 'Train',
}

/**
 * Travel Frequency Enum
 * Fréquences de déplacement
 */
export enum TravelFrequency {
  /**
   * Rare (Rare)
   */
  RARE = 'Rare',

  /**
   * Moyenne (Medium)
   */
  MEDIUM = 'Moyenne',

  /**
   * Fréquente (Frequent)
   */
  FREQUENT = 'Fréquente',
}

/**
 * Professional Travel Emissions by Mode and Frequency (kgCO2e/year)
 * Émissions CO2 par mode et fréquence de déplacement professionnel
 * 
 * Flat-rate annual CO2e emissions for professional travel
 * Based on frequency categories (rare, medium, frequent) rather than specific distances
 */
export const PROFESSIONAL_TRAVEL_EMISSIONS: Record<TravelMode, Record<TravelFrequency, number>> = {
  /**
   * Avion (Plane)
   * - Rare: 600 kgCO2e/year
   * - Moyenne: 1800 kgCO2e/year
   * - Fréquente: 5000 kgCO2e/year
   */
  [TravelMode.PLANE]: {
    [TravelFrequency.RARE]: 600, // kgCO2e/year
    [TravelFrequency.MEDIUM]: 1800, // kgCO2e/year
    [TravelFrequency.FREQUENT]: 5000, // kgCO2e/year
  },

  /**
   * Train
   * - Rare: 80 kgCO2e/year
   * - Moyenne: 240 kgCO2e/year
   * - Fréquente: 600 kgCO2e/year
   */
  [TravelMode.TRAIN]: {
    [TravelFrequency.RARE]: 80, // kgCO2e/year
    [TravelFrequency.MEDIUM]: 240, // kgCO2e/year
    [TravelFrequency.FREQUENT]: 600, // kgCO2e/year
  },
} as const;

/**
 * IT Equipment Parameters (Scope 3)
 * Équipements IT (Scope 3) — facteurs annuels par unité
 * 
 * Annual emission factors per IT equipment unit
 * Used to calculate Scope 3 emissions from IT equipment usage
 */

/**
 * IT Equipment Type Enum
 * Types d'équipements informatiques
 */
export enum ITEquipmentType {
  /**
   * Ordinateur portable (Laptop)
   */
  LAPTOP = 'Ordinateur portable',

  /**
   * Ordinateur fixe (Desktop computer)
   */
  DESKTOP = 'Ordinateur fixe',

  /**
   * Écran (Screen)
   */
  SCREEN = 'Écran',

  /**
   * Téléphone pro (Professional phone)
   */
  PRO_PHONE = 'Téléphone pro',
}

/**
 * IT Equipment Emissions by Type (kgCO2e/unit/year)
 * Émissions CO2 par type d'équipement IT et par unité
 * 
 * Annual CO2e emissions per IT equipment unit
 * Based on lifecycle assessment of IT equipment usage
 */
export const IT_EQUIPMENT_EMISSIONS = {
  /**
   * Ordinateur portable (Laptop)
   * 120 kgCO2e / unit / year
   */
  [ITEquipmentType.LAPTOP]: 120, // kgCO2e/unit/year

  /**
   * Ordinateur fixe (Desktop computer)
   * 200 kgCO2e / unit / year
   */
  [ITEquipmentType.DESKTOP]: 200, // kgCO2e/unit/year

  /**
   * Écran (Screen)
   * 80 kgCO2e / unit / year
   */
  [ITEquipmentType.SCREEN]: 80, // kgCO2e/unit/year

  /**
   * Téléphone pro (Professional phone)
   * 50 kgCO2e / unit / year
   */
  [ITEquipmentType.PRO_PHONE]: 50, // kgCO2e/unit/year
} as const;

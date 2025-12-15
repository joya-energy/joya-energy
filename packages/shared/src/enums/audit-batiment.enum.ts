export enum InsulationQualities {
  LOW = 'Isolation faible',
  MEDIUM = 'Isolation moyenne',
  HIGH = 'Isolation bonne'
}

export enum GlazingTypes {
  SINGLE = 'Simple vitrage',
  DOUBLE = 'Double vitrage'
}

export enum VentilationSystems {
  NONE = 'Pas de VMC',
  SINGLE_FLOW = 'VMC simple flux',
  DOUBLE_FLOW = 'VMC double flux'
}

export enum Floors {
  SINGLE = '1 étage',
  TWO_OR_THREE = '2 ou 3 étages',
  FOUR_OR_MORE = '4 étages ou plus'
}

export enum HeatingSystemTypes {
  NONE = 'Aucun chauffage',
  ELECTRIC_INDIVIDUAL = 'Chauffage électrique individuel',
  REVERSIBLE_AC = 'Chauffage par climatisation réversible',
  GAS_BOILER = 'Chaudière gaz',
  ELECTRIC_HEATING = 'Chaudiere électrique',
  OTHER = 'Autre système de chauffage'
}

export enum CoolingSystemTypes {
  NONE = 'Aucune climatisation',
  SPLIT = 'Climatisation split',
  CENTRAL = 'Climatisation centrale'
}

export enum ConditionedCoverage {
  FEW_ROOMS = 'Quelques pièces',
  HALF_BUILDING = 'Environ la moitié du bâtiment',
  MOST_BUILDING = 'Presque tout le bâtiment'
}

export enum DomesticHotWaterTypes {
  NONE = 'Aucune production ECS',
  ELECTRIC = 'Chauffe-eau électrique',
  GAS = 'Chaudière gaz',
  SOLAR = 'Chauffe-eau solaire',
  HEAT_PUMP = 'Pompe à chaleur ECS'
}

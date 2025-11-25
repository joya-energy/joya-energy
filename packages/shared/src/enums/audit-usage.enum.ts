export enum LightingTypes {
  INCANDESCENT = 'Ampoules classiques',
  FLUORESCENT = 'Tubes fluorescents',
  LED = 'Éclairage LED'
}
export enum ExistingMeasures {
  LED = 'Éclairage LED déjà installé',
  SOLAR_PV = 'Panneaux photovoltaïques',
  VARIATORS = 'Variateurs de vitesse',
  MONITORING = 'Système de suivi énergétique',
  INSULATION = 'Isolation renforcée',
  OTHER = 'Autres actions d\'efficacité'
}

export enum EquipmentCategories {
  LIGHTING = 'Éclairage (ampoules LED, tubes fluorescents, halogènes)',
  OFFICE = 'Bureautique (ordinateurs, imprimantes, photocopieuses, caisses, etc.)',
  COMMERCIAL_COOLING = 'Froid commercial / Réfrigération (réfrigérateurs, congélateurs, vitrines froides, etc.)',
  KITCHEN = 'Cuisine / Cuisson (fours, plaques de cuisson, hottes, friteuses, etc.)',
  SPECIFIC_EQUIPMENT = 'Équipements spécifiques (clim d’appoint, TV, machines à café, etc.)',
  PRODUCTION_MACHINERY = 'Machines de production / Ateliers (presses, tours, fraiseuses, lignes de production, etc.)',
  COMPRESSORS = 'Compresseurs / Air comprimé',
  PUMPS_CONVEYORS = 'Pompes & Convoyeurs',
  INDUSTRIAL_COLD = 'Froid industriel / Chambres froides',
  AUXILIARY_EQUIPMENT = 'Équipements auxiliaires (informatique industrielle, ventilation, sécurité, éclairage d’atelier, etc.)'
}
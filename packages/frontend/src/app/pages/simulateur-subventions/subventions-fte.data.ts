import type { SubventionCategory, SubventionCategoryKey } from './subventions-fte.types';

export const SUBVENTION_CATEGORIES: Record<SubventionCategoryKey, SubventionCategory> = {
  immateriel: {
    title: 'Investissements immatériels',
    desc: 'Études, audits, accompagnement technique.',
    range: 'Taux unique : 70%',
    type: 'percent',
    items: [
      {
        id: 'audit_energ',
        name: 'Audit énergétique',
        desc: 'Obligatoire pour les établissements industriels (800 tep et +) et les établissements tertiaires et de transport (500 tep et +).',
        taux: 0.7,
        plafond: 30000,
      },
      {
        id: 'consult_prealable',
        name: 'Consultation préalable',
        desc: 'Obligatoire pour les nouveaux projets et les extensions des établissements industriels (800 tep et +).',
        taux: 0.7,
        plafond: 30000,
      },
      {
        id: 'audit_sur_plan',
        name: 'Audit énergétique sur plan',
        desc: 'Obligatoire pour les bâtiments tertiaires et résidentiels collectifs (200 tep et +).',
        taux: 0.7,
        plafond: 30000,
      },
      {
        id: 'etude_faisabilite',
        name: 'Étude de faisabilité',
        desc: "Concerne les études sur la cogénération, les énergies renouvelables raccordées au réseau HT/MT et toutes autres technologies de production et d'optimisation énergétique.",
        taux: 0.7,
        plafond: 30000,
      },
      {
        id: 'accompagnement',
        name: 'Accompagnement et assistance technique',
        desc: "Concerne le recrutement de ressources externes à l'entreprise pour la mise en place d'un plan d'action d'économie d'énergie.",
        taux: 0.7,
        plafond: 70000,
      },
      {
        id: 'etude_territoriale',
        name: 'Étude territoriale',
        desc: "Concerne les études réalisées par les collectivités locales pour optimiser la consommation énergétique du territoire (plans de déplacements urbains, plans d'urbanisme, etc.)",
        taux: 0.7,
        plafond: 200000,
      },
      {
        id: 'autre_immateriel',
        name: 'Autres investissements immatériels',
        desc: "Formation, acquisition de logiciels de gestion énergétique et d'optimisation de la production, etc.",
        taux: 0.7,
        plafond: 70000,
      },
    ],
  },
  materiel: {
    title: 'Investissements matériels',
    desc: 'Équipements, bâtiments, technologies de production.',
    range: 'Taux de 20% à 50%',
    type: 'percent',
    items: [
      {
        id: 'gestion_energie',
        name: "Système de gestion de l'énergie",
        desc: 'Équipements de suivi énergétique, suivi en temps réel des flottes de véhicules, gestion informatisée de ravitaillement.',
        taux: 0.4,
        plafond: 100000,
      },
      {
        id: 'construction_bat',
        name: 'Construction de bâtiments',
        desc: "Surcoût d'investissement dans la construction et l'extension de bâtiments énergétiquement efficaces, équipements performants.",
        taux: 0.3,
        plafond: 200000,
      },
      {
        id: 'renovation_bat',
        name: 'Rénovation des bâtiments',
        desc: "Rénovation de l'enveloppe du bâtiment et des équipements (relamping, relighting, chauffage, climatisation, etc.)",
        taux: 0.3,
        plafond: 200000,
      },
      {
        id: 'clim_gaz',
        name: 'Climatisation au gaz naturel',
        desc: 'Acquisition de solutions de climatisation utilisant le gaz naturel.',
        taux: 0.3,
        plafond: 100000,
      },
      {
        id: 'stockage_froid',
        name: 'Stockage du froid',
        desc: 'Équipements de stockage du froid.',
        taux: 0.3,
        plafond: 100000,
      },
      {
        id: 'chauffage_solaire',
        name: "Chauffage de l'eau par l'énergie solaire",
        desc: "Installations collectives de production d'eau chaude sanitaire par l'énergie solaire. Prime plafonnée à 250 DT par m² de capteur.",
        kind: 'solar_m2',
        taux: 0.3,
        ratePerM2: 250,
      },
      {
        id: 'biogaz',
        name: 'Production du biogaz',
        desc: 'Équipements de valorisation énergétique des déchets par méthanisation.',
        taux: 0.3,
        plafond: 50000,
      },
      {
        id: 'demonstration',
        name: 'Projet de démonstration',
        desc: "Test d'une nouvelle technologie ou d'équipements permettant une réduction de la consommation d'énergie.",
        taux: 0.5,
        plafond: 100000,
      },
      {
        id: 'diagnostic_auto',
        name: 'Station de diagnostic de moteurs automobiles',
        desc: 'Concerne principalement les garagistes, ateliers de maintenance et concessionnaires automobiles.',
        taux: 0.2,
        plafond: 6000,
      },
      {
        id: 'pv_htmt',
        name: 'Photovoltaïque raccordé au réseau HT/MT',
        desc: 'Production d\'électricité par des systèmes photovoltaïques raccordés au réseau haute ou moyenne tension (autoproduction industrielle et tertiaire).',
        taux: 0.2,
        plafond: 200000,
      },
      {
        id: 'autre_materiel',
        name: 'Autres investissements matériels',
        desc: "Cogénération et autres investissements de maîtrise de l'énergie non listés ci-dessus.",
        taux: 0.2,
        plafond: 200000,
      },
    ],
  },
  prosol: {
    title: 'Autoconsommation PV raccordée',
    desc: 'Programmes PROSOL ELEC / POSOL ELEC, basse tension.',
    range: 'Prime forfaitaire par système',
    type: 'flat',
    items: [
      {
        id: 'posol_elec',
        name: 'POSOL ELEC',
        desc: "Production d'électricité à partir des énergies renouvelables, autoconsommation, établissements raccordés au réseau basse tension.",
        amount: 500,
        unit: 'DT / système',
      },
      {
        id: 'prosol_eco',
        name: 'PROSOL ELEC ÉCONOMIQUE',
        desc: "Production d'électricité à partir des énergies renouvelables, autoconsommation, établissements raccordés au réseau basse tension.",
        amount: 1500,
        unit: 'DT / système',
      },
    ],
  },
  offgrid: {
    title: 'Installations PV non raccordées (off-grid)',
    desc: 'Électrification rurale, pompage de l\'eau, sites isolés.',
    range: 'De 1 000 à 6 000 DT/kW',
    type: 'offgrid',
    items: [
      {
        id: 'offgrid_pv',
        name: 'Installation photovoltaïque autonome',
        desc: "Établissements non raccordés au réseau : électrification rurale et pompage de l'eau. La prime au kW dépend de la puissance installée.",
        tiers: [
          { max: 0.25, rate: 6000 },
          { max: 0.5, rate: 4500 },
          { max: 2, rate: 3500 },
          { max: 5, rate: 3000 },
          { max: 10, rate: 1500 },
          { max: Infinity, rate: 1000, cap: 50000 },
        ],
      },
    ],
  },
};

export const SUBVENTION_CATEGORY_ENTRIES = Object.entries(SUBVENTION_CATEGORIES) as Array<
  [SubventionCategoryKey, SubventionCategory]
>;

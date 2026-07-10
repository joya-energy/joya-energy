export interface SubventionHighlightStat {
  value: string;
  label: string;
}

export interface SubventionBenefitCard {
  icon: string;
  title: string;
  description: string;
}

export interface SubventionProcedureStep {
  number: number;
  title: string;
  description: string;
}

export const SUBVENTION_HIGHLIGHT_STATS: SubventionHighlightStat[] = [
  {
    value: '70%',
    label: 'taux maximal, sur les études et audits énergétiques',
  },
  {
    value: '200 KDT',
    label: 'plafond le plus élevé, pour la rénovation de bâtiments',
  },
  {
    value: '6 000 DT/kW',
    label: 'prime la plus haute, petites installations PV isolées',
  },
];

export const SUBVENTION_TRUST_STATS: SubventionHighlightStat[] = [
  {
    value: '563 MDT',
    label: 'collectés par le FTE entre 2006 et 2021',
  },
  {
    value: '335 MDT',
    label: "déjà versés en primes à l'investissement sur la même période",
  },
  {
    value: '67%',
    label: "des primes versées financent des projets d'énergies renouvelables",
  },
];

export const SUBVENTION_BENEFIT_CARDS: SubventionBenefitCard[] = [
  {
    icon: '€',
    title: 'Une prime, pas un prêt',
    description:
      "L'aide FTE est versée sous forme de subvention non remboursable. Elle vient réduire directement le coût de votre projet, elle ne s'ajoute pas à vos dettes.",
  },
  {
    icon: '✓',
    title: 'Un dispositif large',
    description:
      'Des études préalables aux équipements installés, en passant par le photovoltaïque résidentiel : la quasi-totalité de la chaîne de la transition énergétique est couverte.',
  },
  {
    icon: '→',
    title: 'Un accompagnement de bout en bout',
    description:
      "L'ANME instruit votre dossier, vous oriente vers des experts et installateurs agréés (REEME), et débloque la prime après constatation des travaux réalisés.",
  },
];

export const SUBVENTION_PROCEDURE_STEPS: SubventionProcedureStep[] = [
  {
    number: 1,
    title: 'Envoi de la demande',
    description:
      "L'entreprise ou le porteur de projet dépose son dossier auprès de l'ANME, avec les pièces justificatives du projet.",
  },
  {
    number: 2,
    title: "Instruction par l'ANME",
    description:
      "L'agence vérifie la recevabilité du dossier et peut demander des compléments d'information avant de le transmettre.",
  },
  {
    number: 3,
    title: 'Avis de la commission technique FTE',
    description:
      'Une commission dédiée examine le dossier et émet un avis sur l\'octroi de la prime.',
  },
  {
    number: 4,
    title: "Décision du Ministre chargé de l'Énergie",
    description:
      "La décision d'octroi est formalisée au niveau ministériel, sur la base de l'avis de la commission.",
  },
  {
    number: 5,
    title: 'Signature du contrat et déblocage',
    description:
      "Un contrat programme est signé entre l'ANME et l'entreprise bénéficiaire. La prime est débloquée après constatation des réalisations.",
  },
];

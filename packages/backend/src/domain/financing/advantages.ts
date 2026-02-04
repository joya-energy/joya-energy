/**
 * Solution advantages and disadvantages for decision-makers
 * Helps DAF/executives understand beyond the numbers
 */

import { FinancingSolutionType, SolutionAdvantages } from './types';

export const SOLUTION_ADVANTAGES: Record<FinancingSolutionType, SolutionAdvantages> = {
  [FinancingSolutionType.CASH]: {
    type: FinancingSolutionType.CASH,
    advantages: [
      'Aucune dette',
      'Aucune mensualité',
      'Cashflow mensuel maximal',
      'Coût total le plus faible',
      'Propriété immédiate de l\'installation',
      'Solution la plus rentable à long terme',
    ],
    disadvantages: [
      'Fort investissement initial',
      'Immobilisation de trésorerie',
      'Risque technique 100% à la charge du client',
      'OPEX et maintenance à gérer soi-même',
      'Moins de flexibilité financière',
    ],
    dafReading: 'Très rentable, mais je bloque du cash qui pourrait servir ailleurs.',
  },

  [FinancingSolutionType.CREDIT]: {
    type: FinancingSolutionType.CREDIT,
    advantages: [
      'Pas ou peu d\'investissement initial',
      'Propriété de l\'installation',
      'Mensualité connue à l\'avance',
      'Solution bancaire classique et rassurante',
      'Cashflow potentiellement positif',
    ],
    disadvantages: [
      'Dette inscrite au bilan',
      'Coût total plus élevé (intérêts)',
      'Engagement bancaire long terme',
      'OPEX et maintenance à la charge du client',
      'Moins de flexibilité en cas de difficulté',
    ],
    dafReading: 'Je finance le projet, mais je prends une dette et je gagne peu chaque mois.',
  },

  [FinancingSolutionType.LEASING]: {
    type: FinancingSolutionType.LEASING,
    advantages: [
      'Apport initial réduit',
      'Faible impact immédiat sur la trésorerie',
      'Solution adaptée aux entreprises qui préfèrent louer',
      'Possibilité de rachat en fin de contrat',
    ],
    disadvantages: [
      'Coût total très élevé',
      'Assurance et frais intégrés',
      'Flexibilité limitée',
      'Propriété différée',
      'Cashflow souvent neutre ou faible',
      'OPEX parfois plus élevés',
    ],
    dafReading: 'Facile à mettre en place, mais cher sur la durée.',
  },

  [FinancingSolutionType.ESCO]: {
    type: FinancingSolutionType.ESCO,
    advantages: [
      'Aucun investissement initial',
      'Aucune dette',
      'OPEX et maintenance inclus',
      'Cashflow positif dès le premier mois',
      'Risque technique porté par JOYA',
      'Solution hors bilan',
      'Alignement d\'intérêt (JOYA gagne si le client économise)',
    ],
    disadvantages: [
      'Part des économies partagée',
      'Durée contractuelle fixe',
      'Moins rentable que le comptant sur le très long terme',
      'Dépendance à un partenaire (ESCO)',
    ],
    dafReading: 'Je ne prends aucun risque et j\'améliore ma trésorerie immédiatement.',
  },
};


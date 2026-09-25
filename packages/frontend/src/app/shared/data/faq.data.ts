export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Single source of truth for FAQ content across the site
 * (FAQ page, landing FAQ section, home FAQ section).
 * Wording avoids financement / financer / crédit (BCT).
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment fonctionne la solution Joya\u00a0?',
    answer:
      "Joya prend en charge 100\u00a0% de l'installation solaire sur votre bâtiment professionnel. Vous ne payez qu'une redevance mensuelle, calculée sur vos économies réelles — toujours inférieure à votre facture actuelle.",
  },
  {
    question: "À quelles entreprises s'adresse cette solution\u00a0?",
    answer:
      'Écoles privées, cliniques, pharmacies, boulangeries, hôtels et PME avec une consommation électrique significative.',
  },
  {
    question: 'Quelles économies puis-je espérer\u00a0?',
    answer:
      "Jusqu'à 30\u00a0% sur votre facture d'électricité, selon votre profil de consommation et votre zone climatique.",
  },
  {
    question: "Combien de temps dure l'installation\u00a0?",
    answer: 'De 4 à 8 semaines, selon la taille du projet.',
  },
  {
    question: 'Que se passe-t-il en cas de panne ou de problème technique\u00a0?',
    answer:
      'La maintenance est incluse pendant toute la durée du contrat. Notre plateforme détecte les anomalies et notre équipe intervient rapidement.',
  },
  {
    question: "Puis-je devenir propriétaire de l'installation\u00a0?",
    answer:
      "Oui. À l'issue du contrat de service énergétique, l'installation vous appartient et 100\u00a0% des économies vous reviennent.",
  },
  {
    question: 'Dois-je gérer la solution au quotidien\u00a0?',
    answer:
      'Non. Joya prend en charge le pilotage énergétique et met à votre disposition une plateforme digitale pour suivre simplement les résultats.',
  },
  {
    question: "Qu'est-ce que l'audit énergétique\u00a0?",
    answer:
      "L'audit énergétique permet d'analyser votre consommation, vos usages et votre site pour identifier les leviers réels de performance (isolation, équipements, solaire, etc.). Nous vous proposons ensuite une solution adaptée et un accompagnement sur la durée.",
  },
  {
    question: 'Comment puis-je obtenir une simulation ou un devis\u00a0?',
    answer:
      "Vous pouvez remplir les formulaires d'audit solaire ou d'audit énergétique sur le site, ou nous contacter directement via la page Contact. Nous analysons votre demande et vous proposons une démonstration ou une étude personnalisée.",
  },
  {
    question: 'Comment vous contacter\u00a0?',
    answer:
      'Vous pouvez nous joindre via le formulaire de contact du site, par email ou par téléphone aux coordonnées indiquées. Notre équipe est à votre disposition pour répondre à vos questions sur nos solutions et planifier un échange ou une démonstration.',
  },
];

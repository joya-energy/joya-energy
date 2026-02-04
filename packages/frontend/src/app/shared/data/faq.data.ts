export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Single source of truth for FAQ content across the site
 * (FAQ page, landing FAQ section, home FAQ section).
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment fonctionne le financement solaire Joya ?',
    answer:
      "Notre solution de financement prend en charge 100% de l'investissement initial pour l'installation de panneaux solaires sur votre bâtiment professionnel. Vous ne payez que l'électricité produite, à un tarif inférieur à celui du réseau, ce qui vous permet de réaliser des économies immédiates sans immobiliser votre trésorerie.",
  },
  {
    question: "À quelles entreprises s'adresse cette solution ?",
    answer:
      "Notre solution s'adresse aux PME, ETI et grands groupes qui souhaitent réduire leurs coûts énergétiques et leur empreinte carbone sans investissement initial. Idéale pour les entreprises disposant d'une toiture exploitable et consommant l'électricité en journée.",
  },
  {
    question: 'Quelles économies puis-je espérer ?',
    answer:
      "Les économies dépendent de votre profil de consommation et de l'ensoleillement de votre région, mais nos clients économisent en moyenne entre 20% et 40% sur leurs factures d'électricité dès la première année. Notre outil de simulation vous donne une estimation personnalisée en quelques minutes.",
  },
  {
    question: "Combien de temps dure l'installation ?",
    answer:
      "La durée d'installation varie selon la taille du projet, mais elle est généralement comprise entre 2 et 4 semaines. Nous nous occupons de toutes les démarches administratives et techniques, ce qui permet de minimiser l'impact sur votre activité.",
  },
  {
    question: 'Que se passe-t-il en cas de panne ou de problème technique ?',
    answer:
      "Notre contrat inclut une garantie complète de performance et de maintenance pendant toute la durée du partenariat. Une équipe technique surveille en permanence la production et intervient rapidement en cas d'anomalie, sans frais supplémentaires pour vous.",
  },
  {
    question: "Puis-je devenir propriétaire de l'installation ?",
    answer:
      "Oui, nos contrats prévoient généralement une option d'achat que vous pouvez exercer après une période définie, généralement à partir de la 5ème année. Le prix d'achat est fixé dès le départ, ce qui vous permet d'anticiper cette décision en toute transparence.",
  },
  {
    question: 'Dois-je gérer la solution au quotidien ?',
    answer:
      'Non. Joya prend en charge le pilotage énergétique et met à votre disposition une plateforme digitale pour suivre simplement les résultats.',
  },
  {
    question: "Qu'est-ce que l'audit énergétique ?",
    answer:
      "L'audit énergétique permet d'analyser votre consommation, vos usages et votre site pour identifier les leviers réels de performance (isolation, équipements, solaire, etc.). Nous vous proposons ensuite une solution adaptée et un accompagnement sur la durée.",
  },
  {
    question: 'Comment puis-je obtenir une simulation ou un devis ?',
    answer:
      "Vous pouvez remplir les formulaires d'audit solaire ou d'audit énergétique sur le site, ou nous contacter directement via la page Contact. Nous analysons votre demande et vous proposons une démonstration ou une étude personnalisée.",
  },
  {
    question: 'Comment vous contacter ?',
    answer:
      'Vous pouvez nous joindre via le formulaire de contact du site, par email ou par téléphone aux coordonnées indiquées. Notre équipe est à votre disposition pour répondre à vos questions sur nos solutions et planifier un échange ou une démonstration.',
  },
];

import type { BtAnalyseResult, MtAnalyseResult } from './analyse-facture-resultats.types';

/** Mock BT — remplacé plus tard par la réponse IA */
export const MOCK_BT_RESULT: BtAnalyseResult = {
  facture_extraite: {
    type_facture: 'BT',
    numero_facture: '71363744',
    reference_client: '241488011',
    client: 'STE M.C.W sarl',
    adresse_site: 'L 28 RJANDOUBA Z.I.M 2, FOUCHANA',
    district_steg: 'MOUROUJ',
    date_debut_periode: '2026-04-02',
    date_fin_periode: '2026-05-05',
    periode_facturation: '1',
    puissance_souscrite_kva: '132',
    consommation_totale_kwh: '40833',
    ancien_index: '2402574',
    nouvel_index: '2443407',
    prix_unitaire: '0.391',
    redevances_fixes: '92.400',
    montant_energie: '15965.703',
    montant_total: '16652.064',
    montant_a_payer: '16652.000',
    date_limite_paiement: '2026-05-20',
    date_prochaine_releve: '2026-06-02',
    gaz: {
      presence_gaz: 'Oui',
      consommation_gaz_m3: '130',
      prix_unitaire_gaz: '0.588',
      redevances_fixes_gaz: '16.000',
      montant_energie_gaz: '76.440',
    },
  },
  affichage_client: {
    client: 'STE M.C.W sarl',
    periode_facturation: {
      valeur: '1',
      explication: "Période durant laquelle l'électricité a été consommée et facturée.",
    },
    puissance_souscrite_kva: {
      valeur: '132',
      explication:
        "Capacité maximale d'électricité réservée auprès de la STEG pour alimenter votre installation.",
    },
    consommation_totale_kwh: {
      valeur: '40833',
      explication: "Quantité totale d'électricité utilisée pendant la période facturée.",
    },
    prix_unitaire: {
      valeur: '0.391',
      explication: "Prix payé pour chaque unité d'électricité consommée.",
    },
    redevances_fixes: {
      valeur: '92.400',
      explication:
        'Frais fixes liés à votre abonnement et au maintien de votre raccordement au réseau électrique.',
    },
    montant_energie: {
      valeur: '15965.703',
      explication: "Coût de l'électricité réellement consommée pendant la période.",
    },
    montant_total: {
      valeur: '16652.064',
      explication:
        "Montant total incluant la consommation, l'abonnement et l'ensemble des taxes appliquées par la STEG.",
    },
    montant_a_payer: {
      valeur: '16652.000',
      explication:
        "Montant final à régler à la STEG, incluant la consommation, l'abonnement et les taxes.",
    },
    message_passage_mt:
      "Votre puissance souscrite dépasse 100 kVA. En passant en Moyenne Tension (MT), vous bénéficieriez d'un tarif énergie inférieur (0.291 DT/kWh au lieu de 0.391 DT/kWh).",
  },
  etude_bt_mt: {
    consommation_annuelle_kwh: '489996.000',
    prix_unitaire_kwh: '0.291',
    puissance_souscrite_kva: '250.000',
    prime_puissance_mensuelle: '1250.000',
    prime_puissance_annuelle: '15000.000',
    facture_annuelle_bt_dt: '192697.236',
    facture_annuelle_mt_dt: '157589.836',
    capex_dt: '150000.000',
    opex_annuel_dt: '3000.000',
    economie_annuelle_dt: '0',
    payback_simple_ans: '4.157',
    payback_actualise_ans: '5.108',
    tri_pct: '28.484',
    roi_pct: '1307.4',
    van_dt: '536834.818',
    puissance_mt_theorique: '224.400',
    puissance_mt_recommandee_kva: '250.000',
    prix_unitaire_transformateur_mt: '600.000',
    hypotheses:
      'inflation tarifaire 7 %/an, inflation OPEX 3 %/an, taux d\'actualisation 8 %/an',
    conclusion: {
      titre: 'Investissement très rentable',
      texte:
        "Avec un TRI de 28,48 % et un payback simple inférieur à 4,2 ans, le passage en Moyenne Tension représente un investissement financièrement avantageux. La VAN de 536 814 DT sur 25 ans confirme l'intérêt stratégique de ce changement de tarif.",
      note_contact:
        'Prendre contact avec la STEG (District MOUROUJ) pour initier la procédure de changement de tarif.',
    },
    demarche_revision: {
      contexte:
        'La Moyenne Tension (MT) est un type de raccordement électrique réservé aux sites qui consomment beaucoup d\'électricité, comme le vôtre. Le tarif y est moins cher que la Basse Tension (BT), à condition que la puissance réservée corresponde réellement à vos besoins. La démarche se fait en deux étapes simples, sans aucune coupure de courant ni travaux dans vos locaux.',
      intro: '',
      etapes: [
        {
          titre: 'Vérifier la consommation réelle pendant 12 mois.',
          description:
            'Avant de changer quoi que ce soit, on observe combien d\'électricité le site utilise réellement, pendant 12 mois. Cela permet de connaître le « pic » de consommation, c\'est-à-dire le moment où l\'on tire le plus d\'électricité d\'un coup — par exemple quand toutes les machines tournent en même temps, y compris en haute saison. Ce relevé permet de confirmer la puissance MT exactement nécessaire pour couvrir ces pics, sans risque de manquer d\'électricité une fois le contrat changé.',
        },
        {
          titre: 'Demander officiellement le changement à la STEG.',
          description:
            'Une fois la bonne puissance confirmée, il suffit de déposer une demande auprès du district STEG concerné pour faire baisser la puissance réservée sur le contrat, au palier MT recommandé. C\'est une simple formalité administrative : aucun technicien n\'intervient sur l\'installation, et l\'alimentation électrique continue normalement pendant toute la procédure.',
        },
      ],
    },
    piste_solaire: {
      badge: 'UNE AUTRE PISTE D\'ÉCONOMIE',
      titre: 'Installer du solaire sur votre site.',
      description:
        'Avec 489 996 kWh consommés par an, le site présente un profil de consommation compatible avec une installation solaire. C\'est une recommandation à part entière, indépendante de la révision de puissance.',
      piste:
        'une étude de faisabilité solaire permettrait de chiffrer le productible, l\'investissement et le temps de retour propres à ce site.',
    },
  },
};

/** Mock MT — remplacé plus tard par la réponse IA */
export const MOCK_MT_RESULT: MtAnalyseResult = {
  facture: {
    client: 'CAPSA THERMAL',
    site: 'Zarroug, Gafsa',
    reference_facture: '95074019',
    periode: '07/2024',
    district: 'GAFSA',
    puissance_souscrite_kva: 630,
    puissance_max_kw: 88,
    consommation_kwh: 24502,
    cos_phi: 0.94,
    coefficient_k: 0.02,
    prime_puissance_dt: 3150,
    montant_net_dt: 12491,
    energie_consommee_kwh: 24502,
    date_limite_paiement: '25/08/2024',
    consommation_annuelle_kwh: 294024,
  },
  affichage_client: {
    mois_facturation: {
      valeur: '07/2024',
      explication: "Mois et année de la facture permettant d'identifier la période concernée.",
    },
    puissance_souscrite_kva: {
      valeur: '630',
      explication:
        "Capacité maximale d'électricité réservée auprès de la STEG pour votre installation.",
    },
    puissance_maximale_appelee_kw: {
      valeur: '88',
      explication: 'Puissance la plus élevée utilisée pendant la période facturée.',
    },
    consommation_totale_kwh: {
      valeur: '24502',
      explication: "Quantité totale d'électricité utilisée pendant la période facturée.",
    },
    cos_phi: {
      valeur: '0.94',
      explication: "Indicateur de la qualité d'utilisation de l'électricité par votre installation.",
    },
    coefficient_k: {
      valeur: '0.02',
      explication:
        'Coefficient de réduction ou majoration appliqué au montant de l\'énergie active selon le cos φ. Formule : (cos φ − 0.90) × 0.5 si cos φ > 0.90.',
    },
    prime_puissance: {
      valeur: '3150',
      explication: 'Montant lié à la puissance réservée auprès de la STEG.',
    },
    montant_net_a_payer: {
      valeur: '12491',
      explication: 'Montant final à payer à la STEG.',
    },
  },
  situation_titre: 'Vous payez chaque mois pour une puissance que vous n\'utilisez pas.',
  situation_texte:
    'Votre contrat STEG vous réserve <strong>630 kVA</strong> de puissance. Ce mois, votre installation en a consommé <strong>88 kW</strong> au maximum. C\'est comme louer un entrepôt de 630 m² pour n\'en occuper que 88.',
  revelle_sous_titre: 'Votre facture cache de l\'argent. On vous montre où.',
  revelle_intro:
    'Pas de jargon, pas d\'estimation au doigt mouillé : chaque chiffre ci-dessous sort directement de votre facture STEG. À vous de décider si ça vaut le coup d\'agir.',
  insights: [
    {
      severity: 'critical',
      title: 'Puissance souscrite trop élevée — vous payez pour de la capacité inutilisée',
      description:
        'Votre puissance souscrite est de 630 kVA, votre puissance maximale appelée est de 88 kW. Vous utilisez seulement 14,0 % de votre capacité contractuelle. Une puissance cible de 126 kVA (70 % d\'utilisation) pourrait réduire votre facture fixe d\'environ 2 521 DT/mois (30 257 DT/an).',
      annualSavingLabel: '+30 257 DT/an',
      footerNote:
        'Une révision de la puissance souscrite auprès de la STEG est recommandée afin de réduire durablement les coûts fixes.',
    },
    {
      severity: 'positive',
      title: 'Cos φ optimal — votre installation bénéficie d\'une bonification STEG',
      description:
        'Votre facteur de puissance est de 0,94. Vous bénéficiez d\'une réduction sur le prix de l\'énergie active. Bonification estimée sur cette facture : 143 DT. Aucune action corrective n\'est nécessaire. Un suivi régulier permettra de conserver ce bon niveau de performance.',
      annualSavingLabel: '+1 711 DT/an',
    },
  ],
  revision: {
    puissance_cible_kva: 126,
    prime_actuelle_dt: 3150,
    prime_apres_revision_dt: 629,
    economie_annuelle_dt: 30257,
    economie_mensuelle_dt: 2521,
  },
  piste_solaire: {
    badge: 'UNE AUTRE PISTE D\'ÉCONOMIE',
    titre: 'Installer du solaire sur votre site.',
    description:
      'Avec 294 024 kWh consommés par an, le site présente un profil de consommation compatible avec une installation solaire. C\'est une recommandation à part entière, indépendante de la révision de puissance.',
    piste:
      'une étude de faisabilité solaire permettrait de chiffrer le productible, l\'investissement et le temps de retour propres à ce site.',
  },
};

export const AFFICHAGE_FIELD_LABELS: Record<string, string> = {
  client: 'Client',
  puissance_souscrite_kva: 'Puissance souscrite',
  consommation_totale_kwh: 'Consommation totale',
  prix_unitaire: 'Prix unitaire',
  redevances_fixes: 'Redevances fixes',
  montant_energie: 'Montant énergie',
  montant_total: 'Montant total',
  montant_a_payer: 'Montant à payer',
  periode_facturation: 'Période',
};

export const ETUDE_BT_MT_LABELS: Record<string, string> = {
  consommation_annuelle_kwh: 'Consommation annuelle',
  puissance_mt_theorique: 'Puissance MT théorique',
  puissance_mt_recommandee_kva: 'Puissance MT recommandée',
  prix_unitaire_mt: 'Prix unitaire MT',
  capex_dt: 'CAPEX',
  opex_annuel_dt: 'OPEX annuel',
  prime_puissance_mensuelle: 'Prime puissance mensuelle',
  prime_puissance_annuelle: 'Prime puissance annuelle',
  facture_annuelle_bt_dt: 'Facture annuelle BT',
  facture_annuelle_mt_dt: 'Facture annuelle MT',
  economie_annuelle_dt: 'Économie annuelle',
  payback_simple_ans: 'Payback simple',
  payback_actualise_ans: 'Payback actualisé',
  van_dt: 'VAN',
  tri_pct: 'TRI',
  roi_pct: 'ROI',
};

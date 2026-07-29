/**
 * STEG MT analysis (§7) — power ratio + cos φ categories. Deterministic, no LLM.
 */

export type TrancheTarifaire = 'Uniforme' | 'Horaire';
export type CategoriePuissance = 'P0' | 'P1' | 'P2' | 'P3';
export type CategorieCosPhi = 'C1' | 'C2' | 'C3' | 'C4';

export interface IndicateursMt {
  ratio_puissance_pct: number;
  puissance_cible_kva: number;
  taux_redevance_puissance_kva: number;
  economie_mensuelle_dt: number;
  economie_annuelle_dt: number;
  marge_kva: number;
  depassement_kva: number;
  k_bonification: number | null;
}

export function tauxRedevancePuissance(tranche: TrancheTarifaire): number {
  return tranche === 'Horaire' ? 11 : 5;
}

export function computeIndicateursMt(
  puissanceSouscriteKva: number,
  puissanceMaxAppeleeKva: number,
  tranche: TrancheTarifaire,
  cosPhi: number
): IndicateursMt {
  const taux = tauxRedevancePuissance(tranche);
  const ratio_puissance_pct =
    Math.round((puissanceMaxAppeleeKva / puissanceSouscriteKva) * 10000) / 100;
  const puissance_cible_kva = Math.round(puissanceMaxAppeleeKva / 0.7);
  const marge_kva = puissanceSouscriteKva - puissanceMaxAppeleeKva;
  const depassement_kva = Math.max(puissanceMaxAppeleeKva - puissanceSouscriteKva, 0);
  const economie_mensuelle_dt =
    Math.round((puissanceSouscriteKva - puissance_cible_kva) * taux * 1000) / 1000;
  const economie_annuelle_dt = Math.round(economie_mensuelle_dt * 12 * 1000) / 1000;
  const k_bonification =
    cosPhi > 0.9 ? Math.round((cosPhi - 0.9) * 0.5 * 10000) / 10000 : null;

  return {
    ratio_puissance_pct,
    puissance_cible_kva,
    taux_redevance_puissance_kva: taux,
    economie_mensuelle_dt,
    economie_annuelle_dt,
    marge_kva: Math.round(marge_kva * 1000) / 1000,
    depassement_kva: Math.round(depassement_kva * 1000) / 1000,
    k_bonification,
  };
}

/**
 * Strict rule from prompt: ratio > 95 → P3; ≥ 60 → P0; ≥ 45 → P2; else P1.
 * Note: prompt example table disagrees at ~95% — we follow the stated rule.
 */
export function classifyCategoriePuissance(ratioPuissancePct: number): CategoriePuissance {
  if (ratioPuissancePct > 95) {
    return 'P3';
  }
  if (ratioPuissancePct >= 60) {
    return 'P0';
  }
  if (ratioPuissancePct >= 45) {
    return 'P2';
  }
  return 'P1';
}

export function hasDepassementCard(depassementKva: number): boolean {
  return depassementKva > 0;
}

export function classifyCategorieCosPhi(cosPhi: number): CategorieCosPhi {
  if (cosPhi < 0.6) {
    return 'C4';
  }
  if (cosPhi < 0.8) {
    return 'C3';
  }
  if (cosPhi < 0.91) {
    return 'C2';
  }
  return 'C1';
}

export function computePenaliteCosPhiPct(cosPhi: number): number {
  if (cosPhi >= 0.8) {
    return 0;
  }

  const centiemesSousSeuil = Math.round((0.8 - cosPhi) * 100);
  let penalite = 0;
  let remaining = centiemesSousSeuil;

  const tier1 = Math.min(remaining, 5);
  penalite += tier1 * 0.5;
  remaining -= tier1;

  const tier2 = Math.min(remaining, 5);
  penalite += tier2 * 1.0;
  remaining -= tier2;

  const tier3 = Math.min(remaining, 10);
  penalite += tier3 * 1.5;
  remaining -= tier3;

  penalite += remaining * 2.0;
  return Math.round(penalite * 100) / 100;
}

export function computeBonificationSecours(montantEnergie: number, coefficientK: number): number {
  return Math.round(montantEnergie * coefficientK * 1000) / 1000;
}

export interface MtRecommandationBuilt {
  categorie: string;
  gain_mensuel_estime_dt: string;
  gain_annuel_estime_dt: string;
  titre: string;
  description: string;
  conclusion: string;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function buildMtRecommandations(params: {
  souscrite: number;
  maxAppelee: number;
  cosPhi: number;
  bonificationCosPhi: number;
  indicateurs: IndicateursMt;
}): MtRecommandationBuilt[] {
  const { souscrite, maxAppelee, cosPhi, bonificationCosPhi, indicateurs } = params;
  const cards: MtRecommandationBuilt[] = [];
  const categorieP = classifyCategoriePuissance(indicateurs.ratio_puissance_pct);
  const ratio = indicateurs.ratio_puissance_pct;
  const cible = indicateurs.puissance_cible_kva;
  const ecoM = indicateurs.economie_mensuelle_dt;
  const ecoA = indicateurs.economie_annuelle_dt;

  if (categorieP === 'P0') {
    cards.push({
      categorie: 'P0',
      gain_mensuel_estime_dt: '-',
      gain_annuel_estime_dt: '-',
      titre: '✅ Puissance souscrite bien dimensionnée',
      description: `Votre puissance souscrite est de ${souscrite} kVA, votre puissance maximale appelée est de ${maxAppelee} kVA, soit ${ratio}% de votre capacité contractuelle. Ce niveau d'utilisation correspond à votre activité réelle, sans surcoût inutile ni risque de dépassement.`,
      conclusion:
        'Aucune action nécessaire. Un suivi annuel suffit pour confirmer que ce niveau reste adapté à votre activité.',
    });
  } else if (categorieP === 'P1') {
    cards.push({
      categorie: 'P1',
      gain_mensuel_estime_dt: formatNumber(ecoM),
      gain_annuel_estime_dt: formatNumber(ecoA),
      titre: '⚠️ Puissance souscrite trop élevée — vous payez pour de la capacité inutilisée',
      description: `Votre puissance souscrite est de ${souscrite} kVA, votre puissance maximale appelée est de ${maxAppelee} kVA. Vous utilisez seulement ${ratio}% de votre capacité contractuelle. Une puissance cible de ${cible} kVA (70% d'utilisation) pourrait réduire votre facture fixe d'environ ${formatNumber(ecoM)} DT/mois (${formatNumber(ecoA)} DT/an).`,
      conclusion:
        'Une révision de la puissance souscrite auprès de la STEG est recommandée afin de réduire durablement les coûts fixes.',
    });
  } else if (categorieP === 'P2') {
    cards.push({
      categorie: 'P2',
      gain_mensuel_estime_dt: formatNumber(ecoM),
      gain_annuel_estime_dt: formatNumber(ecoA),
      titre: '⚡ Puissance souscrite surdimensionnée — optimisation tarifaire possible',
      description: `Votre puissance souscrite est de ${souscrite} kVA, votre puissance maximale appelée est de ${maxAppelee} kVA. Ratio actuel : ${ratio}%. Une optimisation vers ${cible} kVA (cible 70%) représente un gain potentiel de ${formatNumber(ecoM)} DT/mois (${formatNumber(ecoA)} DT/an).`,
      conclusion:
        'Une analyse sur 12 mois est recommandée avant toute décision de révision, afin de tenir compte des éventuels pics saisonniers.',
    });
  } else {
    cards.push({
      categorie: 'P3',
      gain_mensuel_estime_dt: '-',
      gain_annuel_estime_dt: '-',
      titre: '⚡⚠️ Puissance proche du seuil contractuel — risque de dépassement facturé',
      description: `Votre puissance maximale appelée atteint ${maxAppelee} kVA pour une puissance souscrite de ${souscrite} kVA, soit ${ratio}% de votre limite contractuelle. Marge disponible : ${indicateurs.marge_kva} kVA.`,
      conclusion:
        'Un suivi régulier de la puissance appelée est recommandé afin d\'éviter des frais supplémentaires.',
    });
  }

  if (hasDepassementCard(indicateurs.depassement_kva)) {
    cards.push({
      categorie: 'P4',
      gain_mensuel_estime_dt: '-',
      gain_annuel_estime_dt: '-',
      titre: '🚨 Dépassement de puissance constaté — frais supplémentaires à prévoir',
      description: `Votre facture indique un dépassement de ${indicateurs.depassement_kva} kVA. Une analyse des pics de charge est recommandée pour identifier la cause.`,
      conclusion:
        'Identifier la cause du dépassement et analyser les pics de charge pour éviter sa répétition.',
    });
  }

  const categorieC = classifyCategorieCosPhi(cosPhi);
  if (categorieC === 'C1') {
    cards.push({
      categorie: 'C1',
      gain_mensuel_estime_dt: formatNumber(bonificationCosPhi),
      gain_annuel_estime_dt: formatNumber(bonificationCosPhi * 12),
      titre: '✅ Cos φ optimal — votre installation bénéficie d\'une bonification STEG',
      description: `Votre facteur de puissance est de ${cosPhi}. Vous bénéficiez d'une réduction sur le prix de l'énergie active. Bonification estimée sur cette facture : ${formatNumber(bonificationCosPhi)} DT.`,
      conclusion:
        'Aucune action corrective n\'est nécessaire. Un suivi régulier permettra de conserver ce bon niveau de performance.',
    });
  } else if (categorieC === 'C2') {
    cards.push({
      categorie: 'C2',
      gain_mensuel_estime_dt: '-',
      gain_annuel_estime_dt: '-',
      titre: '💡 Cos φ correct — une amélioration permettrait de réduire votre facture',
      description: `Votre facteur de puissance est de ${cosPhi}. Pas de pénalité, mais pas de bonification. Si votre site utilise des moteurs ou compresseurs, améliorer le cos φ au-dessus de 0.90 permettrait d'obtenir une réduction sur l'énergie active.`,
      conclusion:
        'Une étude de compensation réactive pourrait permettre d\'atteindre la zone de bonification.',
    });
  } else if (categorieC === 'C3') {
    cards.push({
      categorie: 'C3',
      gain_mensuel_estime_dt: '-',
      gain_annuel_estime_dt: '-',
      titre: '⚡⚠️ Cos φ trop faible — majoration sur votre énergie active en cours',
      description: `Votre facteur de puissance est de ${cosPhi}, inférieur au seuil normal STEG. Une analyse de l'énergie réactive est recommandée.`,
      conclusion:
        'L\'installation d\'un système de compensation d\'énergie réactive est recommandée pour supprimer les pénalités.',
    });
  } else {
    cards.push({
      categorie: 'C4',
      gain_mensuel_estime_dt: '-',
      gain_annuel_estime_dt: '-',
      titre: '🚨 Cos φ critique — risque de refus d\'alimentation par la STEG',
      description: `Votre facteur de puissance est de ${cosPhi}. Ce niveau expose le site à des restrictions d'alimentation. Une intervention technique prioritaire est requise.`,
      conclusion:
        'Audit électrique complet et mise en place immédiate d\'une solution de compensation réactive.',
    });
  }

  return cards;
}

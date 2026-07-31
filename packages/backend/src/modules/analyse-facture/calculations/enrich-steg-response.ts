import type {
  AffichageClientField,
  AffichageClientMap,
  EtudeBtMtRaw,
  FactureExtraiteBtRaw,
  FactureExtraiteMtRaw,
  StegAnalyseResponse,
} from '@shared/interfaces/analyse-facture.interface';
import { Logger } from '@backend/middlewares';
import { computeEtudeBtMt } from './steg-etude-bt-mt';
import {
  buildMtRecommandations,
  computeIndicateursMt,
  type TrancheTarifaire,
} from './steg-mt-analysis';
import {
  buildExtractionQuality,
  type ExtractionQuality,
} from './extraction-quality';
import {
  correctFactureBtExtraction,
  correctFactureMtExtraction,
  isMtMaxAppeleeEqualSouscrite,
  validateFactureBt,
  validateFactureMt,
  type ExtractionCorrectionChange,
  type FactureBtValidationInput,
  type FactureMtValidationInput,
} from './steg-calculations';

function parseStegNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) {
    return Number.NaN;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (value === '-' || value === '') {
    return Number.NaN;
  }
  return Number.parseFloat(value);
}

function stringifyStegNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return String(value);
}

function isMtBill(raw: FactureExtraiteBtRaw | FactureExtraiteMtRaw): raw is FactureExtraiteMtRaw {
  const type = String(raw.type_facture ?? '').toUpperCase();
  if (type.includes('MT') || type.includes('MOYENNE')) {
    return true;
  }
  return 'mois_facturation' in raw && String(raw.mois_facturation ?? '') !== '-';
}

function resolveTranche(raw: FactureExtraiteMtRaw): TrancheTarifaire {
  const tranche = String(raw.tranche_tarifaire ?? '');
  return tranche.toLowerCase().includes('horaire') ? 'Horaire' : 'Uniforme';
}

function enrichMtAnalyse(raw: FactureExtraiteMtRaw): StegAnalyseResponse['analyse_mt'] {
  const souscrite = parseStegNumber(raw.puissance_souscrite_kva);
  const maxAppelee = parseStegNumber(
    raw.puissance_maximale_appelee_kva ?? raw.puissance_maximale_appelee_kw
  );
  const cosPhi = parseStegNumber(raw.cos_phi);
  const bonification = parseStegNumber(raw.bonification_cos_phi);
  const montantEnergie = parseStegNumber(raw.montant_energie);
  const coefficientK = parseStegNumber(raw.coefficient_k);

  if (Number.isNaN(souscrite) || Number.isNaN(maxAppelee) || souscrite <= 0) {
    return { indicateurs: {}, recommandations: [] };
  }

  const tranche = resolveTranche(raw);
  const indicateurs = computeIndicateursMt(
    souscrite,
    maxAppelee,
    tranche,
    Number.isNaN(cosPhi) ? 0 : cosPhi
  );

  const bonificationEffective =
    !Number.isNaN(bonification) && bonification > 0
      ? bonification
      : !Number.isNaN(montantEnergie) && !Number.isNaN(coefficientK) && coefficientK > 0
        ? Math.round(montantEnergie * coefficientK * 1000) / 1000
        : 0;

  const recommandations = buildMtRecommandations({
    souscrite,
    maxAppelee,
    cosPhi: Number.isNaN(cosPhi) ? 0 : cosPhi,
    bonificationCosPhi: bonificationEffective,
    indicateurs,
    powerReadingUnreliable: isMtMaxAppeleeEqualSouscrite(souscrite, maxAppelee),
  });

  return {
    indicateurs: {
      ratio_puissance_pct: indicateurs.ratio_puissance_pct,
      puissance_cible_kva: indicateurs.puissance_cible_kva,
      taux_redevance_puissance_kva: indicateurs.taux_redevance_puissance_kva,
      economie_mensuelle_dt: indicateurs.economie_mensuelle_dt,
      economie_annuelle_dt: indicateurs.economie_annuelle_dt,
      marge_kva: indicateurs.marge_kva,
      depassement_kva: indicateurs.depassement_kva,
      K_bonification: indicateurs.k_bonification ?? undefined,
    },
    recommandations,
  };
}

function enrichEtudeBtMt(raw: FactureExtraiteBtRaw): EtudeBtMtRaw | Record<string, never> {
  const puissance = parseStegNumber(raw.puissance_souscrite_kva);
  if (Number.isNaN(puissance) || puissance <= 100) {
    return {};
  }

  const periode = parseStegNumber(raw.periode_facturation);
  const consommation = parseStegNumber(raw.consommation_totale_kwh);
  const redevances = parseStegNumber(raw.redevances_fixes);

  if (
    Number.isNaN(periode)
    || periode <= 0
    || Number.isNaN(consommation)
    || Number.isNaN(redevances)
  ) {
    return {};
  }

  const { etude } = computeEtudeBtMt({
    puissance_souscrite_kva: puissance,
    periode_facturation: periode,
    consommation_totale_kwh: consommation,
    redevances_fixes: redevances,
  });

  if (etude === null) {
    return {};
  }

  return {
    consommation_annuelle_kwh: stringifyStegNumber(etude.consommation_annuelle_kwh),
    puissance_mt_theorique: stringifyStegNumber(etude.puissance_mt_theorique),
    puissance_mt_recommandee_kva: stringifyStegNumber(etude.puissance_mt_recommandee_kva),
    prix_unitaire_mt: stringifyStegNumber(etude.prix_unitaire_mt),
    capex_dt: stringifyStegNumber(etude.capex_dt),
    opex_annuel_dt: stringifyStegNumber(etude.opex_annuel_dt),
    prime_puissance_mensuelle: stringifyStegNumber(etude.prime_puissance_mensuelle),
    prime_puissance_annuelle: stringifyStegNumber(etude.prime_puissance_annuelle),
    facture_annuelle_bt_dt: stringifyStegNumber(etude.facture_annuelle_bt_dt),
    facture_annuelle_mt_dt: stringifyStegNumber(etude.facture_annuelle_mt_dt),
    economie_annuelle_dt: stringifyStegNumber(etude.economie_annuelle_dt),
    payback_simple_ans: stringifyStegNumber(etude.payback_simple_ans),
    payback_actualise_ans: stringifyStegNumber(etude.payback_actualise_ans),
    van_dt: stringifyStegNumber(etude.van_dt),
    tri_pct: stringifyStegNumber(etude.tri_pct),
    roi_pct: stringifyStegNumber(etude.roi_pct),
    cashflows_25_ans: etude.cashflows_25_ans.map((row) => ({
      annee: row.annee,
      eco_brute: row.eco_brute,
      opex: row.opex,
      gain_net: row.gain_net,
      gain_actualise: row.gain_actualise,
      cumul_simple: row.cumul_simple,
      cumul_actualise: row.cumul_actualise,
    })),
  };
}

function setAffichageValeur(
  affichage: AffichageClientMap,
  field: string,
  value: string
): void {
  const current = affichage[field];
  if (current && typeof current === 'object' && 'valeur' in current) {
    affichage[field] = { ...current, valeur: value };
    return;
  }
  if (typeof current === 'string') {
    affichage[field] = value;
  }
}

function isAffichageFieldLeaf(
  value: AffichageClientField | string | AffichageClientMap
): value is AffichageClientField {
  return typeof value === 'object' && value !== null && 'valeur' in value && 'explication' in value;
}

function setAffichageGazValeur(
  affichage: AffichageClientMap,
  field: string,
  value: string
): void {
  const gazNode = affichage.gaz;
  if (!gazNode || typeof gazNode !== 'object' || isAffichageFieldLeaf(gazNode)) {
    return;
  }
  const gazMap: AffichageClientMap = gazNode;
  const current = gazMap[field];
  if (current && typeof current === 'object' && 'valeur' in current) {
    gazMap[field] = { ...current, valeur: value };
    return;
  }
  if (typeof current === 'string') {
    gazMap[field] = value;
  }
}

function applyBtCorrectionsToResponse(
  response: StegAnalyseResponse,
  changes: ExtractionCorrectionChange[],
  corrected: FactureBtValidationInput
): void {
  if (changes.length === 0) {
    return;
  }

  const raw = response.facture_extraite as FactureExtraiteBtRaw;
  raw.redevances_fixes = corrected.redevances_fixes;
  raw.montant_energie = corrected.montant_energie;
  if (corrected.date_debut_periode !== undefined) {
    raw.date_debut_periode = corrected.date_debut_periode;
  }
  if (corrected.date_fin_periode !== undefined) {
    raw.date_fin_periode = corrected.date_fin_periode;
  }
  if (corrected.gaz) {
    raw.gaz = {
      ...(raw.gaz ?? { presence_gaz: corrected.gaz.presence_gaz }),
      ...corrected.gaz,
    };
  }

  setAffichageValeur(response.affichage_client, 'redevances_fixes', corrected.redevances_fixes);
  setAffichageValeur(response.affichage_client, 'montant_energie', corrected.montant_energie);
  if (corrected.date_debut_periode !== undefined) {
    setAffichageValeur(response.affichage_client, 'date_debut_periode', corrected.date_debut_periode);
  }
  if (corrected.date_fin_periode !== undefined) {
    setAffichageValeur(response.affichage_client, 'date_fin_periode', corrected.date_fin_periode);
  }
  if (corrected.gaz?.consommation_gaz_m3 !== undefined) {
    setAffichageGazValeur(
      response.affichage_client,
      'consommation_gaz_m3',
      corrected.gaz.consommation_gaz_m3
    );
  }
  if (corrected.gaz?.montant_energie_gaz !== undefined) {
    setAffichageGazValeur(
      response.affichage_client,
      'montant_energie_gaz',
      corrected.gaz.montant_energie_gaz
    );
  }
  if (corrected.gaz?.redevances_fixes_gaz !== undefined) {
    setAffichageGazValeur(
      response.affichage_client,
      'redevances_fixes_gaz',
      corrected.gaz.redevances_fixes_gaz
    );
  }

  Logger.warn(
    `STEG BT extraction auto-corrected: ${changes
      .map((change) => `${change.field} ${change.from}→${change.to} (${change.reason})`)
      .join('; ')}`
  );
}

function buildBtValidationInput(bt: FactureExtraiteBtRaw): FactureBtValidationInput {
  return {
    type_facture: 'BT',
    puissance_souscrite_kva: String(bt.puissance_souscrite_kva ?? '-'),
    periode_facturation: String(bt.periode_facturation ?? '-'),
    consommation_totale_kwh: String(bt.consommation_totale_kwh ?? '-'),
    prix_unitaire: String(bt.prix_unitaire ?? '-'),
    redevances_fixes: String(bt.redevances_fixes ?? '-'),
    montant_energie: String(bt.montant_energie ?? '-'),
    date_debut_periode: bt.date_debut_periode,
    date_fin_periode: bt.date_fin_periode,
    gaz: bt.gaz
      ? {
          presence_gaz: String(bt.gaz.presence_gaz ?? 'Non'),
          consommation_gaz_m3: bt.gaz.consommation_gaz_m3,
          prix_unitaire_gaz: bt.gaz.prix_unitaire_gaz,
          montant_energie_gaz: bt.gaz.montant_energie_gaz,
          redevances_fixes_gaz: bt.gaz.redevances_fixes_gaz,
          ancien_index_gaz: bt.gaz.ancien_index_gaz,
          nouvel_index_gaz: bt.gaz.nouvel_index_gaz,
        }
      : undefined,
  };
}

function correctAndValidateBtExtraction(response: StegAnalyseResponse): ExtractionQuality {
  const bt = response.facture_extraite as FactureExtraiteBtRaw;
  const nature = String(bt.nature_facture ?? '').toUpperCase();
  const isEstimee = nature.includes('ESTIM');
  const input = buildBtValidationInput(bt);
  const { facture: corrected, changes } = correctFactureBtExtraction(input, isEstimee ? 10 : 3);
  applyBtCorrectionsToResponse(response, changes, corrected);

  const failures = validateFactureBt(buildBtValidationInput(bt), isEstimee).filter(
    (result) => !result.withinTolerance
  );
  if (failures.length > 0) {
    Logger.warn(
      `STEG BT extraction coherence warnings: ${failures
        .map((f) => `${f.field} Δ${f.deltaPct}%`)
        .join(', ')}`
    );
  }

  return buildExtractionQuality({ changes, validationFailures: failures });
}

function correctAndValidateMtExtraction(response: StegAnalyseResponse): ExtractionQuality {
  const raw = response.facture_extraite as FactureExtraiteMtRaw;
  const input = buildMtValidationInput(raw);
  const { facture: corrected, changes } = correctFactureMtExtraction(input);
  applyMtCorrectionsToResponse(response, changes, corrected);

  const failures = validateFactureMt(buildMtValidationInput(raw)).filter(
    (result) => !result.withinTolerance
  );
  if (failures.length > 0) {
    Logger.warn(
      `STEG MT extraction coherence warnings: ${failures
        .map((f) => `${f.field} Δ${f.deltaPct}%`)
        .join(', ')}`
    );
  }

  return buildExtractionQuality({ changes, validationFailures: failures });
}

function attachExtractionQuality(response: StegAnalyseResponse): void {
  try {
    const quality = isMtBill(response.facture_extraite)
      ? correctAndValidateMtExtraction(response)
      : correctAndValidateBtExtraction(response);
    response.extraction_quality = quality;
    Logger.info(
      `STEG extraction quality: overall=${quality.overall} score=${quality.score} ` +
        `corrections=${quality.corrections_count} suspects=${quality.suspects_count}`
    );
  } catch (error: unknown) {
    Logger.warn(`STEG extraction validation skipped: ${String(error)}`);
  }
}

/**
 * After LLM extraction: correct common field swaps, then attach
 * analyse_mt / etude_bt_mt from pure code + extraction_quality.
 */
export function enrichStegExtractionWithCalculations(
  extraction: {
    facture_extraite: FactureExtraiteBtRaw | FactureExtraiteMtRaw;
    affichage_client: AffichageClientMap;
  }
): StegAnalyseResponse {
  const response: StegAnalyseResponse = {
    facture_extraite: extraction.facture_extraite,
    affichage_client: extraction.affichage_client,
  };

  attachExtractionQuality(response);

  if (isMtBill(extraction.facture_extraite)) {
    response.analyse_mt = enrichMtAnalyse(extraction.facture_extraite);
    response.etude_bt_mt = {};
    return response;
  }

  response.etude_bt_mt = enrichEtudeBtMt(extraction.facture_extraite as FactureExtraiteBtRaw);
  return response;
}

function applyMtCorrectionsToResponse(
  response: StegAnalyseResponse,
  changes: ExtractionCorrectionChange[],
  corrected: FactureMtValidationInput
): void {
  const applicable = changes.filter((change) => change.from !== change.to);
  if (applicable.length === 0) {
    const suspects = changes.filter((change) => change.from === change.to);
    if (suspects.length > 0) {
      Logger.warn(
        `STEG MT extraction suspects (no auto-fix): ${suspects
          .map((change) => `${change.field} (${change.reason})`)
          .join('; ')}`
      );
    }
    return;
  }

  const raw = response.facture_extraite as FactureExtraiteMtRaw;
  raw.cos_phi = corrected.cos_phi;
  raw.coefficient_k = corrected.coefficient_k;
  raw.consommation_totale_kwh = corrected.consommation_totale_kwh;
  raw.bonification_cos_phi = corrected.bonification_cos_phi;
  if (corrected.prime_puissance !== undefined) {
    raw.prime_puissance = corrected.prime_puissance;
  }
  if (corrected.montant_net_a_payer !== undefined) {
    raw.montant_net_a_payer = corrected.montant_net_a_payer;
  }
  if (corrected.mois_facturation !== undefined) {
    raw.mois_facturation = corrected.mois_facturation;
  }

  setAffichageValeur(response.affichage_client, 'cos_phi', corrected.cos_phi);
  setAffichageValeur(
    response.affichage_client,
    'consommation_totale_kwh',
    corrected.consommation_totale_kwh
  );
  setAffichageValeur(
    response.affichage_client,
    'bonification_cos_phi',
    corrected.bonification_cos_phi
  );
  if (corrected.prime_puissance !== undefined) {
    setAffichageValeur(
      response.affichage_client,
      'prime_puissance',
      corrected.prime_puissance
    );
  }
  if (corrected.montant_net_a_payer !== undefined) {
    setAffichageValeur(
      response.affichage_client,
      'montant_net_a_payer',
      corrected.montant_net_a_payer
    );
  }
  if (corrected.mois_facturation !== undefined) {
    setAffichageValeur(
      response.affichage_client,
      'mois_facturation',
      corrected.mois_facturation
    );
  }

  Logger.warn(
    `STEG MT extraction auto-corrected: ${applicable
      .map((change) => `${change.field} ${change.from}→${change.to} (${change.reason})`)
      .join('; ')}`
  );

  const suspects = changes.filter((change) => change.from === change.to);
  if (suspects.length > 0) {
    Logger.warn(
      `STEG MT extraction suspects (no auto-fix): ${suspects
        .map((change) => `${change.field} (${change.reason})`)
        .join('; ')}`
    );
  }
}

function buildMtValidationInput(raw: FactureExtraiteMtRaw): FactureMtValidationInput {
  return {
    type_facture: 'MT',
    puissance_souscrite_kva: String(raw.puissance_souscrite_kva ?? '-'),
    puissance_maximale_appelee_kva: String(
      raw.puissance_maximale_appelee_kva ?? raw.puissance_maximale_appelee_kw ?? '-'
    ),
    consommation_totale_kwh: String(raw.consommation_totale_kwh ?? '-'),
    prix_energie: String(raw.prix_energie ?? '0.291'),
    montant_energie: String(raw.montant_energie ?? '-'),
    prime_puissance: String(raw.prime_puissance ?? '-'),
    cos_phi: String(raw.cos_phi ?? '-'),
    coefficient_k: String(raw.coefficient_k ?? '-'),
    bonification_cos_phi: String(raw.bonification_cos_phi ?? '-'),
    tranche_tarifaire: String(raw.tranche_tarifaire ?? 'Uniforme'),
    montant_net_a_payer: String(raw.montant_net_a_payer ?? '-'),
    mois_facturation: String(raw.mois_facturation ?? '-'),
    date_limite_paiement: String(raw.date_limite_paiement ?? '-'),
  };
}

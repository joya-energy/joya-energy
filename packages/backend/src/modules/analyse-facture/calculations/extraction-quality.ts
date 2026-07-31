/**
 * Always-on STEG extraction confidence from corrections + validation failures.
 * Pure — no LLM.
 */

import type {
  ExtractionCorrectionChange,
  ValidationResult,
} from './steg-calculations';

export type FieldConfidenceStatus = 'ok' | 'corrected' | 'suspect' | 'unverified';

export interface FieldConfidence {
  field: string;
  status: FieldConfidenceStatus;
  reason?: string;
  message_fr: string;
}

export interface ExtractionQuality {
  overall: 'high' | 'medium' | 'low';
  score: number;
  fields: FieldConfidence[];
  corrections_count: number;
  suspects_count: number;
}

const CORRECTION_MESSAGES_FR: Record<string, string> = {
  recomputed_from_coefficient_k: 'Cos φ recalculé à partir du coefficient K (règle STEG).',
  montant_energie_misread_as_kwh: 'Consommation recalculée depuis montant énergie ÷ prix.',
  recomputed_from_montant_energie_div_prix: 'Consommation recalculée depuis montant énergie ÷ prix.',
  recomputed_from_souscrite_x_taux: 'Prime de puissance recalculée (souscrite × taux tarifaire).',
  recomputed_from_montant_energie_x_k: 'Bonification recalculée (montant énergie × K).',
  fabricated_as_conso_x_prix: 'Montant net incohérent (ressemblait à conso × prix) — valeur écartée.',
  ocr_thousands_digit_2_vs_3: 'Montant net corrigé (erreur OCR classique sur le millier).',
  year_aligned_to_date_limite_paiement: 'Année du mois alignée sur la date limite de paiement.',
  suspect_max_equals_souscrite_re_read_required:
    'Puissance max. appelée identique à la souscrite — à confirmer sur la facture.',
  total_electricite_in_montant_energie: 'Montant énergie corrigé (Total Électricité confondu).',
  recomputed_from_kva_x_0_7_x_periode: 'Redevances fixes recalculées (kVA × 0,7 × période).',
};

function messageForReason(reason: string, field: string): string {
  return (
    CORRECTION_MESSAGES_FR[reason]
    ?? `Champ « ${field} » signalé par le contrôle STEG (${reason}).`
  );
}

function messageForValidationFailure(failure: ValidationResult): string {
  return `Cohérence STEG faible sur « ${failure.field} » (écart ${failure.deltaPct}%).`;
}

/**
 * Build per-field confidence from auto-corrections and remaining validation failures.
 */
export function buildExtractionQuality(params: {
  changes: ExtractionCorrectionChange[];
  validationFailures: ValidationResult[];
}): ExtractionQuality {
  const { changes, validationFailures } = params;
  const byField = new Map<string, FieldConfidence>();

  for (const change of changes) {
    const isSuspect = change.from === change.to;
    byField.set(change.field, {
      field: change.field,
      status: isSuspect ? 'suspect' : 'corrected',
      reason: change.reason,
      message_fr: messageForReason(change.reason, change.field),
    });
  }

  for (const failure of validationFailures) {
    const existing = byField.get(failure.field);
    if (existing !== undefined && existing.status !== 'ok') {
      continue;
    }
    byField.set(failure.field, {
      field: failure.field,
      status: 'unverified',
      reason: `validation_delta_${failure.deltaPct}`,
      message_fr: messageForValidationFailure(failure),
    });
  }

  const fields = Array.from(byField.values());
  const correctionsCount = fields.filter((field) => field.status === 'corrected').length;
  const suspectsCount = fields.filter(
    (field) => field.status === 'suspect' || field.status === 'unverified'
  ).length;

  let score = 100 - correctionsCount * 8 - suspectsCount * 22;
  if (score < 0) {
    score = 0;
  }
  if (score > 100) {
    score = 100;
  }

  const overall: ExtractionQuality['overall'] =
    score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low';

  return {
    overall,
    score,
    fields,
    corrections_count: correctionsCount,
    suspects_count: suspectsCount,
  };
}

/** Whether a focused MT re-read is worth the extra vision call. */
export function shouldRefineMtExtraction(quality: ExtractionQuality | undefined): boolean {
  if (quality === undefined) {
    return false;
  }
  if (quality.overall === 'low') {
    return true;
  }
  return quality.fields.some(
    (field) =>
      field.status === 'suspect'
      || field.reason === 'suspect_max_equals_souscrite_re_read_required'
      || field.field === 'puissance_maximale_appelee_kva' && field.status !== 'ok'
  );
}

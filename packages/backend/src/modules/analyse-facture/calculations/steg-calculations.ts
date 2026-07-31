/**
 * Deterministic validation of extracted STEG numbers (OCR cross-checks).
 * Pure functions — no LLM arithmetic.
 */

export interface FactureBtValidationInput {
  type_facture: 'BT';
  puissance_souscrite_kva: string;
  periode_facturation: string;
  consommation_totale_kwh: string;
  prix_unitaire: string;
  redevances_fixes: string;
  montant_energie: string;
  date_debut_periode?: string;
  date_fin_periode?: string;
  gaz?: {
    presence_gaz: string;
    consommation_gaz_m3?: string;
    prix_unitaire_gaz?: string;
    montant_energie_gaz?: string;
    redevances_fixes_gaz?: string;
    ancien_index_gaz?: string;
    nouvel_index_gaz?: string;
  };
}

export interface ExtractionCorrectionChange {
  field: string;
  from: string;
  to: string;
  reason: string;
}

export interface FactureMtValidationInput {
  type_facture: 'MT';
  puissance_souscrite_kva: string;
  puissance_maximale_appelee_kva: string;
  consommation_totale_kwh: string;
  prix_energie: string;
  montant_energie: string;
  prime_puissance: string;
  cos_phi: string;
  coefficient_k: string;
  bonification_cos_phi: string;
  tranche_tarifaire: string;
  /** Optional: used to detect fabricated net amounts (conso×prix). */
  montant_net_a_payer?: string;
  mois_facturation?: string;
  date_limite_paiement?: string;
}

export interface ValidationResult {
  field: string;
  expected: number;
  computed: number;
  deltaPct: number;
  withinTolerance: boolean;
  tolerancePct: number;
}

function parseNumber(value: string | undefined): number {
  if (value === undefined || value === '-' || value === '') {
    return Number.NaN;
  }
  return Number.parseFloat(value);
}

function withinPct(expected: number, computed: number, tolerancePct: number): ValidationResult {
  const deltaPct =
    expected === 0
      ? computed === 0
        ? 0
        : 100
      : (Math.abs((computed - expected) / expected) * 100);
  return {
    field: '',
    expected,
    computed,
    deltaPct: Math.round(deltaPct * 100) / 100,
    withinTolerance: deltaPct <= tolerancePct,
    tolerancePct,
  };
}

/** redevances_fixes = puissance_souscrite_kva × 0.7 × periode_facturation */
export function computeRedevancesFixesBt(
  facture: FactureBtValidationInput,
  tolerancePct = 3
): ValidationResult {
  const kiloVoltAmpere = parseNumber(facture.puissance_souscrite_kva);
  const periode = parseNumber(facture.periode_facturation);
  const computed = Math.round(kiloVoltAmpere * 0.7 * periode * 1000) / 1000;
  return { ...withinPct(parseNumber(facture.redevances_fixes), computed, tolerancePct), field: 'redevances_fixes' };
}

/** montant_energie ≈ consommation_totale_kwh × prix_unitaire */
export function computeMontantEnergieBt(
  facture: FactureBtValidationInput,
  tolerancePct = 3
): ValidationResult {
  const consommation = parseNumber(facture.consommation_totale_kwh);
  const prixUnitaire = parseNumber(facture.prix_unitaire);
  const computed = Math.round(consommation * prixUnitaire * 1000) / 1000;
  return { ...withinPct(parseNumber(facture.montant_energie), computed, tolerancePct), field: 'montant_energie' };
}

/** montant_energie_gaz ≈ consommation_gaz_m3 × prix_unitaire_gaz */
export function computeMontantEnergieGaz(
  facture: FactureBtValidationInput,
  tolerancePct = 3
): ValidationResult | null {
  if (!facture.gaz || facture.gaz.presence_gaz !== 'Oui') {
    return null;
  }
  const consommation = parseNumber(facture.gaz.consommation_gaz_m3);
  const prixUnitaire = parseNumber(facture.gaz.prix_unitaire_gaz);
  const declared = parseNumber(facture.gaz.montant_energie_gaz);
  if (Number.isNaN(consommation) || Number.isNaN(prixUnitaire)) {
    return null;
  }
  const computed = Math.round(consommation * prixUnitaire * 1000) / 1000;
  return { ...withinPct(declared, computed, tolerancePct), field: 'montant_energie_gaz' };
}

/** montant_energie = consommation_totale_kwh × prix_energie */
export function computeMontantEnergieMt(
  facture: FactureMtValidationInput,
  tolerancePct = 3
): ValidationResult {
  const consommation = parseNumber(facture.consommation_totale_kwh);
  const prixEnergie = parseNumber(facture.prix_energie);
  const computed = Math.round(consommation * prixEnergie * 1000) / 1000;
  return { ...withinPct(parseNumber(facture.montant_energie), computed, tolerancePct), field: 'montant_energie' };
}

/** ratio prime_puissance / puissance_souscrite ≈ 5 (Uniforme) or 11 (Horaire) */
export function computePrimePuissanceRatio(
  facture: FactureMtValidationInput,
  tolerancePct = 5
): ValidationResult {
  const kiloVoltAmpere = parseNumber(facture.puissance_souscrite_kva);
  const prime = parseNumber(facture.prime_puissance);
  const ratio = prime / kiloVoltAmpere;
  const expectedRatio = facture.tranche_tarifaire === 'Horaire' ? 11 : 5;
  return { ...withinPct(expectedRatio, ratio, tolerancePct), field: 'prime_puissance_ratio' };
}

/** coefficient_k ≈ (cos_phi - 0.90) × 0.5 when cos_phi > 0.90 */
export function computeCoefficientK(
  facture: FactureMtValidationInput,
  tolerancePct = 10
): ValidationResult | null {
  const cosPhi = parseNumber(facture.cos_phi);
  if (Number.isNaN(cosPhi) || cosPhi <= 0.9) {
    return null;
  }
  const computed = Math.round((cosPhi - 0.9) * 0.5 * 10000) / 10000;
  return { ...withinPct(parseNumber(facture.coefficient_k), computed, tolerancePct), field: 'coefficient_k' };
}

/** bonification_cos_phi ≈ montant_energie × coefficient_k */
export function computeBonificationCosPhi(
  facture: FactureMtValidationInput,
  tolerancePct = 3
): ValidationResult | null {
  const coefficientK = parseNumber(facture.coefficient_k);
  if (Number.isNaN(coefficientK) || coefficientK <= 0) {
    return null;
  }
  const montantEnergie = parseNumber(facture.montant_energie);
  const computed = Math.round(montantEnergie * coefficientK * 1000) / 1000;
  return {
    ...withinPct(parseNumber(facture.bonification_cos_phi), computed, tolerancePct),
    field: 'bonification_cos_phi',
  };
}

export function computeRatioPuissancePct(facture: FactureMtValidationInput): number {
  const souscrite = parseNumber(facture.puissance_souscrite_kva);
  const maxAppelee = parseNumber(facture.puissance_maximale_appelee_kva);
  return Math.round((maxAppelee / souscrite) * 10000) / 100;
}

export function validateFactureBt(facture: FactureBtValidationInput, isEstimee = false): ValidationResult[] {
  const energieTolerance = isEstimee ? 10 : 3;
  const results: ValidationResult[] = [
    computeRedevancesFixesBt(facture),
    computeMontantEnergieBt(facture, energieTolerance),
  ];
  const gazResult = computeMontantEnergieGaz(facture);
  if (gazResult !== null) {
    results.push(gazResult);
  }
  return results;
}

export function validateFactureMt(facture: FactureMtValidationInput): ValidationResult[] {
  const results: ValidationResult[] = [
    computeMontantEnergieMt(facture),
    computePrimePuissanceRatio(facture),
  ];
  const coefficientResult = computeCoefficientK(facture);
  if (coefficientResult !== null) {
    results.push(coefficientResult);
  }
  const bonificationResult = computeBonificationCosPhi(facture);
  if (bonificationResult !== null) {
    results.push(bonificationResult);
  }
  return results;
}

function isWithinTolerance(declared: number, expected: number, tolerancePct: number): boolean {
  if (Number.isNaN(declared) || Number.isNaN(expected)) {
    return false;
  }
  if (expected === 0) {
    return declared === 0;
  }
  return (Math.abs((declared - expected) / expected) * 100) <= tolerancePct;
}

function formatCorrectedAmount(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/**
 * Fixes common LLM swap patterns:
 * - redevances_fixes ↔ montant_energie
 * - montant_energie = Total Électricité (énergie + redevances)
 * - montant_energie_gaz = Total Gaz, redevances_fixes_gaz = énergie gaz
 */
export function correctFactureBtExtraction(
  facture: FactureBtValidationInput,
  tolerancePct = 3
): { facture: FactureBtValidationInput; changes: ExtractionCorrectionChange[] } {
  const changes: ExtractionCorrectionChange[] = [];
  const corrected: FactureBtValidationInput = {
    ...facture,
    gaz: facture.gaz ? { ...facture.gaz } : undefined,
  };

  const expectedRedevances = computeRedevancesFixesBt(facture, tolerancePct).computed;
  const expectedEnergie = computeMontantEnergieBt(facture, tolerancePct).computed;
  const declaredRedevances = parseNumber(facture.redevances_fixes);
  const declaredEnergie = parseNumber(facture.montant_energie);

  if (!Number.isNaN(expectedRedevances) && !Number.isNaN(expectedEnergie)) {
    const energieOk = isWithinTolerance(declaredEnergie, expectedEnergie, tolerancePct);
    const redevancesOk = isWithinTolerance(declaredRedevances, expectedRedevances, tolerancePct);
    const totalElec = expectedEnergie + expectedRedevances;

    if (!energieOk || !redevancesOk) {
      const pureSwap =
        isWithinTolerance(declaredRedevances, expectedEnergie, tolerancePct)
        && isWithinTolerance(declaredEnergie, expectedRedevances, tolerancePct);

      const totalInEnergieSlot =
        isWithinTolerance(declaredEnergie, totalElec, tolerancePct)
        && (
          isWithinTolerance(declaredRedevances, expectedEnergie, tolerancePct)
          || !redevancesOk
        );

      if (pureSwap) {
        corrected.redevances_fixes = formatCorrectedAmount(expectedRedevances);
        corrected.montant_energie = formatCorrectedAmount(expectedEnergie);
        changes.push({
          field: 'redevances_fixes',
          from: facture.redevances_fixes,
          to: corrected.redevances_fixes,
          reason: 'swap_with_montant_energie',
        });
        changes.push({
          field: 'montant_energie',
          from: facture.montant_energie,
          to: corrected.montant_energie,
          reason: 'swap_with_redevances_fixes',
        });
      } else if (totalInEnergieSlot) {
        corrected.montant_energie = formatCorrectedAmount(expectedEnergie);
        corrected.redevances_fixes = formatCorrectedAmount(expectedRedevances);
        changes.push({
          field: 'montant_energie',
          from: facture.montant_energie,
          to: corrected.montant_energie,
          reason: 'total_electricite_in_montant_energie',
        });
        if (!isWithinTolerance(declaredRedevances, expectedRedevances, tolerancePct)) {
          changes.push({
            field: 'redevances_fixes',
            from: facture.redevances_fixes,
            to: corrected.redevances_fixes,
            reason: 'recomputed_from_kva_x_0_7_x_periode',
          });
        }
      } else {
        if (!redevancesOk) {
          corrected.redevances_fixes = formatCorrectedAmount(expectedRedevances);
          changes.push({
            field: 'redevances_fixes',
            from: facture.redevances_fixes,
            to: corrected.redevances_fixes,
            reason: 'recomputed_from_kva_x_0_7_x_periode',
          });
        }
        if (!energieOk) {
          corrected.montant_energie = formatCorrectedAmount(expectedEnergie);
          changes.push({
            field: 'montant_energie',
            from: facture.montant_energie,
            to: corrected.montant_energie,
            reason: 'recomputed_from_kwh_x_prix_unitaire',
          });
        }
      }
    }
  }

  if (corrected.gaz && corrected.gaz.presence_gaz === 'Oui') {
    const gazChanges = correctGazExtraction(corrected.gaz, tolerancePct);
    corrected.gaz = gazChanges.gaz;
    changes.push(...gazChanges.changes);
  }

  const dateChanges = correctBtPeriodDates(corrected);
  corrected.date_debut_periode = dateChanges.facture.date_debut_periode;
  corrected.date_fin_periode = dateChanges.facture.date_fin_periode;
  changes.push(...dateChanges.changes);

  return { facture: corrected, changes };
}

function isBlankIndex(value: string | undefined): boolean {
  return value === undefined || value === '' || value === '-';
}

function isWholeNumber(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value - Math.round(value)) < 0.001;
}

/**
 * fixture_05 production bug: blank Quantité/Index cells → model reads Nbre de Mois
 * as m³ and Puissance/Débit as redevance, then invents énergie = m³ × P.U.
 * That fake énergie looks “coherent”, so this must run before the énergie check.
 */
function isGazColumnShiftPattern(
  consommation: number,
  prixUnitaire: number,
  declaredEnergie: number,
  declaredRedevances: number,
  gaz: NonNullable<FactureBtValidationInput['gaz']>,
  tolerancePct: number
): boolean {
  if (Number.isNaN(consommation) || Number.isNaN(prixUnitaire)) {
    return false;
  }
  if (!isWholeNumber(consommation) || consommation < 1 || consommation > 24) {
    return false;
  }
  if (!isBlankIndex(gaz.ancien_index_gaz) || !isBlankIndex(gaz.nouvel_index_gaz)) {
    return false;
  }
  const expectedEnergie = Math.round(consommation * prixUnitaire * 1000) / 1000;
  if (!isWithinTolerance(declaredEnergie, expectedEnergie, tolerancePct)) {
    return false;
  }
  if (
    Number.isNaN(declaredRedevances)
    || declaredRedevances <= 0
    || declaredRedevances > 99
    || !isWholeNumber(declaredRedevances)
  ) {
    return false;
  }
  return true;
}

/** months between ISO dates (calendar months, day-of-month tolerant). */
export function monthsBetweenIsoDates(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
    + (endDate.getUTCMonth() - startDate.getUTCMonth());
  const dayDelta = endDate.getUTCDate() - startDate.getUTCDate();
  if (dayDelta > 15) {
    return months + 1;
  }
  if (dayDelta < -15) {
    return months - 1;
  }
  return months;
}

export function correctBtPeriodDates(
  facture: FactureBtValidationInput,
  shortfallToleranceMonths = 1
): { facture: FactureBtValidationInput; changes: ExtractionCorrectionChange[] } {
  const changes: ExtractionCorrectionChange[] = [];
  const periode = parseNumber(facture.periode_facturation);
  const debut = facture.date_debut_periode;
  const fin = facture.date_fin_periode;
  if (
    Number.isNaN(periode)
    || periode <= 0
    || debut === undefined
    || fin === undefined
    || debut === '-'
    || fin === '-'
  ) {
    return { facture, changes };
  }

  const span = monthsBetweenIsoDates(debut, fin);
  // Estimated bills often span more calendar months than Nbre de Mois (e.g. 24 vs 18).
  // Only reject when Du/Au cover *fewer* months than the billed period (contamination).
  if (span === null || span + shortfallToleranceMonths >= periode) {
    return { facture, changes };
  }

  const corrected = {
    ...facture,
    date_debut_periode: '-',
    date_fin_periode: '-',
  };
  changes.push({
    field: 'date_debut_periode',
    from: debut,
    to: '-',
    reason: `period_span_${span}_shorter_than_periode_${periode}`,
  });
  changes.push({
    field: 'date_fin_periode',
    from: fin,
    to: '-',
    reason: `period_span_${span}_shorter_than_periode_${periode}`,
  });
  return { facture: corrected, changes };
}

function correctGazExtraction(
  gaz: NonNullable<FactureBtValidationInput['gaz']>,
  tolerancePct: number
): {
  gaz: NonNullable<FactureBtValidationInput['gaz']>;
  changes: ExtractionCorrectionChange[];
} {
  const changes: ExtractionCorrectionChange[] = [];
  const corrected = { ...gaz };
  const consommation = parseNumber(gaz.consommation_gaz_m3);
  const prixUnitaire = parseNumber(gaz.prix_unitaire_gaz);
  const declaredEnergie = parseNumber(gaz.montant_energie_gaz);
  const declaredRedevances = parseNumber(gaz.redevances_fixes_gaz);

  if (
    !Number.isNaN(consommation)
    && !Number.isNaN(prixUnitaire)
    && isGazColumnShiftPattern(
      consommation,
      prixUnitaire,
      declaredEnergie,
      declaredRedevances,
      gaz,
      tolerancePct
    )
  ) {
    corrected.consommation_gaz_m3 = '0';
    corrected.montant_energie_gaz = '0';
    corrected.redevances_fixes_gaz = '-';
    changes.push({
      field: 'consommation_gaz_m3',
      from: String(gaz.consommation_gaz_m3 ?? '-'),
      to: '0',
      reason: 'gaz_column_shift_nbre_mois_as_quantite',
    });
    changes.push({
      field: 'montant_energie_gaz',
      from: String(gaz.montant_energie_gaz ?? '-'),
      to: '0',
      reason: 'gaz_column_shift_invented_energie',
    });
    changes.push({
      field: 'redevances_fixes_gaz',
      from: String(gaz.redevances_fixes_gaz ?? '-'),
      to: '-',
      reason: 'gaz_column_shift_puissance_debit_as_redevance',
    });
    return { gaz: corrected, changes };
  }

  if (consommation === 0 && !Number.isNaN(declaredEnergie) && declaredEnergie !== 0) {
    corrected.montant_energie_gaz = '0';
    changes.push({
      field: 'montant_energie_gaz',
      from: String(gaz.montant_energie_gaz ?? '-'),
      to: '0',
      reason: 'zero_consommation_implies_zero_energie',
    });
  }

  if (Number.isNaN(consommation) || Number.isNaN(prixUnitaire)) {
    return { gaz: corrected, changes };
  }

  const expectedEnergie = Math.round(consommation * prixUnitaire * 1000) / 1000;
  const effectiveEnergie = parseNumber(corrected.montant_energie_gaz);
  const energieOk = isWithinTolerance(effectiveEnergie, expectedEnergie, tolerancePct);

  if (energieOk) {
    return { gaz: corrected, changes };
  }

  const redevancesLooksLikeEnergie = isWithinTolerance(
    declaredRedevances,
    expectedEnergie,
    tolerancePct
  );

  if (redevancesLooksLikeEnergie && !Number.isNaN(effectiveEnergie)) {
    const inferredRedevances = Math.round((effectiveEnergie - expectedEnergie) * 1000) / 1000;
    corrected.montant_energie_gaz = formatCorrectedAmount(expectedEnergie);
    changes.push({
      field: 'montant_energie_gaz',
      from: String(gaz.montant_energie_gaz ?? '-'),
      to: corrected.montant_energie_gaz,
      reason: 'total_gaz_or_swap_with_redevances',
    });

    if (inferredRedevances >= 0) {
      corrected.redevances_fixes_gaz = formatCorrectedAmount(inferredRedevances);
      changes.push({
        field: 'redevances_fixes_gaz',
        from: String(gaz.redevances_fixes_gaz ?? '-'),
        to: corrected.redevances_fixes_gaz,
        reason: 'residual_after_energie_correction',
      });
    } else if (effectiveEnergie >= 0 && effectiveEnergie < expectedEnergie) {
      corrected.redevances_fixes_gaz = formatCorrectedAmount(effectiveEnergie);
      changes.push({
        field: 'redevances_fixes_gaz',
        from: String(gaz.redevances_fixes_gaz ?? '-'),
        to: corrected.redevances_fixes_gaz,
        reason: 'swap_with_montant_energie_gaz',
      });
    }
    return { gaz: corrected, changes };
  }

  if (!Number.isNaN(effectiveEnergie)) {
    corrected.montant_energie_gaz = formatCorrectedAmount(expectedEnergie);
    changes.push({
      field: 'montant_energie_gaz',
      from: String(gaz.montant_energie_gaz ?? '-'),
      to: corrected.montant_energie_gaz,
      reason: 'recomputed_from_m3_x_prix_unitaire',
    });
  }

  return { gaz: corrected, changes };
}

/**
 * Fixes common MT OCR / LLM mistakes:
 * - cos_phi confused with coefficient_k (or threshold 0.91)
 * - consommation = montant_energie × 100 (decimal lost)
 * - bonification inconsistent with montant × K
 * - montant_net_a_payer fabricated as conso × prix (ignores prime/taxes)
 */
export function correctFactureMtExtraction(
  facture: FactureMtValidationInput,
  tolerancePct = 3
): { facture: FactureMtValidationInput; changes: ExtractionCorrectionChange[] } {
  const changes: ExtractionCorrectionChange[] = [];
  const corrected: FactureMtValidationInput = { ...facture };

  const prix = parseNumber(facture.prix_energie);
  const montantEnergie = parseNumber(facture.montant_energie);
  const declaredConso = parseNumber(facture.consommation_totale_kwh);
  const coefficientK = parseNumber(facture.coefficient_k);
  const declaredCos = parseNumber(facture.cos_phi);
  const declaredBonif = parseNumber(facture.bonification_cos_phi);
  const declaredNet = parseNumber(facture.montant_net_a_payer ?? '-');
  const souscrite = parseNumber(facture.puissance_souscrite_kva);
  const maxAppelee = parseNumber(facture.puissance_maximale_appelee_kva);

  // 1) cos_phi from coefficient_k when inconsistent (K = (cos − 0.90) × 0.5)
  if (
    !Number.isNaN(coefficientK)
    && coefficientK > 0
    && coefficientK <= 0.1
  ) {
    const expectedCos = Math.round((0.9 + coefficientK / 0.5) * 1000) / 1000;
    if (
      Number.isNaN(declaredCos)
      || declaredCos < 0.6
      || declaredCos > 1
      || Math.abs(declaredCos - expectedCos) > 0.02
    ) {
      corrected.cos_phi = formatCorrectedAmount(expectedCos);
      changes.push({
        field: 'cos_phi',
        from: facture.cos_phi,
        to: corrected.cos_phi,
        reason: 'recomputed_from_coefficient_k',
      });
    }
  }

  // 2) consommation from montant_energie / prix (fixes ×100 OCR on amount-as-kWh)
  if (!Number.isNaN(prix) && prix > 0 && !Number.isNaN(montantEnergie) && montantEnergie > 0) {
    const expectedConso = Math.round(montantEnergie / prix);
    const energieFromDeclared =
      !Number.isNaN(declaredConso) ? declaredConso * prix : Number.NaN;
    const consoOk = isWithinTolerance(energieFromDeclared, montantEnergie, tolerancePct);
    const expectedOk = isWithinTolerance(expectedConso * prix, montantEnergie, tolerancePct);

    const looksLikeAmountTimes100 =
      !Number.isNaN(declaredConso)
      && isWithinTolerance(declaredConso, montantEnergie * 100, 2);

    const looksLikeAmountTimes1000 =
      !Number.isNaN(declaredConso)
      && isWithinTolerance(declaredConso, montantEnergie * 1000, 2);

    if (
      (!consoOk && expectedOk)
      || looksLikeAmountTimes100
      || looksLikeAmountTimes1000
    ) {
      corrected.consommation_totale_kwh = String(expectedConso);
      changes.push({
        field: 'consommation_totale_kwh',
        from: facture.consommation_totale_kwh,
        to: corrected.consommation_totale_kwh,
        reason: looksLikeAmountTimes100 || looksLikeAmountTimes1000
          ? 'montant_energie_misread_as_kwh'
          : 'recomputed_from_montant_energie_div_prix',
      });
    }
  }

  // 3b) prime_puissance ≈ souscrite × 5 (Uniforme) or × 11 (Horaire)
  if (!Number.isNaN(souscrite) && souscrite > 0) {
    const declaredPrime = parseNumber(facture.prime_puissance);
    const taux = facture.tranche_tarifaire === 'Horaire' ? 11 : 5;
    const expectedPrime = Math.round(souscrite * taux * 1000) / 1000;
    if (
      Number.isNaN(declaredPrime)
      || declaredPrime <= 0
      || !isWithinTolerance(declaredPrime, expectedPrime, tolerancePct)
    ) {
      corrected.prime_puissance = formatCorrectedAmount(expectedPrime);
      changes.push({
        field: 'prime_puissance',
        from: facture.prime_puissance,
        to: corrected.prime_puissance,
        reason: 'recomputed_from_souscrite_x_taux',
      });
    }
  }

  // 3) bonification = |montant_energie × K|
  const effectiveK = parseNumber(corrected.coefficient_k);
  const effectiveMontant = parseNumber(corrected.montant_energie);
  if (
    !Number.isNaN(effectiveK)
    && effectiveK > 0
    && !Number.isNaN(effectiveMontant)
    && effectiveMontant > 0
  ) {
    const expectedBonif = Math.round(effectiveMontant * effectiveK * 1000) / 1000;
    const absDeclared = Number.isNaN(declaredBonif) ? Number.NaN : Math.abs(declaredBonif);
    if (
      Number.isNaN(absDeclared)
      || !isWithinTolerance(absDeclared, expectedBonif, tolerancePct)
    ) {
      corrected.bonification_cos_phi = formatCorrectedAmount(expectedBonif);
      changes.push({
        field: 'bonification_cos_phi',
        from: facture.bonification_cos_phi,
        to: corrected.bonification_cos_phi,
        reason: 'recomputed_from_montant_energie_x_k',
      });
    }
  }

  // 4) montant_net fabricated as conso×prix (ignores prime / taxes)
  const consoForNetCheck = parseNumber(corrected.consommation_totale_kwh);
  const effectivePrime = parseNumber(corrected.prime_puissance);
  const effectiveBonifAbs = (() => {
    const fromCorrected = parseNumber(corrected.bonification_cos_phi);
    if (!Number.isNaN(fromCorrected)) {
      return Math.abs(fromCorrected);
    }
    return Number.isNaN(declaredBonif) ? 0 : Math.abs(declaredBonif);
  })();

  if (
    !Number.isNaN(declaredNet)
    && !Number.isNaN(consoForNetCheck)
    && !Number.isNaN(prix)
    && prix > 0
    && !Number.isNaN(effectivePrime)
    && effectivePrime > 0
  ) {
    const fabricatedFromWrongConso =
      !Number.isNaN(declaredConso)
      && isWithinTolerance(declaredNet, declaredConso * prix, tolerancePct);
    const fabricatedFromCorrectConso = isWithinTolerance(
      declaredNet,
      consoForNetCheck * prix,
      tolerancePct
    );
    const fabricatedFromMontant =
      !Number.isNaN(montantEnergie)
      && isWithinTolerance(declaredNet, montantEnergie, tolerancePct);

    if (fabricatedFromWrongConso || fabricatedFromCorrectConso || fabricatedFromMontant) {
      corrected.montant_net_a_payer = '-';
      changes.push({
        field: 'montant_net_a_payer',
        from: String(facture.montant_net_a_payer ?? '-'),
        to: '-',
        reason: 'fabricated_as_conso_x_prix',
      });
    }
  }

  // 4b) montant_net below accounting floor → classic OCR 3↔2 on thousands (2769 → 3769)
  const netAfterStep4 = parseNumber(corrected.montant_net_a_payer ?? '-');
  if (
    !Number.isNaN(netAfterStep4)
    && !Number.isNaN(montantEnergie)
    && !Number.isNaN(effectivePrime)
    && effectivePrime > 0
  ) {
    const accountingFloor = montantEnergie + effectivePrime - effectiveBonifAbs;
    if (netAfterStep4 + 0.5 < accountingFloor) {
      const plusThousand = Math.round((netAfterStep4 + 1000) * 1000) / 1000;
      const upperBound = accountingFloor + Math.max(montantEnergie, 2000);
      if (plusThousand >= accountingFloor && plusThousand <= upperBound) {
        corrected.montant_net_a_payer = formatCorrectedAmount(plusThousand);
        changes.push({
          field: 'montant_net_a_payer',
          from: String(facture.montant_net_a_payer ?? netAfterStep4),
          to: corrected.montant_net_a_payer,
          reason: 'ocr_thousands_digit_2_vs_3',
        });
      }
    }
  }

  // 4c) mois_facturation year from date_limite_paiement (2023 vs 2025)
  const mois = String(facture.mois_facturation ?? '');
  const dateLimite = String(facture.date_limite_paiement ?? '');
  const moisMatch = mois.match(/^(\d{1,2})\/(\d{4})$/);
  const yearFromEcheance = (() => {
    const iso = dateLimite.match(/(\d{4})/);
    if (iso) {
      return iso[1];
    }
    const fr = dateLimite.match(/\d{1,2}[\/.-]\d{1,2}[\/.-](\d{4})/);
    return fr?.[1] ?? null;
  })();
  if (moisMatch !== null && yearFromEcheance !== null && moisMatch[2] !== yearFromEcheance) {
    const monthPart = moisMatch[1].padStart(2, '0');
    corrected.mois_facturation = `${monthPart}/${yearFromEcheance}`;
    changes.push({
      field: 'mois_facturation',
      from: mois,
      to: corrected.mois_facturation,
      reason: 'year_aligned_to_date_limite_paiement',
    });
  }

  // 5) Log-only hint when max == souscrite (cannot invent the real max from OCR)
  if (isMtMaxAppeleeEqualSouscrite(souscrite, maxAppelee)) {
    changes.push({
      field: 'puissance_maximale_appelee_kva',
      from: facture.puissance_maximale_appelee_kva,
      to: facture.puissance_maximale_appelee_kva,
      reason: 'suspect_max_equals_souscrite_re_read_required',
    });
  }

  return { facture: corrected, changes };
}

/** True when OCR likely copied puissance souscrite into max appelée. */
export function isMtMaxAppeleeEqualSouscrite(
  souscrite: number,
  maxAppelee: number
): boolean {
  return (
    !Number.isNaN(souscrite)
    && !Number.isNaN(maxAppelee)
    && souscrite > 0
    && Math.abs(maxAppelee - souscrite) < 0.01
  );
}

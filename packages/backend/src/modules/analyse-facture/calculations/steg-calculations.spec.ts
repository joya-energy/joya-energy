import {
  classifyCategorieCosPhi,
  classifyCategoriePuissance,
  computeIndicateursMt,
  computeBonificationSecours,
  computePenaliteCosPhiPct,
} from './steg-mt-analysis';
import { computeEtudeBtMt, puissanceMtRecommandee, prixUnitaireMt } from './steg-etude-bt-mt';
import {
  correctFactureBtExtraction,
  correctFactureMtExtraction,
  computeRedevancesFixesBt,
  computeMontantEnergieBt,
} from './steg-calculations';
import { enrichStegExtractionWithCalculations } from './enrich-steg-response';

describe('steg-mt-analysis', () => {
  it('classifies DEMCO-like ratio 67% as P0 and cos 0.91 as C1', () => {
    const indicateurs = computeIndicateursMt(1200, 807, 'Uniforme', 0.91);
    expect(indicateurs.ratio_puissance_pct).toBeCloseTo(67.25, 2);
    expect(classifyCategoriePuissance(indicateurs.ratio_puissance_pct)).toBe('P0');
    expect(classifyCategorieCosPhi(0.91)).toBe('C1');
    expect(indicateurs.k_bonification).toBeCloseTo(0.005, 4);
    expect(computeBonificationSecours(30710.394, 0.005)).toBeCloseTo(153.552, 2);
  });

  it('classifies CAPSA-like ratio 14% as P1', () => {
    const indicateurs = computeIndicateursMt(630, 88, 'Uniforme', 0.94);
    expect(indicateurs.ratio_puissance_pct).toBeCloseTo(13.97, 2);
    expect(classifyCategoriePuissance(indicateurs.ratio_puissance_pct)).toBe('P1');
  });

  it('applies strict puissance category boundaries', () => {
    expect(classifyCategoriePuissance((88 / 630) * 100)).toBe('P1');
    expect(classifyCategoriePuissance((350 / 630) * 100)).toBe('P2');
    expect(classifyCategoriePuissance((420 / 630) * 100)).toBe('P0');
    expect(classifyCategoriePuissance((610 / 630) * 100)).toBe('P3');
  });

  it('computes cos phi penalty tiers', () => {
    expect(computePenaliteCosPhiPct(0.85)).toBe(0);
    expect(computePenaliteCosPhiPct(0.77)).toBeCloseTo(1.5, 2);
    expect(computePenaliteCosPhiPct(0.72)).toBeCloseTo(5.5, 2);
  });
});

describe('steg-etude-bt-mt', () => {
  it('resolves MT power tiers', () => {
    expect(puissanceMtRecommandee(224.4)).toBe(250);
    expect(prixUnitaireMt(250)).toBe(600);
  });

  it('matches reference case fixture_02 (132 kVA / 40833 kWh)', () => {
    const { etude, economieAnnuelleDt } = computeEtudeBtMt({
      puissance_souscrite_kva: 132,
      periode_facturation: 1,
      consommation_totale_kwh: 40833,
      redevances_fixes: 92.4,
    });

    expect(etude).not.toBeNull();
    if (etude === null) {
      return;
    }

    expect(etude.consommation_annuelle_kwh).toBeCloseTo(489996, 0);
    expect(etude.puissance_mt_recommandee_kva).toBe(250);
    expect(etude.capex_dt).toBe(150000);
    expect(etude.facture_annuelle_bt_dt).toBeCloseTo(192697.236, 2);
    expect(etude.facture_annuelle_mt_dt).toBeCloseTo(157588.836, 2);
    expect(economieAnnuelleDt).toBeCloseTo(35108.4, 1);
    expect(etude.van_dt).toBeCloseTo(536834.82, 0);
    expect(etude.roi_pct).toBeCloseTo(13.07, 1);
    expect(etude.tri_pct).toBeCloseTo(28.48, 0);
    expect(etude.payback_simple_ans).toBeCloseTo(4.16, 1);
    expect(etude.payback_actualise_ans).toBeCloseTo(5.11, 1);
    expect(etude.cashflows_25_ans).toHaveLength(25);
  });

  it('suppresses etude when annual economy is negative (fixture_05)', () => {
    const { etude, economieAnnuelleDt } = computeEtudeBtMt({
      puissance_souscrite_kva: 106,
      periode_facturation: 18,
      consommation_totale_kwh: 26316,
      redevances_fixes: 1335.6,
    });

    expect(economieAnnuelleDt).toBeCloseTo(-12355.2, 0);
    expect(etude).toBeNull();
  });
});

describe('steg-calculations', () => {
  it('validates BT redevances and energie for fixture_02', () => {
    const facture = {
      type_facture: 'BT' as const,
      puissance_souscrite_kva: '132',
      periode_facturation: '1',
      consommation_totale_kwh: '40833',
      prix_unitaire: '0.391',
      redevances_fixes: '92.400',
      montant_energie: '15965.703',
    };

    expect(computeRedevancesFixesBt(facture).withinTolerance).toBe(true);
    expect(computeMontantEnergieBt(facture).withinTolerance).toBe(true);
  });

  it('corrects Total Electricité in montant_energie + energie in redevances (fixture_02 swap)', () => {
    const { facture, changes } = correctFactureBtExtraction({
      type_facture: 'BT',
      puissance_souscrite_kva: '132',
      periode_facturation: '1',
      consommation_totale_kwh: '40833',
      prix_unitaire: '0.391',
      redevances_fixes: '15965.703',
      montant_energie: '16058.103',
    });

    expect(Number(facture.redevances_fixes)).toBeCloseTo(92.4, 1);
    expect(Number(facture.montant_energie)).toBeCloseTo(15965.703, 2);
    expect(changes.length).toBeGreaterThan(0);
  });

  it('corrects pure montant_energie ↔ redevances_fixes swap', () => {
    const { facture } = correctFactureBtExtraction({
      type_facture: 'BT',
      puissance_souscrite_kva: '132',
      periode_facturation: '1',
      consommation_totale_kwh: '40833',
      prix_unitaire: '0.391',
      redevances_fixes: '15965.703',
      montant_energie: '92.400',
    });

    expect(Number(facture.redevances_fixes)).toBeCloseTo(92.4, 1);
    expect(Number(facture.montant_energie)).toBeCloseTo(15965.703, 2);
  });

  it('corrects Total Gaz in montant_energie_gaz when redevances holds énergie', () => {
    const { facture } = correctFactureBtExtraction({
      type_facture: 'BT',
      puissance_souscrite_kva: '132',
      periode_facturation: '1',
      consommation_totale_kwh: '40833',
      prix_unitaire: '0.391',
      redevances_fixes: '92.400',
      montant_energie: '15965.703',
      gaz: {
        presence_gaz: 'Oui',
        consommation_gaz_m3: '130',
        prix_unitaire_gaz: '0.588',
        montant_energie_gaz: '92.44',
        redevances_fixes_gaz: '76.44',
        ancien_index_gaz: '93292',
        nouvel_index_gaz: '93422',
      },
    });

    expect(Number(facture.gaz?.montant_energie_gaz)).toBeCloseTo(76.44, 2);
    expect(Number(facture.gaz?.redevances_fixes_gaz)).toBeCloseTo(16, 1);
  });

  it('corrects fixture_05 gaz column-shift (Nbre de Mois / Puissance-Débit as qty/redevance)', () => {
    const { facture, changes } = correctFactureBtExtraction({
      type_facture: 'BT',
      puissance_souscrite_kva: '106',
      periode_facturation: '18',
      consommation_totale_kwh: '26316',
      prix_unitaire: '0.391',
      redevances_fixes: '1335.600',
      montant_energie: '9863.708',
      date_debut_periode: '2024-01-22',
      date_fin_periode: '2024-04-28',
      gaz: {
        presence_gaz: 'Oui',
        consommation_gaz_m3: '4',
        prix_unitaire_gaz: '0.588',
        montant_energie_gaz: '2.35',
        redevances_fixes_gaz: '25',
        ancien_index_gaz: '-',
        nouvel_index_gaz: '-',
      },
    });

    expect(facture.gaz?.consommation_gaz_m3).toBe('0');
    expect(facture.gaz?.montant_energie_gaz).toBe('0');
    expect(facture.gaz?.redevances_fixes_gaz).toBe('-');
    expect(facture.date_debut_periode).toBe('-');
    expect(facture.date_fin_periode).toBe('-');
    expect(changes.some((c) => c.reason.includes('gaz_column_shift'))).toBe(true);
    expect(changes.some((c) => c.reason.includes('period_span_'))).toBe(true);
  });

  it('keeps coherent fixture_05 dates when span matches periode', () => {
    const { facture, changes } = correctFactureBtExtraction({
      type_facture: 'BT',
      puissance_souscrite_kva: '106',
      periode_facturation: '18',
      consommation_totale_kwh: '26316',
      prix_unitaire: '0.391',
      redevances_fixes: '1335.600',
      montant_energie: '9863.708',
      date_debut_periode: '2024-04-26',
      date_fin_periode: '2026-04-22',
      gaz: {
        presence_gaz: 'Oui',
        consommation_gaz_m3: '0',
        prix_unitaire_gaz: '0.588',
        montant_energie_gaz: '0',
        redevances_fixes_gaz: '40.000',
        ancien_index_gaz: '-',
        nouvel_index_gaz: '-',
      },
    });

    expect(facture.date_debut_periode).toBe('2024-04-26');
    expect(facture.date_fin_periode).toBe('2026-04-22');
    expect(facture.gaz?.redevances_fixes_gaz).toBe('40.000');
    expect(changes.filter((c) => c.field.startsWith('date_'))).toHaveLength(0);
  });
});

describe('enrichStegExtractionWithCalculations', () => {
  it('auto-corrects swapped BT fields before etude fixture_02', () => {
    const response = enrichStegExtractionWithCalculations({
      facture_extraite: {
        type_facture: 'BT',
        puissance_souscrite_kva: '132',
        periode_facturation: '1',
        consommation_totale_kwh: '40833',
        prix_unitaire: '0.391',
        redevances_fixes: '15965.703',
        montant_energie: '16058.103',
      },
      affichage_client: {
        redevances_fixes: { valeur: '15965.703', explication: 'test' },
        montant_energie: { valeur: '16058.103', explication: 'test' },
      },
    });

    const facture = response.facture_extraite as {
      redevances_fixes?: string;
      montant_energie?: string;
    };
    expect(Number(facture.redevances_fixes)).toBeCloseTo(92.4, 1);
    expect(Number(facture.montant_energie)).toBeCloseTo(15965.703, 2);

    const etude = response.etude_bt_mt as {
      economie_annuelle_dt?: string;
      tri_pct?: string;
      payback_simple_ans?: string;
      van_dt?: string;
    };
    expect(Number(etude.economie_annuelle_dt)).toBeCloseTo(35108.4, 0);
    expect(Number(etude.tri_pct)).toBeCloseTo(28.48, 0);
    expect(Number(etude.payback_simple_ans)).toBeCloseTo(4.16, 1);
    expect(Number(etude.van_dt)).toBeCloseTo(536834.82, 0);
  });
});

describe('correctFactureMtExtraction', () => {
  it('fixes cos_phi from coefficient_k and kWh from montant/prix (PH MT bill pattern)', () => {
    const { facture, changes } = correctFactureMtExtraction({
      type_facture: 'MT',
      puissance_souscrite_kva: '120',
      puissance_maximale_appelee_kva: '120',
      consommation_totale_kwh: '255936',
      prix_energie: '0.291',
      montant_energie: '2559.636',
      prime_puissance: '600',
      cos_phi: '0.91',
      coefficient_k: '0.045',
      bonification_cos_phi: '3355.964',
      tranche_tarifaire: 'Uniforme',
      montant_net_a_payer: '75176.98',
    });

    expect(facture.cos_phi).toBe('0.99');
    expect(facture.consommation_totale_kwh).toBe('8796');
    expect(Number(facture.bonification_cos_phi)).toBeCloseTo(115.184, 2);
    expect(facture.montant_net_a_payer).toBe('-');
    expect(changes.some((c) => c.field === 'cos_phi')).toBe(true);
    expect(changes.some((c) => c.field === 'consommation_totale_kwh')).toBe(true);
    expect(changes.some((c) => c.reason === 'suspect_max_equals_souscrite_re_read_required')).toBe(
      true
    );
  });

  it('fixes OCR thousands digit on montant net (2769 → 3769) and mois year from échéance', () => {
    const { facture, changes } = correctFactureMtExtraction({
      type_facture: 'MT',
      puissance_souscrite_kva: '120',
      puissance_maximale_appelee_kva: '77',
      consommation_totale_kwh: '8796',
      prix_energie: '0.291',
      montant_energie: '2559.636',
      prime_puissance: '600',
      cos_phi: '0.99',
      coefficient_k: '0.045',
      bonification_cos_phi: '115.184',
      tranche_tarifaire: 'Uniforme',
      montant_net_a_payer: '2769.382',
      mois_facturation: '08/2023',
      date_limite_paiement: '08/08/2025',
    });

    expect(Number(facture.montant_net_a_payer)).toBeCloseTo(3769.382, 2);
    expect(facture.mois_facturation).toBe('08/2025');
    expect(changes.some((c) => c.reason === 'ocr_thousands_digit_2_vs_3')).toBe(true);
    expect(changes.some((c) => c.reason === 'year_aligned_to_date_limite_paiement')).toBe(true);
  });

  it('fixes prime_puissance when OCR confuses 225 with 600 (souscrite × 5)', () => {
    const { facture, changes } = correctFactureMtExtraction({
      type_facture: 'MT',
      puissance_souscrite_kva: '120',
      puissance_maximale_appelee_kva: '77',
      consommation_totale_kwh: '8796',
      prix_energie: '0.291',
      montant_energie: '2559.636',
      prime_puissance: '225',
      cos_phi: '0.99',
      coefficient_k: '0.045',
      bonification_cos_phi: '0.225',
      tranche_tarifaire: 'Uniforme',
      montant_net_a_payer: '3769.382',
    });

    expect(facture.prime_puissance).toBe('600');
    expect(Number(facture.bonification_cos_phi)).toBeCloseTo(115.184, 2);
    expect(changes.some((c) => c.reason === 'recomputed_from_souscrite_x_taux')).toBe(true);
  });

  it('attaches extraction_quality with corrected and suspect fields', () => {
    const response = enrichStegExtractionWithCalculations({
      facture_extraite: {
        type_facture: 'MT',
        mois_facturation: '08/2023',
        puissance_souscrite_kva: '120',
        puissance_maximale_appelee_kva: '120',
        consommation_totale_kwh: '8796',
        prix_energie: '0.291',
        montant_energie: '2559.636',
        prime_puissance: '225',
        cos_phi: '0.91',
        coefficient_k: '0.045',
        bonification_cos_phi: '0.225',
        tranche_tarifaire: 'Uniforme',
        montant_net_a_payer: '3769.382',
        date_limite_paiement: '08/08/2025',
      },
      affichage_client: {
        cos_phi: { valeur: '0.91', explication: 'test' },
        prime_puissance: { valeur: '225', explication: 'test' },
        mois_facturation: { valeur: '08/2023', explication: 'test' },
      },
    });

    expect(response.extraction_quality).toBeDefined();
    expect(response.extraction_quality!.corrections_count).toBeGreaterThan(0);
    expect(
      response.extraction_quality!.fields.some(
        (f) => f.field === 'puissance_maximale_appelee_kva' && f.status === 'suspect'
      )
    ).toBe(true);
    expect(response.extraction_quality!.overall === 'medium' || response.extraction_quality!.overall === 'low').toBe(
      true
    );
  });

  it('enriches MT response with corrected fields for analyse cards', () => {
    const response = enrichStegExtractionWithCalculations({
      facture_extraite: {
        type_facture: 'MT',
        mois_facturation: '09/2023',
        puissance_souscrite_kva: '120',
        puissance_maximale_appelee_kva: '120',
        consommation_totale_kwh: '255936',
        prix_energie: '0.291',
        montant_energie: '2559.636',
        prime_puissance: '600',
        cos_phi: '0.91',
        coefficient_k: '0.045',
        bonification_cos_phi: '3355.964',
        tranche_tarifaire: 'Uniforme',
        montant_net_a_payer: '75176.98',
      },
      affichage_client: {
        cos_phi: { valeur: '0.91', explication: 'test' },
        consommation_totale_kwh: { valeur: '255936', explication: 'test' },
        bonification_cos_phi: { valeur: '3355.964', explication: 'test' },
        montant_net_a_payer: { valeur: '75176.98', explication: 'test' },
      },
    });

    const facture = response.facture_extraite as {
      cos_phi?: string;
      consommation_totale_kwh?: string;
      bonification_cos_phi?: string;
      montant_net_a_payer?: string;
    };
    expect(facture.cos_phi).toBe('0.99');
    expect(facture.consommation_totale_kwh).toBe('8796');
    expect(Number(facture.bonification_cos_phi)).toBeCloseTo(115.184, 2);
    expect(facture.montant_net_a_payer).toBe('-');

    const cards = response.analyse_mt?.recommandations ?? [];
    const powerCard = cards.find(
      (c) =>
        c.categorie === 'P0'
        || c.categorie === 'P3'
        || c.categorie === 'P_VERIFY'
    );
    expect(powerCard?.categorie).toBe('P_VERIFY');
    const cosCard = cards.find((c) => c.categorie === 'C1');
    expect(cosCard).toBeDefined();
  });
});

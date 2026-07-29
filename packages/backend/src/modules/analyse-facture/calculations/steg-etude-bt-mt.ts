/**
 * STEG BT→MT 25-year study (§8) — NPV, IRR, payback. Deterministic, no LLM.
 */

import { tauxRedevancePuissance, type TrancheTarifaire } from './steg-mt-analysis';

const PALIERS_MT_KVA = [100, 160, 250, 400, 630, 1000, 1250, 1600, 2000, 2500, 3200] as const;

const PRIX_UNITAIRE_MT_PAR_PALIER: Record<number, number> = {
  100: 850,
  160: 700,
  250: 600,
  400: 500,
  630: 420,
  1000: 350,
  1250: 330,
  1600: 320,
  2000: 310,
  2500: 340,
  3200: 380,
};

const PU_ELEC_BT = 0.391;
const PU_ELEC_MT = 0.291;
const OPEX_TAUX_ANNUEL = 0.02;
const INFLATION_TARIFAIRE = 0.07;
const INFLATION_OPEX = 0.03;
const TAUX_ACTUALISATION = 0.08;
const DUREE_ANS = 25;

export interface FactureBtPourEtude {
  puissance_souscrite_kva: number;
  periode_facturation: number;
  consommation_totale_kwh: number;
  redevances_fixes: number;
  tranche_tarifaire_mt_proposee?: TrancheTarifaire;
}

export interface CashflowAnnee {
  annee: number;
  eco_brute: number;
  opex: number;
  gain_net: number;
  gain_actualise: number;
  cumul_simple: number;
  cumul_actualise: number;
}

export interface EtudeBtMtComputed {
  consommation_annuelle_kwh: number;
  puissance_mt_theorique: number;
  puissance_mt_recommandee_kva: number;
  prix_unitaire_mt: number;
  capex_dt: number;
  opex_annuel_dt: number;
  prime_puissance_mensuelle: number;
  prime_puissance_annuelle: number;
  facture_annuelle_bt_dt: number;
  facture_annuelle_mt_dt: number;
  economie_annuelle_dt: number;
  payback_simple_ans: number | null;
  payback_actualise_ans: number | null;
  van_dt: number;
  tri_pct: number | null;
  roi_pct: number;
  cashflows_25_ans: CashflowAnnee[];
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function puissanceMtRecommandee(puissanceMtTheorique: number): number {
  const palier = PALIERS_MT_KVA.find((value) => value > puissanceMtTheorique);
  if (palier === undefined) {
    throw new Error(
      `puissance_mt_theorique (${puissanceMtTheorique} kVA) dépasse le plus grand palier disponible`
    );
  }
  return palier;
}

export function prixUnitaireMt(palierKva: number): number {
  const prix = PRIX_UNITAIRE_MT_PAR_PALIER[palierKva];
  if (prix === undefined) {
    throw new Error(`Palier MT inconnu: ${palierKva} kVA`);
  }
  return prix;
}

function computeIrr(capexDt: number, gainNetBruts: number[]): number | null {
  const netPresentValue = (rate: number): number => {
    let total = -capexDt;
    for (let index = 0; index < gainNetBruts.length; index += 1) {
      total += gainNetBruts[index] / Math.pow(1 + rate, index + 1);
    }
    return total;
  };

  const derivative = (rate: number): number => {
    let total = 0;
    for (let index = 0; index < gainNetBruts.length; index += 1) {
      const year = index + 1;
      total += (-year * gainNetBruts[index]) / Math.pow(1 + rate, year + 1);
    }
    return total;
  };

  let rate = 0.1;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const value = netPresentValue(rate);
    const slope = derivative(rate);
    if (Math.abs(slope) < 1e-12) {
      break;
    }
    const next = rate - value / slope;
    if (Math.abs(next - rate) < 1e-9) {
      return next;
    }
    rate = next;
  }

  let low = -0.99;
  let high = 10;
  const valueLow = netPresentValue(low);
  const valueHigh = netPresentValue(high);
  if (Math.sign(valueLow) === Math.sign(valueHigh)) {
    return null;
  }
  for (let iteration = 0; iteration < 200; iteration += 1) {
    const mid = (low + high) / 2;
    const valueMid = netPresentValue(mid);
    if (Math.abs(valueMid) < 1e-6) {
      return mid;
    }
    if (Math.sign(valueMid) === Math.sign(valueLow)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function computePaybackAns(capexDt: number, flows: number[]): number | null {
  let cumul = 0;
  let cumulPrev = 0;
  for (let index = 0; index < flows.length; index += 1) {
    cumulPrev = cumul;
    cumul += flows[index];
    if (cumul >= capexDt) {
      const anneeIndex = index + 1;
      const flowCetteAnnee = flows[index];
      if (flowCetteAnnee === 0) {
        return anneeIndex;
      }
      return anneeIndex - 1 + (capexDt - cumulPrev) / flowCetteAnnee;
    }
  }
  return null;
}

export function computeEtudeBtMt(facture: FactureBtPourEtude): {
  etude: EtudeBtMtComputed | null;
  economieAnnuelleDt: number;
} {
  const {
    puissance_souscrite_kva,
    periode_facturation: periodMonths,
    consommation_totale_kwh,
    redevances_fixes,
  } = facture;
  const tranche = facture.tranche_tarifaire_mt_proposee ?? 'Uniforme';
  const taux_redevance_puissance_kva = tauxRedevancePuissance(tranche);

  const consommation_annuelle_kwh =
    periodMonths === 1
      ? consommation_totale_kwh * 12
      : (consommation_totale_kwh / periodMonths) * 12;
  const montant_abonnement_mensuel =
    periodMonths === 1 ? redevances_fixes : redevances_fixes / periodMonths;
  const puissance_mt_theorique = puissance_souscrite_kva * 1.7;
  const puissance_mt_recommandee_kva = puissanceMtRecommandee(puissance_mt_theorique);
  const prix_unitaire_mt = prixUnitaireMt(puissance_mt_recommandee_kva);

  const capex_dt = puissance_mt_recommandee_kva * prix_unitaire_mt;
  const opex_annuel_dt = capex_dt * OPEX_TAUX_ANNUEL;
  const prime_puissance_mensuelle = puissance_mt_recommandee_kva * taux_redevance_puissance_kva;
  const prime_puissance_annuelle = prime_puissance_mensuelle * 12;

  const facture_annuelle_bt_dt =
    consommation_annuelle_kwh * PU_ELEC_BT + montant_abonnement_mensuel * 12;
  const facture_annuelle_mt_dt = consommation_annuelle_kwh * PU_ELEC_MT + prime_puissance_annuelle;
  const economie_annuelle_dt = facture_annuelle_bt_dt - facture_annuelle_mt_dt;

  if (economie_annuelle_dt <= 0) {
    return { etude: null, economieAnnuelleDt: round3(economie_annuelle_dt) };
  }

  const cashflows: CashflowAnnee[] = [];
  let cumulSimple = 0;
  let cumulActualise = 0;
  const gainNetBruts: number[] = [];

  for (let year = 1; year <= DUREE_ANS; year += 1) {
    const eco_brute = economie_annuelle_dt * Math.pow(1 + INFLATION_TARIFAIRE, year - 1);
    const opex = opex_annuel_dt * Math.pow(1 + INFLATION_OPEX, year - 1);
    const gain_net = eco_brute - opex;
    const gain_actualise = gain_net / Math.pow(1 + TAUX_ACTUALISATION, year);

    cumulSimple += gain_net;
    cumulActualise += gain_actualise;
    gainNetBruts.push(gain_net);

    cashflows.push({
      annee: year,
      eco_brute: round3(eco_brute),
      opex: round3(opex),
      gain_net: round3(gain_net),
      gain_actualise: round3(gain_actualise),
      cumul_simple: round3(cumulSimple),
      cumul_actualise: round3(cumulActualise),
    });
  }

  const van_dt = -capex_dt + cumulActualise;
  // Prompt §8.5: roi_pct is the raw ratio, NOT ×100 (e.g. 13.07 not 1307).
  const roi_pct = (cumulSimple - capex_dt) / capex_dt;
  const triRate = computeIrr(capex_dt, gainNetBruts);
  const payback_simple_ans = computePaybackAns(capex_dt, gainNetBruts);
  const payback_actualise_ans = computePaybackAns(
    capex_dt,
    gainNetBruts.map((gain, index) => gain / Math.pow(1 + TAUX_ACTUALISATION, index + 1))
  );

  return {
    etude: {
      consommation_annuelle_kwh: round3(consommation_annuelle_kwh),
      puissance_mt_theorique: round3(puissance_mt_theorique),
      puissance_mt_recommandee_kva,
      prix_unitaire_mt,
      capex_dt: round3(capex_dt),
      opex_annuel_dt: round3(opex_annuel_dt),
      prime_puissance_mensuelle: round3(prime_puissance_mensuelle),
      prime_puissance_annuelle: round3(prime_puissance_annuelle),
      facture_annuelle_bt_dt: round3(facture_annuelle_bt_dt),
      facture_annuelle_mt_dt: round3(facture_annuelle_mt_dt),
      economie_annuelle_dt: round3(economie_annuelle_dt),
      payback_simple_ans: payback_simple_ans === null ? null : round2(payback_simple_ans),
      payback_actualise_ans:
        payback_actualise_ans === null ? null : round2(payback_actualise_ans),
      van_dt: round2(van_dt),
      tri_pct: triRate === null ? null : round2(triRate * 100),
      roi_pct: round2(roi_pct),
      cashflows_25_ans: cashflows,
    },
    economieAnnuelleDt: round3(economie_annuelle_dt),
  };
}

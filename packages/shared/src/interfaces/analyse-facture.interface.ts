/**
 * STEG bill analysis — AI agent response (BT & MT).
 * Matches the JSON output format from the analyse-facture Vision prompt.
 */

export interface AffichageClientField {
  valeur: string;
  explication: string;
}

export type AffichageClientMap = Record<string, AffichageClientField | string>;

export interface GazFactureExtraite {
  presence_gaz: string;
  consommation_gaz_m3?: string;
  ancien_index_gaz?: string;
  nouvel_index_gaz?: string;
  prix_unitaire_gaz?: string;
  redevances_fixes_gaz?: string;
  montant_energie_gaz?: string;
}

export interface FactureExtraiteBtRaw {
  type_facture?: string;
  numero_facture?: string;
  'N°Dépannage'?: string;
  reference_client?: string;
  client?: string;
  adresse_site?: string;
  district_steg?: string;
  date_debut_periode?: string;
  date_fin_periode?: string;
  periode_facturation?: string;
  puissance_souscrite_kva?: string;
  consommation_totale_kwh?: string;
  ancien_index?: string;
  nouvel_index?: string;
  prix_unitaire?: string;
  redevances_fixes?: string;
  montant_energie?: string;
  montant_total?: string;
  montant_a_payer?: string;
  date_limite_paiement?: string;
  date_prochaine_releve?: string;
  gaz?: GazFactureExtraite;
  [key: string]: unknown;
}

export interface FactureExtraiteMtRaw {
  type_facture?: string;
  numero_facture?: string;
  mois_facturation?: string;
  reference_client?: string;
  code_payeur?: string;
  ur?: string;
  client?: string;
  adresse_site?: string;
  district_steg?: string;
  telephone?: string;
  fax?: string;
  rib_rip?: string;
  puissance_souscrite_kva?: string;
  puissance_installee_kva?: string;
  puissance_maximale_appelee_kw?: string;
  depassement_puissance_kw?: string;
  energie_reactive_kvarh?: string;
  cos_phi?: string;
  coefficient_k?: string;
  consommation_totale_kwh?: string;
  consommation_jour_kwh?: string;
  consommation_pointe_kwh?: string;
  consommation_soir_kwh?: string;
  consommation_nuit_kwh?: string;
  ancien_index_actif?: string;
  nouvel_index_actif?: string;
  ancien_index_reactif?: string;
  nouvel_index_reactif?: string;
  tranche_tarifaire?: string;
  prix_energie?: string;
  montant_energie?: string;
  prime_puissance?: string;
  bonification_cos_phi?: string;
  penalite_cos_phi?: string;
  montant_net_a_payer?: string;
  date_limite_paiement?: string;
  [key: string]: unknown;
}

export interface MtRecommandationRaw {
  categorie?: string;
  gain_mensuel_estime_dt?: string;
  gain_annuel_estime_dt?: string;
  titre?: string;
  description?: string;
  conclusion?: string;
}

export interface MtIndicateursRaw {
  ratio_puissance_pct?: string | number;
  puissance_cible_kva?: string | number;
  economie_mensuelle_dt?: string | number;
  economie_annuelle_dt?: string | number;
  marge_kva?: string | number;
  depassement_kva?: string | number;
  K_bonification?: string | number;
  [key: string]: unknown;
}

export interface CashflowYearRaw {
  annee?: number;
  eco_brute?: string | number;
  opex?: string | number;
  gain_net?: string | number;
  gain_actualise?: string | number;
  cumul_simple?: string | number;
  cumul_actualise?: string | number;
}

export interface EtudeBtMtRaw {
  consommation_annuelle_kwh?: string;
  puissance_mt_theorique?: string;
  puissance_mt_recommandee_kva?: string;
  prix_unitaire_mt?: string;
  capex_dt?: string;
  opex_annuel_dt?: string;
  prime_puissance_mensuelle?: string;
  prime_puissance_annuelle?: string;
  facture_annuelle_bt_dt?: string;
  facture_annuelle_mt_dt?: string;
  economie_annuelle_dt?: string;
  payback_simple_ans?: string;
  payback_actualise_ans?: string;
  van_dt?: string;
  tri_pct?: string;
  roi_pct?: string;
  cashflows_25_ans?: CashflowYearRaw[];
  erreur_calcul_financier?: string;
  [key: string]: unknown;
}

export interface StegAnalyseResponse {
  facture_extraite: FactureExtraiteBtRaw | FactureExtraiteMtRaw;
  affichage_client: AffichageClientMap;
  analyse_mt?: {
    indicateurs?: MtIndicateursRaw;
    recommandations?: MtRecommandationRaw[];
  };
  etude_bt_mt?: EtudeBtMtRaw | Record<string, never>;
}

export interface AnalyseFactureApiResponse {
  success: boolean;
  data: StegAnalyseResponse;
}

export type TariffType = 'BT' | 'MT';

export interface AffichageField {
  valeur: string;
  explication: string;
}

export interface GazFacture {
  presence_gaz: string;
  consommation_gaz_m3?: string;
  ancien_index_gaz?: string;
  nouvel_index_gaz?: string;
  prix_unitaire_gaz?: string;
  redevances_fixes_gaz?: string;
  montant_energie_gaz?: string;
}

export interface FactureExtraiteBt {
  type_facture: 'BT';
  numero_facture: string;
  reference_client: string;
  client: string;
  adresse_site: string;
  district_steg: string;
  date_debut_periode: string;
  date_fin_periode: string;
  periode_facturation: string;
  puissance_souscrite_kva: string;
  consommation_totale_kwh: string;
  ancien_index?: string;
  nouvel_index?: string;
  prix_unitaire: string;
  redevances_fixes: string;
  montant_energie: string;
  montant_total: string;
  montant_a_payer: string;
  date_limite_paiement?: string;
  date_prochaine_releve?: string;
  gaz?: GazFacture;
}

export interface EtudeBtMt {
  consommation_annuelle_kwh: string;
  prix_unitaire_kwh: string;
  puissance_souscrite_kva: string;
  prime_puissance_mensuelle: string;
  prime_puissance_annuelle: string;
  facture_annuelle_bt_dt: string;
  facture_annuelle_mt_dt: string;
  capex_dt: string;
  opex_annuel_dt: string;
  economie_annuelle_dt: string;
  payback_simple_ans: string;
  payback_actualise_ans: string;
  tri_pct: string;
  roi_pct: string;
  van_dt: string;
  /** Champs optionnels — calcul interne, non affichés */
  puissance_mt_theorique?: string;
  puissance_mt_recommandee_kva?: string;
  prix_unitaire_transformateur_mt?: string;
  hypotheses?: string;
  conclusion?: {
    titre: string;
    texte: string;
    note_contact: string;
  };
  demarche_revision?: {
    contexte?: string;
    intro: string;
    etapes: { titre: string; description: string }[];
  };
  piste_solaire?: {
    badge?: string;
    titre: string;
    description: string;
    piste: string;
  };
}

export interface BtAnalyseResult {
  facture_extraite: FactureExtraiteBt;
  affichage_client: Record<string, AffichageField | string>;
  etude_bt_mt?: EtudeBtMt;
}

export interface MtFactureExtraite {
  client: string;
  site: string;
  reference_facture: string;
  periode: string;
  district: string;
  puissance_souscrite_kva: number;
  puissance_max_kw: number;
  consommation_kwh: number;
  cos_phi: number;
  coefficient_k: number;
  prime_puissance_dt: number;
  montant_net_dt: number;
  energie_consommee_kwh: number;
  date_limite_paiement: string;
  consommation_annuelle_kwh?: number;
}

export interface MtPuissanceRevision {
  puissance_cible_kva: number;
  prime_actuelle_dt: number;
  prime_apres_revision_dt: number;
  economie_annuelle_dt: number;
  economie_mensuelle_dt: number;
}

export interface MtInsightCard {
  severity: 'critical' | 'positive';
  title: string;
  description: string;
  annualSavingLabel?: string;
  footerNote?: string;
}

export interface MtPisteSolaire {
  badge: string;
  titre: string;
  description: string;
  piste: string;
}

export type MtRatioProfile = 'P1' | 'P2' | 'P3' | 'P4' | 'P0';

export interface MtSituationView {
  profile: MtRatioProfile;
  badge: string;
  badgeTone: 'gold' | 'outline' | 'warning' | 'danger';
  titre: string;
  metricLabel: string;
  metricValue: string;
  metricDanger: boolean;
  optimizationNote?: string;
  monthlyGain?: string;
  annualGain?: string;
  donutDanger: boolean;
}

export interface MtAnalyseResult {
  facture: MtFactureExtraite;
  affichage_client?: Record<string, AffichageField | string>;
  situation_titre: string;
  situation_texte: string;
  revelle_intro: string;
  revelle_sous_titre: string;
  insights: MtInsightCard[];
  revision: MtPuissanceRevision;
  piste_solaire: MtPisteSolaire;
}

/** @deprecated Legacy shape — kept for gradual migration */
export interface MtVariable {
  label: string;
  value: string;
}

export interface MtBreakdownRow {
  poste: string;
  formule: string;
  montantDt: string;
  highlight?: boolean;
}

export type AnomalySeverity = 'critical' | 'positive';

export interface MtAnomaly {
  severity: AnomalySeverity;
  title: string;
  description: string;
}

export type RecommendationCategory = 'puissance' | 'cos-phi';

export interface MtRecommendation {
  category: RecommendationCategory;
  categoryLabel: string;
  monthlySavingDt: string;
  title: string;
  description: string;
  annualSavingDt: string;
}

export interface MtRecommendation {
  category: RecommendationCategory;
  categoryLabel: string;
  monthlySavingDt: string;
  title: string;
  description: string;
  annualSavingDt: string;
}

/** @deprecated Legacy MT result */
export interface MtAnalyseResultLegacy {
  client: string;
  reference: string;
  periode: string;
  district: string;
  variables: MtVariable[];
  breakdown: MtBreakdownRow[];
  totalTtcDt: string;
  anomalies: MtAnomaly[];
  recommendations: MtRecommendation[];
}

export interface DetailFactureRow {
  label: string;
  value: string;
  highlight?: boolean;
  explication?: string;
}

export interface VanChartData {
  points: { year: number; value: number }[];
  capex: number;
  minY: number;
  maxY: number;
}

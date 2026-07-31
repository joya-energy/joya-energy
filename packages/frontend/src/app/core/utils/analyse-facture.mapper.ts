import type {
  EtudeBtMtRaw,
  ExtractionQualityRaw,
  FactureExtraiteBtRaw,
  FactureExtraiteMtRaw,
  MtRecommandationRaw,
  StegAnalyseResponse,
} from '@shared/interfaces/analyse-facture.interface';
import { formatMtDtAmount, parseStegNumber } from '@shared/functions/steg-numbers';
import type {
  AffichageField,
  BtAnalyseResult,
  EtudeBtMt,
  ExtractionQualityView,
  FactureExtraiteBt,
  GazFacture,
  MtAnalyseResult,
  MtFactureExtraite,
  MtInsightCard,
  MtPuissanceRevision,
} from '../../pages/analyse-facture-resultats/analyse-facture-resultats.types';

export interface MappedAnalyseFactureResult {
  tariffType: 'BT' | 'MT';
  btResult: BtAnalyseResult | null;
  mtResult: MtAnalyseResult | null;
  raw: StegAnalyseResponse;
}

function str(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  const text = String(value).trim();
  return text === '' ? fallback : text;
}

function num(value: unknown): number {
  return parseStegNumber(value);
}

function isMtBill(raw: FactureExtraiteBtRaw | FactureExtraiteMtRaw): boolean {
  const type = str(raw.type_facture, '').toUpperCase();
  if (type === 'MT' || type.includes('MOYENNE')) {
    return true;
  }
  if (type === 'BT' || type.includes('BASSE')) {
    return false;
  }
  return 'mois_facturation' in raw && str(raw.mois_facturation, '') !== '-';
}

function hasEtudeBtMt(etude: EtudeBtMtRaw | Record<string, never> | undefined): etude is EtudeBtMtRaw {
  if (!etude || typeof etude !== 'object') {
    return false;
  }
  if ('erreur_calcul_financier' in etude && Object.keys(etude).length <= 2) {
    return false;
  }
  return Object.keys(etude).length > 0;
}

function mapGaz(gaz: FactureExtraiteBtRaw['gaz']): GazFacture | undefined {
  if (!gaz) {
    return undefined;
  }

  return {
    presence_gaz: str(gaz.presence_gaz, 'Non'),
    consommation_gaz_m3: str(gaz.consommation_gaz_m3),
    ancien_index_gaz: str(gaz.ancien_index_gaz),
    nouvel_index_gaz: str(gaz.nouvel_index_gaz),
    prix_unitaire_gaz: str(gaz.prix_unitaire_gaz),
    redevances_fixes_gaz: str(gaz.redevances_fixes_gaz),
    montant_energie_gaz: str(gaz.montant_energie_gaz),
  };
}

function mapEtudeBtMt(
  etude: EtudeBtMtRaw,
  puissanceBtKva: number
): EtudeBtMt | undefined {
  const economie = num(etude.economie_annuelle_dt);
  if (puissanceBtKva <= 100 || economie <= 0) {
    return undefined;
  }

  return {
    consommation_annuelle_kwh: str(etude.consommation_annuelle_kwh),
    prix_unitaire_kwh: '0.291',
    puissance_souscrite_kva: str(etude.puissance_mt_recommandee_kva),
    prime_puissance_mensuelle: str(etude.prime_puissance_mensuelle),
    prime_puissance_annuelle: str(etude.prime_puissance_annuelle),
    facture_annuelle_bt_dt: str(etude.facture_annuelle_bt_dt),
    facture_annuelle_mt_dt: str(etude.facture_annuelle_mt_dt),
    capex_dt: str(etude.capex_dt),
    opex_annuel_dt: str(etude.opex_annuel_dt),
    economie_annuelle_dt: str(etude.economie_annuelle_dt),
    payback_simple_ans: str(etude.payback_simple_ans),
    payback_actualise_ans: str(etude.payback_actualise_ans),
    tri_pct: str(etude.tri_pct),
    roi_pct: str(etude.roi_pct),
    van_dt: str(etude.van_dt),
    puissance_mt_theorique: str(etude.puissance_mt_theorique),
    puissance_mt_recommandee_kva: str(etude.puissance_mt_recommandee_kva),
    prix_unitaire_transformateur_mt: str(etude.prix_unitaire_mt),
  };
}

function mapExtractionQuality(
  quality: ExtractionQualityRaw | undefined
): ExtractionQualityView | undefined {
  if (!quality) {
    return undefined;
  }
  const summaryFr =
    quality.overall === 'high'
      ? 'Lecture fiable — contrôles STEG OK.'
      : quality.overall === 'medium'
        ? 'Lecture partiellement corrigée par les règles STEG.'
        : 'Certains champs restent à vérifier sur la facture.';

  return {
    overall: quality.overall,
    score: quality.score,
    correctionsCount: quality.corrections_count,
    suspectsCount: quality.suspects_count,
    summaryFr,
    fields: quality.fields.map((field) => ({
      field: field.field,
      status: field.status,
      message_fr: field.message_fr,
    })),
  };
}

export function fieldConfidenceFromView(
  quality: ExtractionQualityView | undefined,
  fieldKeys: string[]
): {
  confidence?: 'ok' | 'corrected' | 'suspect' | 'unverified';
  confidenceMessage?: string;
} {
  if (!quality) {
    return {};
  }
  const match = quality.fields.find((field) => fieldKeys.includes(field.field));
  if (!match) {
    return { confidence: 'ok' };
  }
  return {
    confidence: match.status,
    confidenceMessage: match.message_fr,
  };
}

export function fieldConfidenceFromQuality(
  quality: ExtractionQualityRaw | undefined,
  fieldKeys: string[]
): {
  confidence?: 'ok' | 'corrected' | 'suspect' | 'unverified';
  confidenceMessage?: string;
} {
  return fieldConfidenceFromView(mapExtractionQuality(quality), fieldKeys);
}

function mapBtResult(response: StegAnalyseResponse): BtAnalyseResult {
  const raw = response.facture_extraite as FactureExtraiteBtRaw;
  const numeroFacture =
    str(raw.numero_facture) !== '-' ? str(raw.numero_facture) : str(raw['N°Dépannage']);

  const puissanceKva = num(raw.puissance_souscrite_kva);
  const etude = hasEtudeBtMt(response.etude_bt_mt)
    ? mapEtudeBtMt(response.etude_bt_mt, puissanceKva)
    : undefined;

  const affichage = { ...response.affichage_client };
  if (!etude && affichage['message_passage_mt']) {
    delete affichage['message_passage_mt'];
  }

  return {
    facture_extraite: {
      type_facture: 'BT',
      numero_facture: numeroFacture,
      reference_client: str(raw.reference_client),
      client: str(raw.client),
      adresse_site: str(raw.adresse_site),
      district_steg: str(raw.district_steg),
      date_debut_periode: str(raw.date_debut_periode),
      date_fin_periode: str(raw.date_fin_periode),
      periode_facturation: str(raw.periode_facturation),
      puissance_souscrite_kva: str(raw.puissance_souscrite_kva),
      consommation_totale_kwh: str(raw.consommation_totale_kwh),
      ancien_index: str(raw.ancien_index),
      nouvel_index: str(raw.nouvel_index),
      prix_unitaire: str(raw.prix_unitaire),
      redevances_fixes: str(raw.redevances_fixes),
      montant_energie: str(raw.montant_energie),
      montant_total: str(raw.montant_total),
      montant_a_payer: str(raw.montant_a_payer),
      date_limite_paiement: str(raw.date_limite_paiement),
      date_prochaine_releve: str(raw.date_prochaine_releve),
      gaz: mapGaz(raw.gaz),
    },
    affichage_client: affichage as Record<string, AffichageField | string>,
    etude_bt_mt: etude,
    extraction_quality: mapExtractionQuality(response.extraction_quality),
  };
}

function mapRecommendation(rec: MtRecommandationRaw): MtInsightCard {
  const titre = str(rec.titre);
  const conclusion = str(rec.conclusion, '');
  const categorie = str(rec.categorie).toUpperCase();
  const isPositive =
    titre.includes('✅') ||
    categorie.startsWith('C1') ||
    categorie === 'P0';
  const isVerify = categorie === 'P_VERIFY';

  let description = str(rec.description, '');
  const gainRaw = str(rec.gain_annuel_estime_dt, '');
  const gainAnnuel = gainRaw && gainRaw !== '-' ? num(gainRaw) : 0;

  if (conclusion && conclusion !== '-' && description.includes(conclusion)) {
    description = description.replace(conclusion, '').trim();
  }

  return {
    categorie: categorie || undefined,
    severity: isPositive ? 'positive' : 'critical',
    title: titre,
    description,
    annualSavingLabel:
      !isVerify && gainAnnuel > 0 ? `+${formatMtDtAmount(gainAnnuel)} DT/an` : undefined,
    footerNote: conclusion !== '-' ? conclusion : undefined,
  };
}

function mapMtResult(response: StegAnalyseResponse): MtAnalyseResult {
  const raw = response.facture_extraite as FactureExtraiteMtRaw;
  const indicateurs = response.analyse_mt?.indicateurs ?? {};
  const kva = num(raw.puissance_souscrite_kva);
  const maxAppeleeKva = num(raw.puissance_maximale_appelee_kva ?? raw.puissance_maximale_appelee_kw);
  const consommation = num(raw.consommation_totale_kwh);
  const primePuissance = num(raw.prime_puissance);
  const montantNet = num(raw.montant_net_a_payer);
  const puissanceCible = num(indicateurs['puissance_cible_kva']);
  const economieMensuelle = num(indicateurs['economie_mensuelle_dt']);
  const economieAnnuelle = num(indicateurs['economie_annuelle_dt']);
  const tauxRedevance = num(indicateurs['taux_redevance_puissance_kva']);

  const referenceClient = str(raw.reference_client, '');
  const facture: MtFactureExtraite = {
    client: str(raw.client),
    site: str(raw.adresse_site),
    numero_facture: str(raw.numero_facture),
    reference_client:
      referenceClient !== '' && referenceClient !== '-' ? referenceClient : undefined,
    periode: str(raw.mois_facturation),
    district: str(raw.district_steg),
    puissance_souscrite_kva: kva,
    puissance_max_kva: maxAppeleeKva,
    consommation_kwh: consommation,
    cos_phi: num(raw.cos_phi),
    coefficient_k: num(raw.coefficient_k),
    prime_puissance_dt: primePuissance,
    montant_net_dt: montantNet,
    energie_consommee_kwh: consommation,
    date_limite_paiement: str(raw.date_limite_paiement),
    consommation_annuelle_kwh: consommation * 12,
  };

  const revision: MtPuissanceRevision = {
    puissance_cible_kva: puissanceCible,
    prime_actuelle_dt: primePuissance,
    prime_apres_revision_dt: puissanceCible > 0 && tauxRedevance > 0 ? puissanceCible * tauxRedevance : 0,
    economie_annuelle_dt: economieAnnuelle,
    economie_mensuelle_dt: economieMensuelle,
  };

  const ratioPct = kva > 0 ? Math.round((maxAppeleeKva / kva) * 100) : 0;

  return {
    facture,
    affichage_client: response.affichage_client as Record<string, AffichageField | string>,
    situation_titre:
      ratioPct < 45
        ? 'Vous payez chaque mois pour une puissance que vous n\'utilisez pas.'
        : 'Votre facture reflète votre contrat de puissance STEG.',
    situation_texte: `Votre contrat STEG vous réserve <strong>${kva} kVA</strong> de puissance. Ce mois, votre installation a appelé <strong>${maxAppeleeKva} kVA</strong> au maximum.`,
    revelle_intro:
      'Pas de jargon, pas d\'estimation au doigt mouillé : chaque chiffre ci-dessous sort directement de votre facture STEG. À vous de décider si ça vaut le coup d\'agir.',
    revelle_sous_titre: 'Votre facture cache de l\'argent. On vous montre où.',
    insights: (response.analyse_mt?.recommandations ?? []).map((rec) => mapRecommendation(rec)),
    revision,
    piste_solaire: {
      badge: 'UNE AUTRE PISTE D\'ÉCONOMIE',
      titre: 'Installer du solaire sur votre site.',
      description: `Avec ${consommation * 12} kWh consommés par an, le site présente un profil compatible avec une installation solaire.`,
      piste:
        'une étude de faisabilité solaire permettrait de chiffrer le productible, l\'investissement et le temps de retour propres à ce site.',
    },
    extraction_quality: mapExtractionQuality(response.extraction_quality),
  };
}

export function mapStegAnalyseResponse(response: StegAnalyseResponse): MappedAnalyseFactureResult {
  if (isMtBill(response.facture_extraite)) {
    return {
      tariffType: 'MT',
      btResult: null,
      mtResult: mapMtResult(response),
      raw: response,
    };
  }

  return {
    tariffType: 'BT',
    btResult: mapBtResult(response),
    mtResult: null,
    raw: response,
  };
}

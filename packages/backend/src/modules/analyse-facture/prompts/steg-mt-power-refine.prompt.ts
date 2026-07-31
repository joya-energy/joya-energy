/**
 * Focused second-pass vision prompt when MT fields look OCR-confused.
 */
export const STEG_MT_POWER_REFINE_PROMPT = `Tu relis UNE facture STEG Moyenne Tension (MT).

Champs souvent confondus par OCR — lis UNIQUEMENT ce qui est visible (jamais inventer) :

1. puissance_souscrite_kva — ligne « Puissance souscrite »
2. puissance_maximale_appelee_kva — ligne « Maximum appelée » / « Puissance maximale appelée »
   (DISTINCTE de la souscrite ; ex. typique 77 vs 120 — ne jamais recopier la souscrite)
3. prime_puissance — montant « Prime de puissance » en DT
   (pour Uniforme ≈ puissance_souscrite × 5 ; ex. 120 kVA → 600 DT — ne pas confondre avec 225 / 0.225)
4. montant_net_a_payer — montant net / à payer (attention OCR 2↔3 : 3769 vs 2769)
5. mois_facturation — mois de la facture au format MM/AAAA (année de la période facturée, souvent proche de l'échéance)
6. date_limite_paiement — échéance / date limite de paiement (JJ/MM/AAAA)

Règles :
- Illisible → "-"
- Ne jamais fusionner souscrite et max appelée
- Réponds UNIQUEMENT JSON compact, sans Markdown :
{"puissance_souscrite_kva":"...","puissance_maximale_appelee_kva":"...","prime_puissance":"...","montant_net_a_payer":"...","mois_facturation":"...","date_limite_paiement":"..."}
`;

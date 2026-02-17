import OpenAI from 'openai';
import { Logger } from '@backend/middlewares';
import { HTTP400Error } from '@backend/errors';
import { ServerConfig } from '@backend/configs/server.config';
import { pdfToPng } from 'pdf-to-png-converter';
import type { ExtractedBillData } from '@shared/interfaces/bill-extraction.interface';

export class BillExtractionService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: ServerConfig.config.openaiApiKey,
    });
  }

  /**
   * Extract data from a bill image using OpenAI Vision
   * @param imageBuffer Buffer of the image
   * @param mimeType Mime type of the image
   */
  public async extractDataFromImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ExtractedBillData> {
    try {
      Logger.info('Starting bill extraction...');
      const { buffer: preparedBuffer, mimeType: preparedMimeType } =
        await this.prepareInputBuffer(imageBuffer, mimeType);
      const base64Image = preparedBuffer.toString('base64');
      const dataUrl = `data:${preparedMimeType};base64,${base64Image}`;
      Logger.info(
        `Image prepared (size: ${imageBuffer.length} bytes), sending to OpenAI...`
      );

      const prompt = `
        Analyze this electricity bill (STEG Tunisia). The bill can be either:
        - BT (Basse Tension) layout with the "CONSOMMATION & SERVICES" table (Electricité / Gaz / Taxes)
        - MT (Moyenne Tension) layout "FACTURE MOYENNE TENSION"

        Extract the following information and return it in JSON format.
        For each field, also provide a brief "explanation" (in French) of what this value represents on the bill, suitable for a user tooltip.

        IMPORTANT EXTRACTION RULES:
        - monthlyBillAmount: 
            value:
              Return an object with ONLY: { "total": number } (DO NOT return "items" at all).
              BT: In the TOP table titled "CONSOMMATION & SERVICES", locate the main electricity row (Libellés contains "Electricité" and usually "ECLAIRAGE"). Extract the number under the column "Montant HT" (or "Montant Hors taxes") from that same row. DO NOT use "Total Electricité", "Total Consommation & Services", "Montant Total", "Montant à payer", "NET A PAYER", or any value inside the "Taxes" box.
              MT (STRICT / NO GUESSING): Extract the electricity consumption amount from the MAIN calculation block where energy is billed. Look for the line that contains the consumption billing and has a column/label "Montant" (or Arabic equivalent "المبلغ"). Select the "Montant" that corresponds to the billed energy consumption (often aligned with "Consommation à facturer kWh" or with time-slot billing lines). 
                - Exclude amounts that are clearly taxes/TVA/timbre/penalties/arrears/previous balance.
                - Exclude "NET A PAYER / Net à payer" (this is a final payable amount and is NOT monthlyBillAmount).
                - If multiple "Montant" exist for time-slots, sum ONLY the energy Montant lines; otherwise return the single energy Montant.
            explanation: "Le montant total de l'électricité consommée hors taxes (HT)."
        
        - recentBillConsumption: 
            value:
              Return an object with ONLY: { "total": number } (DO NOT return "items" at all).
              BT: In the "CONSOMMATION & SERVICES" table, locate the row whose "Libellés" contains "Electricité" (often with "ECLAIRAGE"). Extract the value in the column "Quantité" (or "Qté") from that same row. Ignore any quantity shown in the "Taxes" section.
              MT (STRICT): Extract the number next to the explicit label "Consommation à facturer kWh" (or OCR variants like "Consommation a facturer kWh"). This value is the total kWh. Do NOT use any power values (kVA) from the "Puissance" box.
            explanation: "Votre consommation d'électricité mesurée en kilowattheures (kWh) pour la période facturée."
        
        
        - contractedPower: 
            value:
              BT (ROW ∩ COLUMN LOCK / UNBREAKABLE):
                Goal: return ONLY the number located at the INTERSECTION of:
                  (A) the "Electricité" main consumption row
                  (B) the column "Puissance / Débit"
                
                Step-by-step (must follow exactly):
                1) Find the table titled "CONSOMMATION & SERVICES" (top table).
                2) In its header, find the exact column header text "Puissance / Débit" (or OCR variants like "Puissance / Debit", "Puissance", "Débit").
                   IMPORTANT: this column is immediately to the LEFT of the "Libellés" column and immediately to the RIGHT of "Nbre de Mois".
                3) Find the MAIN electricity consumption line (not the fixed fees line):
                   - It's the first line under the "Electricité" label / icon.
                   - Its "Libellés" cell contains "ECLAIRAGE" (or similar) and is on the SAME row as "Quantité" and "Montant HT".
                   - DO NOT use the line "Redevances Fixes" (fixed fees) even if it also shows numbers.
                4) Extract ONLY the numeric value located in the "Puissance / Débit" column on that SAME main electricity row.
                
                Hard exclusions (BT):
                - Never return values from "Nbre de Mois" (e.g., 1, 2, 001).
                - Never return "Quantité" (kWh) (e.g., 2574, 9964).
                - Never return any value from the "Taxes" box (especially the repeated "5").
                - Never return any "P.U" value (unit price).
                - Never return anything from the "Redevances Fixes" line.

                Sanity selection (BT):
                - Puissance/Débit is a small integer (often between 10 and 100).
                - If you extracted a value > 200, it is almost certainly wrong → return null.
              MT (ROW-LOCKED / ULTRA-STRICT): In the RIGHT-SIDE box titled "Puissance" / "القدرة", extract ONLY the value that is on the SAME ROW as the label "Maximale appelée" (accept OCR variants like "Maximale appelee", "Maximale appel", "Maximale", "appelée", "appelee").
                - The correct number is the one immediately to the RIGHT of the label "Maximale appelée" on the same horizontal line (do not take numbers above/below).
                - Do NOT use any value from the rows "Souscrite" or "Installée" even if they are clearer.
                - Sanity check: "Maximale appelée" is typically smaller than "Souscrite/Installée". If the extracted value equals the "Souscrite" or "Installée" value, it is wrong → return null instead.
                - If you cannot confidently match the row, return null (do NOT guess).
              Return ONLY the number.
            explanation: "La puissance souscrite dans votre contrat en kVA, déterminant votre capacité maximale instantanée."

        - periodStart: 
            value:
              BT: Extract the start date of the billing period from the header area where the period is written as "Du YYYY-MM-DD" (French) or "من YYYY-MM-DD" (Arabic). Return the date in format YYYY-MM-DD.
              MT: Extract "Mois" (MM/YYYY) from the header (e.g., "Mois 07/2024"). Return YYYY-MM-01. If an explicit "Du/من" date exists, use it.
            explanation: "La date de début de la période de consommation facturée."
        
        - periodEnd: 
            value:
              BT: Extract the end date of the billing period from the header area where the period is written as "Au YYYY-MM-DD" (French) or "إلى YYYY-MM-DD" (Arabic). Return the date in format YYYY-MM-DD.
              MT: If the bill shows only "Mois MM/YYYY" and no explicit end date, return null.
            explanation: "La date de fin de la période de consommation facturée."
        
        - period:
            value:
              BT: In the TOP "CONSOMMATION & SERVICES" table, locate the column "Nbre de Mois" and extract the value from the same row as "Electricité". Convert values like "001" into the integer 1.
              MT: Always return 1.
            explanation: "La période de facturation en nombre de mois."
        
        - tariffType: 
            value: Determine tariff category from the bill header. If you see "BT" or "Basse Tension" return exactly "Basse Tension". If you see "MT" or "Moyenne Tension" or "FACTURE MOYENNE TENSION" return exactly "Moyenne Tension". If "HT" return exactly "Haute Tension".
            explanation: "La catégorie de tarification appliquée par la STEG."
        
        - address: 
            value:
              BT: Extract the full address block printed under the client name near the top-left section of the bill (below "Référence").
              MT: Extract the address from the header lines explicitly labeled "Adresse" / "العنوان". If there are two addresses (Payeur vs Consommateur), return the "Consommateur" address if available; otherwise return the Payeur address.
            explanation: "L'adresse du point de consommation telle qu'indiquée sur la facture."
        
        - clientName: 
            value:
              BT: Extract the contract holder name printed near the top-left section above the address.
              MT: Extract the "Consommateur" name / "المستهلك". If not present, extract the "Payeur" name.
            explanation: "Le nom du titulaire du contrat (entreprise ou particulier)."
        
        - governorate: 
            value: Infer from the address or district field. Return EXACTLY one of these: 'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Bizerte', 'Béja', 'Jendouba', 'Kairouan', 'Kasserine', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sousse', 'Tataouine', 'Tozeur', 'Zaghouan', 'Siliana', 'Le Kef', 'Mahdia', 'Sidi Bouzid', 'Gabès', 'Gafsa'.
            explanation: "Le gouvernorat de localisation, déduit de l'adresse ou du district."
        
        - meterNumber:
            value:
              BT: Extract the identifier labeled "N° Dépannage" (or Arabic equivalent).
              MT: Extract the value labeled "Compteur" / "N° compteur" (French) or "العداد" (Arabic). If multiple identifiers exist, pick the one explicitly tied to "Compteur/العداد" (not "N° Facture" and not "Référence").
            explanation: "Le numéro d'identification unique de votre compteur électrique."
        
        - reference:
            value:
              BT: Extract the value next to "Référence".
              MT: Extract the value explicitly labeled "Référence" (NOT "N° Facture"). If a "Référence" field is not present, return null rather than guessing.
            explanation: "La référence unique de cette facture pour le suivi administratif."
        
        - district:
            value: Extract the value next to "District" in the header (e.g., "GAFSA", "MOKNINE").
            explanation: "Le nom du district de la STEG dont vous dépendez."
        
        - BillAmountDividedByPeriod:    
            value:
              Divide monthlyBillAmount.value.total by period.value. If any required value is null, return null.
            explanation: "Le montant total de l'électricité consommée hors taxes (HT) divisé par le nombre de mois."
          
        - MonthOfReferance:
            value: Extract the month from the periodStart date. return the month as a number between 1 and 12.
            explanation: "Le mois de référence de la facture. retourne le mois en tant que nombre entre 1 et 12."

        Structure the response like this:
        {
          "monthlyBillAmount": { "value": { "total": 123.45 }, "explanation": "..." },
          "recentBillConsumption": { "value": { "total": 450 }, "explanation": "..." },
          ...
        }
        
        If a value is not found, use null for value but still provide the explanation.
        
        Return ONLY raw JSON, no markdown or code blocks.
      `;

      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Switch to mini to save costs/quota
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in data extraction from documents. You output only valid JSON.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });
      Logger.info(`OpenAI response received in ${Date.now() - startTime}ms`);

      const content = response.choices[0]?.message?.content;

      if (content === null || content === undefined || content === '') {
        throw new Error('No content returned from OpenAI');
      }

      Logger.info('OpenAI content received, parsing JSON...');

      // Clean up code blocks if present
      const jsonString = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(jsonString);
    } catch (error: unknown) {
      Logger.error(`OpenAI extraction error: ${String(error)}`);

      // FALLBACK MOCK DATA FOR QUOTA LIMITS OR ERRORS - COMMENTED OUT
      // Service should either work properly or fail, not return mock data
      // if (error.message?.includes('429') || error.status === 429) {
      //   Logger.warn(
      //     'OpenAI quota exceeded. Returning MOCK data based on real STEG bill.'
      //   );
      //   return {
      //     monthlyBillAmount: {
      //       value: 4153.096,
      //       explanation:
      //         "Le montant total de l'électricité consommée avant les taxes et redevances de service.",
      //     },
      //     recentBillConsumption: {
      //       value: 9964,
      //       explanation:
      //         "Votre consommation d'électricité mesurée en kilowattheures (kWh) pour la période facturée.",
      //     },
      //     periodStart: {
      //       value: '2025-05-22',
      //       explanation:
      //         'La date de début de la période de consommation facturée.',
      //     },
      //     periodEnd: {
      //       value: '2025-07-23',
      //       explanation:
      //         'La date de fin de la période de consommation facturée.',
      //     },
      //     tariffType: {
      //       value: 'Basse Tension',
      //       explanation: 'La catégorie de tarification appliquée par la STEG.',
      //     },
      //     contractedPower: {
      //       value: 250,
      //       explanation:
      //         'La puissance souscrite dans votre contrat en kVA, déterminant votre capacité maximale instantanée.',
      //     },
      //     address: {
      //       value: 'STE IMMOBILIERE ORACLE, 18BIS RUE ALI ATARI, MENZAH 9A',
      //       explanation:
      //         "L'adresse du point de consommation telle qu'indiquée sur la facture.",
      //     },
      //     clientName: {
      //       value: 'STE IMMOBILIERE ORACLE',
      //       explanation:
      //         'Le nom du titulaire du contrat (entreprise ou particulier).',
      //     },
      //     governorate: {
      //       value: 'Tunis',
      //       explanation:
      //         "Le gouvernorat de localisation, déduit de l'adresse ou du district.",
      //     },
      //     meterNumber: {
      //       value: '71710711',
      //       explanation:
      //         "Le numéro d'identification unique de votre compteur électrique.",
      //     },
      //     reference: {
      //       value: '18087 630 1',
      //       explanation:
      //         'La référence unique de cette facture pour le suivi administratif.',
      //     },
      //     district: {
      //       value: 'EL MENZAH',
      //       explanation: 'Le nom du district de la STEG dont vous dépendez.',
      //     },
      //   };
      // }

      throw new HTTP400Error('Failed to extract data from bill', error);
    }
  }

  private async prepareInputBuffer(
    buffer: Buffer,
    mimeType: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    if (mimeType === 'application/pdf') {
      Logger.info(
        'PDF detected. Converting first page to ultra high-resolution PNG for OpenAI vision processing...'
      );
      try {
        const pngPages = await pdfToPng(buffer, {
          pagesToProcess: [1],
          viewportScale: 5.5,
          disableFontFace: false,
          useSystemFonts: true,
          outputType: 'png',
          responseType: 'buffer',
          useWorker: false,
          enableXfa: true,
        });

        if (pngPages.length === 0) {
          throw new HTTP400Error(
            'Unable to convert PDF to image. Please provide a clear document.'
          );
        }

        const firstPage = pngPages[0];
        if (firstPage === null || firstPage === undefined) {
          throw new HTTP400Error(
            'Unable to convert PDF to image. Please provide a clear document.'
          );
        }
        if (firstPage.content === null || firstPage.content === undefined) {
          throw new HTTP400Error(
            'Unable to convert PDF to image. Please provide a clear document.'
          );
        }

        const firstPageBuffer = firstPage.content as Buffer;
        return { buffer: firstPageBuffer, mimeType: 'image/png' };
      } catch (error) {
        Logger.error(`PDF to PNG conversion failed: ${String(error)}`);
        if (error instanceof HTTP400Error) throw error;
        throw new HTTP400Error(
          'PDF conversion failed. Please upload a JPG/PNG image instead.',
          error
        );
      }
    }

    return { buffer, mimeType };
  }
}

export const billExtractionService = new BillExtractionService();

import OpenAI from 'openai';
import { Logger } from '@backend/middlewares';
import { HTTP400Error } from '@backend/errors';
import { ServerConfig } from '@backend/configs/server.config';
import { pdfToPng } from 'pdf-to-png-converter';

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
  ): Promise<any> {
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
      Analyze this electricity bill (STEG Tunisia). Extract the following information and return it in JSON format.
      For each field, also provide a brief "explanation" (in French) of what this value represents on the bill, suitable for a user tooltip.

      IMPORTANT EXTRACTION RULES:
      - monthlyBillAmount: 
          value: In the TOP table titled "CONSOMMATION & SERVICES", locate the main electricity consumption row (the row whose "Libellés" contains "Electricité" and usually "ECLAIRAGE"). Extract the number under the column "Montant HT" (or "Montant Hors taxes") from that same row. DO NOT use "Total Electricité", "Total Consommation & Services", "Montant Total", "Montant à payer", or any value inside the "Taxes" box.
          explanation: "Le montant total de l'électricité consommée hors taxes (HT)."
      
      - recentBillConsumption: 
          value: In the "CONSOMMATION & SERVICES" table, locate the row whose "Libellés" contains "Electricité" (often with "ECLAIRAGE"). Extract the value in the column "Quantité" (or "Qté") from that same row. Ignore any quantity shown in the "Taxes" section.
          explanation: "Votre consommation d'électricité mesurée en kilowattheures (kWh) pour la période facturée."
      
      
      - contractedPower: 
          value: In the TOP "CONSOMMATION & SERVICES" table, locate the row whose "Libellés" contains "Electricité" (often "ECLAIRAGE"). Identify the column header "Puissance / Débit" in the same table header row (it is usually positioned between "Nbre de Mois" and "Libellés"). Extract ONLY the number at the intersection of that row and that column. HARD EXCLUSIONS: ignore the "Taxes" box entirely, ignore any "P.U" values, and ignore the value under "Nbre de Mois". The contracted power is typically a small integer (e.g. between 2 and 60).
          explanation: "La puissance souscrite dans votre contrat en kVA, déterminant votre capacité maximale instantanée."
      
      - periodStart: 
          value: Extract the start date of the billing period from the header area where the period is written as "Du YYYY-MM-DD" (French) or "من YYYY-MM-DD" (Arabic). Return the date in format YYYY-MM-DD.
          explanation: "La date de début de la période de consommation facturée."
      
      - periodEnd: 
          value: Extract the end date of the billing period from the header area where the period is written as "Au YYYY-MM-DD" (French) or "إلى YYYY-MM-DD" (Arabic). Return the date in format YYYY-MM-DD.
          explanation: "La date de fin de la période de consommation facturée."
      
      - period:
          value: In the TOP "CONSOMMATION & SERVICES" table, locate the column "Nbre de Mois" and extract the value from the same row as "Electricité". Convert values like "001" into the integer 1.
          explanation: "La période de facturation en nombre de mois."
      
      - tariffType: 
          value: Read the tariff indicator printed near the top of the bill (often near "FACTURE" or under the logo). If you see "BT" return exactly "Basse Tension". If "MT" return exactly "Moyenne Tension". If "HT" return exactly "Haute Tension".
          explanation: "La catégorie de tarification appliquée par la STEG."
      
      - address: 
          value: Extract the full address block printed under the client name near the top-left section of the bill (below "Référence").
          explanation: "L'adresse du point de consommation telle qu'indiquée sur la facture."
      
      - clientName: 
          value: Extract the contract holder name printed near the top-left section above the address (company or individual name).
          explanation: "Le nom du titulaire du contrat (entreprise ou particulier)."
      
      - governorate: 
          value: Infer from the address or district field. Return EXACTLY one of these: 'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Bizerte', 'Béja', 'Jendouba', 'Kairouan', 'Kasserine', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sousse', 'Tataouine', 'Tozeur', 'Zaghouan', 'Siliana', 'Le Kef', 'Mahdia', 'Sidi Bouzid', 'Gabès', 'Gafsa'.
          explanation: "Le gouvernorat de localisation, déduit de l'adresse ou du district."
      
      - meterNumber:
          value: Extract the identifier labeled "N° Dépannage" (or Arabic equivalent) from the top section of the bill. Do NOT confuse it with "Référence".
          explanation: "Le numéro d'identification unique de votre compteur électrique."
      
      - reference:
          value: Extract the value next to "Référence" in the top-left section of the bill.
          explanation: "La référence unique de cette facture pour le suivi administratif."
      
      - district:
          value: Extract the value next to "District" in the header box near the top of the bill.
          explanation: "Le nom du district de la STEG dont vous dépendez."
      
      - BillAmountDividedByPeriod:    
          value: Divide monthlyBillAmount.value by period.value. If one of them is null, return null.
          explanation: "Le montant total de l'électricité consommée hors taxes (HT) divisé par le nombre de mois."

      Structure the response like this:
      {
        "monthlyBillAmount": { "value": 123.45, "explanation": "..." },
        "recentBillConsumption": { "value": 450, "explanation": "..." },
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
        max_tokens: 1000,
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
        if (!firstPage) {
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

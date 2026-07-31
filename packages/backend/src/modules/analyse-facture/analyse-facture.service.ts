import type OpenAI from 'openai';
import { Logger } from '@backend/middlewares';
import { HTTP400Error } from '@backend/errors';
import { createOpenRouterClient, getLlmModel } from '@backend/common/llm';
import type { StegAnalyseResponse } from '@shared/interfaces/analyse-facture.interface';
import { billExtractionService } from '../bill-extraction/bill-extraction.service';
import { getStegExtractionFacturePrompt } from './analyse-facture.prompt';
import { isStegAnalyseResponseEmpty } from '@shared/functions/analyse-facture-validation';
import { enrichStegExtractionWithCalculations } from './calculations/enrich-steg-response';
import { isMtMaxAppeleeEqualSouscrite } from './calculations/steg-calculations';
import { shouldRefineMtExtraction } from './calculations/extraction-quality';
import { STEG_MT_POWER_REFINE_PROMPT } from './prompts/steg-mt-power-refine.prompt';

const MT_POWER_REFINE_MAX_TOKENS = 400;

interface MtPowerRefineFields {
  puissance_souscrite_kva?: string;
  puissance_maximale_appelee_kva?: string;
  prime_puissance?: string;
  montant_net_a_payer?: string;
  mois_facturation?: string;
  date_limite_paiement?: string;
}

function parseStegNumericField(value: string | undefined): number {
  if (value === undefined || value === '-' || value === '') {
    return Number.NaN;
  }
  return Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
}

function isUsableRefineValue(value: string | undefined): value is string {
  return value !== undefined && value !== '-' && value.trim() !== '';
}

/**
 * Full extraction JSON needs room; production/dev use up to 16384 on gpt-4o.
 * Override with OPENROUTER_MAX_TOKENS. Prefer openai/gpt-4o locally (same as prod) —
 * gpt-4.1 is priced higher so OpenRouter "can only afford N" drops sharply on the same balance.
 */
const ANALYSE_FACTURE_MAX_TOKENS_DEFAULT = 8192;
const ANALYSE_FACTURE_MIN_TOKENS = 800;
/** First-pass vision prep (sharper than legacy 1600/q85). */
const ANALYSE_VISION_PREP = { maxEdgePx: 2048, jpegQuality: 90 } as const;
/** Second-pass MT refine uses a larger edge when quality is weak. */
const ANALYSE_VISION_REFINE_PREP = { maxEdgePx: 2560, jpegQuality: 92 } as const;

function resolveMaxTokens(): number {
  const fromEnv = Number.parseInt(process.env.OPENROUTER_MAX_TOKENS ?? '', 10);
  if (Number.isFinite(fromEnv) && fromEnv >= ANALYSE_FACTURE_MIN_TOKENS) {
    return fromEnv;
  }
  return ANALYSE_FACTURE_MAX_TOKENS_DEFAULT;
}

/**
 * Analyse-facture defaults to high (digit OCR). Independent of OPENROUTER_VISION_DETAIL
 * so other cheaper flows can stay on low. Override with ANALYSE_FACTURE_VISION_DETAIL=low.
 */
function resolveVisionDetail(): 'low' | 'high' {
  const analyse = (process.env.ANALYSE_FACTURE_VISION_DETAIL ?? 'high').toLowerCase();
  return analyse === 'low' ? 'low' : 'high';
}

function parseAffordableMaxTokens(errorText: string): number | null {
  const match = errorText.match(/can only afford\s+(\d+)/i);
  if (match === null) {
    return null;
  }
  const affordable = Number.parseInt(match[1], 10);
  if (!Number.isFinite(affordable) || affordable < ANALYSE_FACTURE_MIN_TOKENS) {
    return null;
  }
  return Math.max(ANALYSE_FACTURE_MIN_TOKENS, affordable - 40);
}

export class AnalyseFactureService {
  private readonly llmClient: OpenAI;

  constructor() {
    this.llmClient = createOpenRouterClient();
  }

  public async analyzeBillFromImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<StegAnalyseResponse> {
    try {
      Logger.info('Starting STEG bill analysis (analyse-facture)...');
      Logger.info(`Input: size=${imageBuffer.length} bytes, mimeType=${mimeType}`);

      const { buffer: preparedBuffer, mimeType: preparedMimeType } =
        await billExtractionService.prepareBillImage(
          imageBuffer,
          mimeType,
          ANALYSE_VISION_PREP
        );

      if (preparedBuffer.length === 0) {
        throw new HTTP400Error('Image preparation failed. The prepared image buffer is empty.');
      }

      const base64Image = preparedBuffer.toString('base64');
      const dataUrl = `data:${preparedMimeType};base64,${base64Image}`;
      const prompt = getStegExtractionFacturePrompt();
      const model = getLlmModel();
      const maxTokens = resolveMaxTokens();
      const visionDetail = resolveVisionDetail();

      Logger.info(
        `Sending extraction to vision LLM via OpenRouter (model=${model}, prompt length=${prompt.length}, dataUrl length=${dataUrl.length}, max_tokens=${maxTokens}, vision_detail=${visionDetail})`
      );

      const startTime = Date.now();
      const content = await this.requestExtractionContent(
        model,
        prompt,
        dataUrl,
        maxTokens,
        visionDetail
      );
      Logger.info(`STEG extraction LLM response received in ${Date.now() - startTime}ms`);

      const jsonString = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let parsed: {
        facture_extraite?: StegAnalyseResponse['facture_extraite'];
        affichage_client?: StegAnalyseResponse['affichage_client'];
      };
      try {
        parsed = JSON.parse(jsonString) as {
          facture_extraite?: StegAnalyseResponse['facture_extraite'];
          affichage_client?: StegAnalyseResponse['affichage_client'];
        };
      } catch (parseError) {
        Logger.error('STEG extraction JSON parsing failed:', parseError);
        Logger.error('Raw content (first 1000 chars):', jsonString.substring(0, 1000));
        throw new HTTP400Error(
          'Failed to parse bill analysis response. The AI response was not valid JSON.',
          parseError
        );
      }

      if (!parsed.facture_extraite || !parsed.affichage_client) {
        throw new HTTP400Error(
          'Invalid bill analysis response: missing facture_extraite or affichage_client.'
        );
      }

      const enriched = enrichStegExtractionWithCalculations({
        facture_extraite: parsed.facture_extraite,
        affichage_client: parsed.affichage_client,
      });

      const refined = await this.refineMtFieldsIfNeeded(
        enriched,
        imageBuffer,
        mimeType,
        dataUrl,
        model
      );

      if (isStegAnalyseResponseEmpty(refined)) {
        Logger.error('STEG analysis returned no readable bill fields (all "-" or empty)');
        throw new HTTP400Error(
          'Impossible de lire cette facture. Le PDF a peut-être produit une image illisible. ' +
            'Essayez une photo JPG/PNG de la facture, ou un autre export PDF.'
        );
      }

      Logger.info('STEG analysis completed (LLM extraction + code calculations)');
      return refined;
    } catch (error: unknown) {
      Logger.error(`STEG bill analysis error: ${String(error)}`);
      if (error instanceof HTTP400Error) {
        throw error;
      }

      const errorText = String(error);
      if (errorText.includes('429') || errorText.toLowerCase().includes('quota')) {
        throw new HTTP400Error(
          'Quota LLM dépassé. Vérifiez la facturation de votre clé OpenRouter ou réessayez plus tard.'
        );
      }

      if (
        errorText.includes('402')
        || errorText.toLowerCase().includes('credits')
        || errorText.toLowerCase().includes('prompt tokens limit')
      ) {
        throw new HTTP400Error(
          'Crédits OpenRouter insuffisants pour cette image/prompt. Ajoutez des crédits, ou gardez OPENROUTER_VISION_DETAIL=low et OPENROUTER_MAX_TOKENS bas dans .env.'
        );
      }

      if (errorText.toLowerCase().includes('timeout') || errorText.includes('ETIMEDOUT')) {
        throw new HTTP400Error(
          "L'analyse a pris trop de temps. Réessayez avec une image plus légère ou plus tard."
        );
      }

      throw new HTTP400Error("Échec de l'analyse de la facture.", error);
    }
  }

  private async refineMtFieldsIfNeeded(
    response: StegAnalyseResponse,
    originalBuffer: Buffer,
    originalMimeType: string,
    fallbackDataUrl: string,
    model: string
  ): Promise<StegAnalyseResponse> {
    const raw = response.facture_extraite as {
      type_facture?: string;
      puissance_souscrite_kva?: string;
      puissance_maximale_appelee_kva?: string;
      puissance_maximale_appelee_kw?: string;
    };

    if (String(raw.type_facture ?? '').toUpperCase() !== 'MT') {
      return response;
    }

    const souscrite = parseStegNumericField(raw.puissance_souscrite_kva);
    const maxAppelee = parseStegNumericField(
      raw.puissance_maximale_appelee_kva ?? raw.puissance_maximale_appelee_kw
    );
    const needsRefine =
      isMtMaxAppeleeEqualSouscrite(souscrite, maxAppelee)
      || shouldRefineMtExtraction(response.extraction_quality);

    if (!needsRefine) {
      return response;
    }

    Logger.warn(
      'STEG MT: focused vision re-read (quality/suspects) for max appelée / prime / net / mois'
    );

    try {
      const refinedPrep = await billExtractionService.prepareBillImage(
        originalBuffer,
        originalMimeType,
        ANALYSE_VISION_REFINE_PREP
      );
      const refineDataUrl =
        refinedPrep.buffer.length > 0
          ? `data:${refinedPrep.mimeType};base64,${refinedPrep.buffer.toString('base64')}`
          : fallbackDataUrl;

      const content = await this.createExtractionCompletion(
        model,
        STEG_MT_POWER_REFINE_PROMPT,
        refineDataUrl,
        MT_POWER_REFINE_MAX_TOKENS,
        'high'
      );
      const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const refined = JSON.parse(jsonString) as MtPowerRefineFields;
      const patched = this.applyMtPowerRefine(response, refined);
      if (patched === null) {
        return response;
      }
      return enrichStegExtractionWithCalculations({
        facture_extraite: patched.facture_extraite,
        affichage_client: patched.affichage_client,
      });
    } catch (error: unknown) {
      Logger.warn(`STEG MT power refine skipped: ${String(error)}`);
      return response;
    }
  }

  private applyMtPowerRefine(
    response: StegAnalyseResponse,
    refined: MtPowerRefineFields
  ): StegAnalyseResponse | null {
    const raw = response.facture_extraite as Record<string, string | undefined>;
    const souscrite = parseStegNumericField(raw.puissance_souscrite_kva);
    const refinedMax = parseStegNumericField(refined.puissance_maximale_appelee_kva);
    let changed = false;

    if (
      isUsableRefineValue(refined.puissance_maximale_appelee_kva)
      && !Number.isNaN(refinedMax)
      && refinedMax > 0
      && !isMtMaxAppeleeEqualSouscrite(souscrite, refinedMax)
    ) {
      raw.puissance_maximale_appelee_kva = refined.puissance_maximale_appelee_kva.trim();
      this.patchAffichageField(
        response.affichage_client,
        'puissance_maximale_appelee_kva',
        raw.puissance_maximale_appelee_kva
      );
      changed = true;
      Logger.info(
        `STEG MT refine: puissance_maximale_appelee_kva → ${raw.puissance_maximale_appelee_kva}`
      );
    }

    if (isUsableRefineValue(refined.prime_puissance)) {
      const refinedPrime = parseStegNumericField(refined.prime_puissance);
      const expectedUniforme = !Number.isNaN(souscrite) ? souscrite * 5 : Number.NaN;
      const expectedHoraire = !Number.isNaN(souscrite) ? souscrite * 11 : Number.NaN;
      const looksPlausible =
        !Number.isNaN(refinedPrime)
        && refinedPrime > 0
        && (
          (!Number.isNaN(expectedUniforme)
            && Math.abs(refinedPrime - expectedUniforme) / expectedUniforme <= 0.05)
          || (!Number.isNaN(expectedHoraire)
            && Math.abs(refinedPrime - expectedHoraire) / expectedHoraire <= 0.05)
        );
      if (looksPlausible) {
        raw.prime_puissance = refined.prime_puissance.trim();
        this.patchAffichageField(
          response.affichage_client,
          'prime_puissance',
          raw.prime_puissance
        );
        changed = true;
      }
    }

    if (isUsableRefineValue(refined.montant_net_a_payer)) {
      raw.montant_net_a_payer = refined.montant_net_a_payer.trim();
      this.patchAffichageField(
        response.affichage_client,
        'montant_net_a_payer',
        raw.montant_net_a_payer
      );
      changed = true;
    }

    if (isUsableRefineValue(refined.mois_facturation)) {
      raw.mois_facturation = refined.mois_facturation.trim();
      this.patchAffichageField(
        response.affichage_client,
        'mois_facturation',
        raw.mois_facturation
      );
      changed = true;
    }

    if (isUsableRefineValue(refined.date_limite_paiement)) {
      raw.date_limite_paiement = refined.date_limite_paiement.trim();
      this.patchAffichageField(
        response.affichage_client,
        'date_limite_paiement',
        raw.date_limite_paiement
      );
      changed = true;
    }

    return changed ? response : null;
  }

  private patchAffichageField(
    affichage: StegAnalyseResponse['affichage_client'],
    field: string,
    value: string
  ): void {
    const current = affichage[field];
    if (current && typeof current === 'object' && 'valeur' in current) {
      affichage[field] = { ...current, valeur: value };
      return;
    }
    if (typeof current === 'string' || current === undefined) {
      affichage[field] = value;
    }
  }

  private async requestExtractionContent(
    model: string,
    prompt: string,
    dataUrl: string,
    maxTokens: number,
    visionDetail: 'low' | 'high'
  ): Promise<string> {
    try {
      return await this.createExtractionCompletion(
        model,
        prompt,
        dataUrl,
        maxTokens,
        visionDetail
      );
    } catch (error: unknown) {
      const errorText = String(error);
      const isCreditsError =
        errorText.includes('402')
        || errorText.toLowerCase().includes('credits')
        || errorText.toLowerCase().includes('prompt tokens limit');

      if (!isCreditsError) {
        throw error;
      }

      // Do not retry on 402 — each attempt burns remaining balance and makes the next run worse.
      const affordable = parseAffordableMaxTokens(errorText);
      const affordHint =
        affordable !== null
          ? ` Solde actuel ≈ ${affordable + 40} tokens reserve; il faut au moins ~${ANALYSE_FACTURE_MAX_TOKENS_DEFAULT}.`
          : '';
      throw new HTTP400Error(
        `Crédits OpenRouter insuffisants pour model=${model} / vision_detail=${visionDetail} / max_tokens=${maxTokens}.${affordHint} ` +
          'Vérifiez OPENROUTER_MODEL (prod/dev = openai/gpt-4o ; gpt-4.1 consomme le solde beaucoup plus vite) ' +
          'ou ajoutez des crédits sur openrouter.ai/settings/credits.'
      );
    }
  }

  private async createExtractionCompletion(
    model: string,
    prompt: string,
    dataUrl: string,
    maxTokens: number,
    visionDetail: 'low' | 'high'
  ): Promise<string> {
    const response = await this.llmClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert STEG Tunisia bill extraction agent. You output only valid JSON matching the requested schema. Never invent values. Never compute financial studies.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
                detail: visionDetail,
              },
            },
          ],
        },
      ],
      max_tokens: maxTokens,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (content === null || content === undefined || content === '') {
      Logger.error('LLM returned empty content for STEG extraction');
      throw new Error('No content returned from LLM');
    }
    return content;
  }
}

export const analyseFactureService = new AnalyseFactureService();

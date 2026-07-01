import OpenAI from 'openai';
import { Logger } from '@backend/middlewares';
import { HTTP400Error } from '@backend/errors';
import { ServerConfig } from '@backend/configs/server.config';
import type { StegAnalyseResponse } from '@shared/interfaces/analyse-facture.interface';
import { billExtractionService } from '../bill-extraction/bill-extraction.service';
import { getStegAnalyseFacturePrompt } from './analyse-facture.prompt';

export class AnalyseFactureService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: ServerConfig.config.openaiApiKey,
    });
  }

  public async analyzeBillFromImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<StegAnalyseResponse> {
    try {
      Logger.info('Starting STEG bill analysis (analyse-facture)...');
      Logger.info(`Input: size=${imageBuffer.length} bytes, mimeType=${mimeType}`);

      const { buffer: preparedBuffer, mimeType: preparedMimeType } =
        await billExtractionService.prepareBillImage(imageBuffer, mimeType);

      if (preparedBuffer.length === 0) {
        throw new HTTP400Error('Image preparation failed. The prepared image buffer is empty.');
      }

      const base64Image = preparedBuffer.toString('base64');
      const dataUrl = `data:${preparedMimeType};base64,${base64Image}`;
      const prompt = getStegAnalyseFacturePrompt();

      Logger.info(
        `Sending to OpenAI Vision for STEG analysis (prompt length=${prompt.length}, dataUrl length=${dataUrl.length})`
      );

      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert STEG Tunisia bill analysis agent. You output only valid JSON matching the requested schema.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 16384,
        temperature: 0.1,
      });

      Logger.info(`OpenAI STEG analysis response received in ${Date.now() - startTime}ms`);

      const content = response.choices[0]?.message?.content;
      if (content === null || content === undefined || content === '') {
        Logger.error('OpenAI returned empty content for STEG analysis');
        throw new Error('No content returned from OpenAI');
      }

      const jsonString = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let parsed: StegAnalyseResponse;
      try {
        parsed = JSON.parse(jsonString) as StegAnalyseResponse;
      } catch (parseError) {
        Logger.error('STEG analysis JSON parsing failed:', parseError);
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

      Logger.info('STEG bill analysis completed successfully');
      return parsed;
    } catch (error: unknown) {
      Logger.error(`STEG bill analysis error: ${String(error)}`);
      if (error instanceof HTTP400Error) {
        throw error;
      }

      const errorText = String(error);
      if (errorText.includes('429') || errorText.toLowerCase().includes('quota')) {
        throw new HTTP400Error(
          'Quota OpenAI dépassé. Vérifiez la facturation de votre clé API ou réessayez plus tard.'
        );
      }

      if (errorText.toLowerCase().includes('timeout') || errorText.includes('ETIMEDOUT')) {
        throw new HTTP400Error(
          'L\'analyse a pris trop de temps. Réessayez avec une image plus légère ou plus tard.'
        );
      }

      throw new HTTP400Error('Échec de l\'analyse de la facture.', error);
    }
  }
}

export const analyseFactureService = new AnalyseFactureService();

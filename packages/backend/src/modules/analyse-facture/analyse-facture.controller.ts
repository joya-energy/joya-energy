import { type Request, type Response } from 'express';
import { HttpStatusCode } from '@shared';
import { HTTP400Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { analyseFactureService } from './analyse-facture.service';

const ACCEPTED_MIME_PREFIXES = ['image/'];
const ACCEPTED_MIME_EXACT = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
]);

function isAcceptedMimeType(mimetype: string): boolean {
  if (ACCEPTED_MIME_EXACT.has(mimetype)) {
    return true;
  }
  return ACCEPTED_MIME_PREFIXES.some((prefix) => mimetype.startsWith(prefix));
}

export class AnalyseFactureController {
  public analyzeBill = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        throw new HTTP400Error('No file uploaded. Please provide a bill image or PDF.');
      }

      const { mimetype, buffer } = req.file;

      if (!isAcceptedMimeType(mimetype)) {
        throw new HTTP400Error(
          'Invalid file type. Supported formats: JPG, PNG, WEBP, TIFF, PDF.'
        );
      }

      const data = await analyseFactureService.analyzeBillFromImage(buffer, mimetype);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      Logger.error(`Analyse facture failed: ${String(error)}`);
      if (error instanceof HTTP400Error) {
        throw error;
      }
      throw new HTTP400Error('Failed to process bill analysis', error);
    }
  };
}

export const analyseFactureController = new AnalyseFactureController();

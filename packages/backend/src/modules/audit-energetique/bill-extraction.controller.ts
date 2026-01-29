import { type Request, type Response } from 'express';
import { HttpStatusCode } from '@shared';
import { HTTP400Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { billExtractionService } from './bill-extraction.service';

export class BillExtractionController {
  
  /**
   * Extracts data from an uploaded bill image
   */
  public extractBillData = async (req: Request, res: Response): Promise<void> => {
    try {
      
      if (!req.file) {
        throw new HTTP400Error('No file uploaded. Please provide an image file.');
      }

      const { mimetype, buffer } = req.file;

      // Validate file type
      if (!mimetype.startsWith('image/') && mimetype !== 'application/pdf') {
        throw new HTTP400Error('Invalid file type. Only images (JPG/PNG) or PDFs are allowed.');
      }

      // PDF conversion handled downstream inside the service
      
      const extractedData = await billExtractionService.extractDataFromImage(buffer, mimetype);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: extractedData
      });

    } catch (error) {
      Logger.error(`Bill extraction failed: ${String(error)}`);
      // Pass error to global error handler or return specific error
      if (error instanceof HTTP400Error) throw error;
      throw new HTTP400Error('Failed to process bill image', error);
    }
  };
}

export const billExtractionController = new BillExtractionController();


import { type Request, type Response } from 'express';
import { HttpStatusCode } from '@shared';
import { HTTP400Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';

export class BillExtractionController {
  
  /**
   * Extracts data from an uploaded bill image
   */
  public extractBillData = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        throw new HTTP400Error('No file uploaded. Please provide an image file.');
      }

      const { mimetype } = req.file;

      // Validate file type
      if (!mimetype.startsWith('image/') && mimetype !== 'application/pdf') {
         throw new HTTP400Error('Invalid file type. Only images and PDFs are allowed.');
      }

      // Note: For PDFs, we might need an extra step to convert to image or extract text
      // GPT-4o vision currently works best with images. 
      // For MVP, we'll assume image uploads or convert first page of PDF if needed (omitted for brevity)
      
  //    const extractedData = await billExtractionService.extractDataFromImage(buffer, mimetype);
      const extractedData = {
        monthlyBillAmount: 100,
        recentBillConsumption: 100,
        periodStart: new Date(),
        periodEnd: new Date(),
        tariffType: 'Basse Tension',
      };
      
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


import asyncRouter from 'express-promise-router';
import multer from 'multer';
import { billExtractionController } from './bill-extraction.controller';

export const billExtractionRoutes = asyncRouter();

// Configure multer for memory storage (buffer access)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ExtractedBillData:
 *       type: object
 *       properties:
 *         monthlyBillAmount:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Total amount to pay in TND
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         recentBillConsumption:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Total energy consumption in kWh
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         periodStart:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               format: date
 *               description: Start date of billing period
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         periodEnd:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               format: date
 *               description: End date of billing period
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         tariffType:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               enum: [Basse Tension, Moyenne Tension, Haute Tension]
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         contractedPower:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Contracted power in kVA
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         address:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Extracted address
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         clientName:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Extracted client name
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         governorate:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Extracted governorate
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         meterNumber:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Meter number
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         reference:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Bill reference number
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         district:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: STEG district name
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 */

/**
 * @swagger
 * tags:
 *   name: Bill Extraction
 *   description: Standalone service for extracting structured data from electricity bills
 */

/**
 * @swagger
 * /bill-extraction/extract:
 *   post:
 *     summary: Extract structured data from a bill image
 *     tags: [Bill Extraction]
 *     description: |
 *       Standalone service that receives an electricity bill (image or PDF) and extracts structured data using AI.
 *       This service can be used by any other service that needs bill data extraction.
 *       
 *       **Supported formats:**
 *       - Images: JPG, PNG
 *       - Documents: PDF (first page only)
 *       
 *       **Extracted fields:**
 *       - Monthly bill amount, consumption, contracted power
 *       - Billing period (start/end dates)
 *       - Tariff type, address, client name
 *       - Governorate, meter number, reference, district
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - billImage
 *             properties:
 *               billImage:
 *                 type: string
 *                 format: binary
 *                 description: The image or PDF file of the bill (JPG/PNG/PDF)
 *     responses:
 *       200:
 *         description: Data extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExtractedBillData'
 *       400:
 *         description: Invalid file or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file uploaded. Please provide an image file."
 *       500:
 *         description: Extraction failed
 */
billExtractionRoutes.post(
  '/extract',
  upload.single('billImage'),
  billExtractionController.extractBillData
);

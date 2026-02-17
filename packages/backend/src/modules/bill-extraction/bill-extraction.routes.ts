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
 *     AmountValue:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: The total amount value
 *     ExtractedField:
 *       type: object
 *       properties:
 *         value:
 *           oneOf:
 *             - type: object
 *             - type: string
 *             - type: number
 *             - type: "null"
 *           description: The extracted value, or null if not found
 *         explanation:
 *           type: string
 *           description: French explanation of what this value represents
 *     ExtractedBillData:
 *       type: object
 *       properties:
 *         monthlyBillAmount:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Monthly bill amount (HT) as an object with total property
 *         recentBillConsumption:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Recent bill consumption in kWh as an object with total property
 *         periodStart:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Billing period start date in YYYY-MM-DD format
 *         periodEnd:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Billing period end date in YYYY-MM-DD format (may be null for MT bills)
 *         period:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Number of months in the billing period
 *         tariffType:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Tariff type (Basse Tension, Moyenne Tension, or Haute Tension)
 *         contractedPower:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Contracted power in kVA
 *         address:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Full address of the consumption point
 *         clientName:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Client/company name (contract holder)
 *         governorate:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Governorate name (one of 24 Tunisian governorates)
 *         meterNumber:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Meter number identifier
 *         reference:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Bill reference number
 *         district:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: STEG district name
 *         BillAmountDividedByPeriod:
 *           $ref: '#/components/schemas/ExtractedField'
 *           description: Calculated field - monthlyBillAmount.value.total divided by period.value
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

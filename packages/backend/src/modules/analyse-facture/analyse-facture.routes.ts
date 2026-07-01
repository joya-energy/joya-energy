import asyncRouter from 'express-promise-router';
import multer from 'multer';
import { analyseFactureController } from './analyse-facture.controller';

export const analyseFactureRoutes = asyncRouter();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/**
 * @swagger
 * tags:
 *   name: Analyse Facture
 *   description: Full STEG bill analysis (BT/MT extraction, MT recommendations, BT→MT study)
 */

/**
 * @swagger
 * /analyse-facture/analyze:
 *   post:
 *     summary: Analyze a STEG electricity bill with the full agent prompt
 *     tags: [Analyse Facture]
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
 *     responses:
 *       200:
 *         description: Bill analyzed successfully
 */
analyseFactureRoutes.post(
  '/analyze',
  upload.single('billImage'),
  analyseFactureController.analyzeBill
);

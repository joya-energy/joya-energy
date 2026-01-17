import { Router } from 'express';
import { fileController } from './file.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: File unique identifier
 *         fileName:
 *           type: string
 *           description: Generated file name
 *         originalFileName:
 *           type: string
 *           description: Original file name
 *         filePath:
 *           type: string
 *           description: File path in storage
 *         publicUrl:
 *           type: string
 *           description: Public URL (gs:// format)
 *         fileType:
 *           type: string
 *           enum: [pdf-pv-report, pdf-audit-report, bill-attachment, other]
 *         mimeType:
 *           type: string
 *         size:
 *           type: number
 *         metadata:
 *           type: object
 *           properties:
 *             simulationId:
 *               type: string
 *             simulationType:
 *               type: string
 *               enum: [solaire, energetique]
 *             companyName:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         signedUrl:
 *           type: string
 *           description: Signed URL for accessing the file (expires after specified time)
 */

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File management endpoints
 */

export const fileRoutes = Router();

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get file by ID with signed URL
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: URL expiration time in seconds (default 1 hour)
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
fileRoutes.get('/:id', fileController.getFileById);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       204:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
fileRoutes.delete('/:id', fileController.deleteFile);


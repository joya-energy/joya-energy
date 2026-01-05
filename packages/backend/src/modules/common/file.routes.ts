import { Router } from 'express';
import { fileController } from './file.controller';

const router = Router();

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get file metadata by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File metadata
 */
router.get('/:id', fileController.getFile.bind(fileController));

/**
 * @swagger
 * /api/files/{id}/url:
 *   get:
 *     summary: Get direct download URL for file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *     responses:
 *       200:
 *         description: Direct download URL
 */
router.get('/:id/url', fileController.getFileUrl.bind(fileController));

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/:id', fileController.deleteFile.bind(fileController));

/**
 * @swagger
 * /api/files/audit/{auditId}:
 *   get:
 *     summary: Get all files for an audit
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files for the audit
 */
router.get('/audit/:auditId', fileController.getFilesByAudit.bind(fileController));

/**
 * @swagger
 * /api/files/simulation/{simulationId}:
 *   get:
 *     summary: Get all files for a solar simulation
 *     parameters:
 *       - in: path
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files for the simulation
 */
router.get('/simulation/:simulationId', fileController.getFilesBySimulation.bind(fileController));

export default router;

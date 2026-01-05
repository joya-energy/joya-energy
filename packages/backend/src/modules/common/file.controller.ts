import { Request, Response } from 'express';
import { FileService } from './file.service';
import { getFileModel } from './file.repository';
import { Logger } from '@backend/middlewares';
import { HTTP404Error } from '@backend/errors/http.error';

export class FileController {
  private fileService: FileService;

  constructor() {
    const fileModel = getFileModel();
    this.fileService = new FileService(fileModel);
  }

  /**
   * Get file by ID
   */
  async getFile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const file = await this.fileService.getFileById(id);
      if (!file) {
        throw new HTTP404Error('File not found');
      }

      res.json({
        success: true,
        data: {
          id: file.id,
          fileName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          url: file.storageUrl,
          createdAt: file.createdAt,
          folder: file.folder,
        },
      });
    } catch (error) {
      Logger.error('Error getting file', error);
      res.status(error instanceof HTTP404Error ? 404 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get files by audit ID
   */
  async getFilesByAudit(req: Request, res: Response) {
    try {
      const { auditId } = req.params;

      const files = await this.fileService.getFilesByAuditId(auditId);

      res.json({
        success: true,
        data: files.map(file => ({
          id: file.id,
          fileName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          url: file.storageUrl,
          createdAt: file.createdAt,
          folder: file.folder,
        })),
      });
    } catch (error) {
      Logger.error('Error getting files by audit', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get files by simulation ID
   */
  async getFilesBySimulation(req: Request, res: Response) {
    try {
      const { simulationId } = req.params;

      const files = await this.fileService.getFilesBySimulationId(simulationId);

      res.json({
        success: true,
        data: files.map(file => ({
          id: file.id,
          fileName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          url: file.storageUrl,
          createdAt: file.createdAt,
          folder: file.folder,
        })),
      });
    } catch (error) {
      Logger.error('Error getting files by simulation', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get direct download URL for file
   */
  async getFileUrl(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { expiresIn } = req.query;

      const url = await this.fileService.getFileUrl(id, expiresIn ? parseInt(expiresIn as string) : undefined);

      if (!url) {
        throw new HTTP404Error('File not found or URL generation failed');
      }

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      Logger.error('Error getting file URL', error);
      res.status(error instanceof HTTP404Error ? 404 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete file
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await this.fileService.deleteFile(id);
      if (!deleted) {
        throw new HTTP404Error('File not found');
      }

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      Logger.error('Error deleting file', error);
      res.status(error instanceof HTTP404Error ? 404 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const fileController = new FileController();

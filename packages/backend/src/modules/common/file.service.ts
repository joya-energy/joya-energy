import { Model } from 'mongoose';
import { IFile, FileSchema } from '@backend/modules/audit-solaire/entities/file.entity';
import { IFileStorageService, FileStorageResult } from './interfaces/storage.interface';
import { GoogleCloudStorageService } from '@backend/infrastructure/storage/google-cloud-storage.service';
import { OVHStorageService } from '@backend/infrastructure/storage/ovh-storage.service';
import { LocalStorageService } from '@backend/infrastructure/storage/local-storage.service';
import { Logger } from '@backend/middlewares';

export interface FileUploadResult {
  success: boolean;
  file?: IFile;
  error?: string;
}

export interface FileMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  folder?: string;
  auditId?: string;
  simulationId?: string;
  uploadedBy?: string;
}

export class FileService {
  private storageService: IFileStorageService;
  private fileModel: Model<IFile>;

  constructor(fileModel: Model<IFile>) {
    this.fileModel = fileModel;

    // Initialize storage service based on environment
    const storageType = process.env.STORAGE_TYPE || 'gcp';

    switch (storageType.toLowerCase()) {
      case 'gcp':
      case 'google':
      case 'google-cloud':
        try {
          this.storageService = new GoogleCloudStorageService();
        } catch (error) {
          Logger.warn('Google Cloud Storage failed to initialize, falling back to local storage', error);
          this.storageService = new LocalStorageService();
        }
        break;
      case 'ovh':
      case 'ovh-object-storage':
        try {
          this.storageService = new OVHStorageService();
        } catch (error) {
          Logger.warn('OVH Storage failed to initialize, falling back to local storage', error);
          this.storageService = new LocalStorageService();
        }
        break;
      case 'local':
      case 'filesystem':
        this.storageService = new LocalStorageService();
        break;
      default:
        Logger.warn(`Unknown STORAGE_TYPE: ${storageType}, falling back to local storage`);
        this.storageService = new LocalStorageService();
    }
  }

  async uploadFile(
    buffer: Buffer,
    metadata: FileMetadata
  ): Promise<FileUploadResult> {
    try {
      Logger.info(`Uploading file: ${metadata.fileName}, size: ${metadata.size} bytes`);

      // Upload to storage service
      const storageResult = await this.storageService.uploadFile(
        buffer,
        metadata.fileName,
        metadata.mimeType,
        metadata.folder
      );

      if (!storageResult.success || !storageResult.key || !storageResult.url) {
        return {
          success: false,
          error: storageResult.error || 'Storage upload failed',
        };
      }

      // Save metadata to database
      const fileDoc = new this.fileModel({
        fileName: metadata.fileName,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        size: metadata.size,
        storageKey: storageResult.key,
        storageUrl: storageResult.url,
        folder: metadata.folder || 'audit-reports',
        auditId: metadata.auditId,
        simulationId: metadata.simulationId,
        uploadedBy: metadata.uploadedBy,
      });

      const savedFile = await fileDoc.save();

      Logger.info(`File uploaded and saved: ${savedFile.id}`);

      return {
        success: true,
        file: savedFile,
      };
    } catch (error) {
      Logger.error('File upload failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  async getFileById(id: string): Promise<IFile | null> {
    try {
      return await this.fileModel.findById(id);
    } catch (error) {
      Logger.error(`Failed to get file by ID: ${id}`, error);
      return null;
    }
  }

  async getFilesByAuditId(auditId: string): Promise<IFile[]> {
    try {
      return await this.fileModel.find({ auditId }).sort({ createdAt: -1 });
    } catch (error) {
      Logger.error(`Failed to get files for audit: ${auditId}`, error);
      return [];
    }
  }

  async getFilesBySimulationId(simulationId: string): Promise<IFile[]> {
    try {
      return await this.fileModel.find({ simulationId }).sort({ createdAt: -1 });
    } catch (error) {
      Logger.error(`Failed to get files for simulation: ${simulationId}`, error);
      return [];
    }
  }

  async deleteFile(id: string): Promise<boolean> {
    try {
      const file = await this.fileModel.findById(id);
      if (!file) {
        return false;
      }

      // Delete from storage
      const storageDeleted = await this.storageService.deleteFile(file.storageKey);
      if (!storageDeleted) {
        Logger.warn(`Failed to delete file from storage: ${file.storageKey}`);
      }

      // Delete from database
      await this.fileModel.findByIdAndDelete(id);

      Logger.info(`File deleted: ${id}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete file: ${id}`, error);
      return false;
    }
  }

  async getFileUrl(id: string, expiresIn?: number): Promise<string | null> {
    try {
      const file = await this.fileModel.findById(id);
      if (!file) {
        return null;
      }

      // For OVH/direct access, return the stored URL
      if (file.storageUrl && file.storageUrl.startsWith('http')) {
        return file.storageUrl;
      }

      // For signed URLs (private files)
      return await this.storageService.getFileUrl(file.storageKey, expiresIn);
    } catch (error) {
      Logger.error(`Failed to get file URL: ${id}`, error);
      return null;
    }
  }

  // Cleanup expired files
  async cleanupExpiredFiles(): Promise<number> {
    try {
      const expiredFiles = await this.fileModel.find({
        expiresAt: { $lt: new Date() },
      });

      let deletedCount = 0;
      for (const file of expiredFiles) {
        const deleted = await this.deleteFile(file.id);
        if (deleted) deletedCount++;
      }

      Logger.info(`Cleaned up ${deletedCount} expired files`);
      return deletedCount;
    } catch (error) {
      Logger.error('Failed to cleanup expired files', error);
      return 0;
    }
  }
}

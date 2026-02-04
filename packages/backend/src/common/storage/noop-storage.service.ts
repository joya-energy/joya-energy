import { Logger } from '@backend/middlewares/logger.midddleware';
import { type IFileStorageService, type UploadFileResult } from './file-storage.interface';

/**
 * No-op storage service that implements IFileStorageService
 * but doesn't actually store files (no persistence).
 *
 * Used when storage isn't configured, or as a graceful fallback when the
 * primary provider fails.
 */
export class NoopStorageService implements IFileStorageService {
  async uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<UploadFileResult> {
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    Logger.warn(`⚠️ File storage not configured. File ${filePath} would have been uploaded (${buffer.length} bytes).`);
    
    // Return a placeholder URL for consistency with consumers.
    return {
      filePath,
      publicUrl: `local://${filePath}`,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    Logger.warn(`⚠️ File storage not configured. File ${filePath} would have been deleted.`);
  }

  async getSignedUrl(filePath: string, _expiresInSeconds?: number): Promise<string> {
    Logger.warn(`⚠️ File storage not configured. Signed URL requested for ${filePath}.`);
    return `local://${filePath}`;
  }

  async fileExists(_filePath: string): Promise<boolean> {
    return false;
  }
}

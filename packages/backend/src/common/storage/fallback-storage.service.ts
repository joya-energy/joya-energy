import { Logger } from '@backend/middlewares/logger.midddleware';
import { type IFileStorageService, type UploadFileResult } from './file-storage.interface';
import { GoogleCloudStorageService } from './google-cloud-storage.service';
import { NoopStorageService } from './noop-storage.service';

/**
 * Fallback storage service that wraps GCS with local fallback.
 * 
 * This service attempts to upload to Google Cloud Storage first.
 * If GCS fails (e.g., authentication errors), it automatically falls back
 * to local storage, ensuring the application continues to function.
 */
export class FallbackStorageService implements IFileStorageService {
  private readonly primaryStorage: GoogleCloudStorageService | null;
  private readonly fallbackStorage: NoopStorageService;

  constructor(
    bucketName?: string,
    keyFilename?: string,
    impersonateServiceAccount?: string
  ) {
    const trimmedBucketName = bucketName?.trim();

    this.primaryStorage = trimmedBucketName
      ? new GoogleCloudStorageService(trimmedBucketName, keyFilename, impersonateServiceAccount)
      : null;
    this.fallbackStorage = new NoopStorageService();
  }

  async uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<UploadFileResult> {
    if (!this.primaryStorage) {
      Logger.warn('⚠️ GCS_BUCKET_NAME not configured. Using no-op storage (files will not be persisted).');
      return await this.fallbackStorage.uploadFile(buffer, fileName, folder);
    }

    try {
      // Try primary storage (GCS) first
      const result = await this.primaryStorage.uploadFile(buffer, fileName, folder);
      Logger.info(`✅ File uploaded to GCS: ${folder ? `${folder}/` : ''}${fileName}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's an authentication/authorization error
      const isAuthError = this.isAuthenticationError(errorMessage);
      
      if (isAuthError) {
        Logger.warn(
          `⚠️ GCS authentication failed (${errorMessage}). Falling back to local storage. ` +
          `File will not be persisted. To fix: run 'gcloud auth application-default login --impersonate-service-account=SERVICE_ACCOUNT' ` +
          `or configure GCS_KEY_FILENAME in your .env file.`
        );
      } else {
        Logger.warn(
          `⚠️ GCS upload failed (${errorMessage}). Falling back to local storage. ` +
          `File will not be persisted.`
        );
      }

      // Fallback to local storage (no-op, but logs the attempt)
      return await this.fallbackStorage.uploadFile(buffer, fileName, folder);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.primaryStorage) {
      await this.fallbackStorage.deleteFile(filePath);
      return;
    }

    try {
      await this.primaryStorage.deleteFile(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.warn(`⚠️ GCS delete failed (${errorMessage}). Attempting local fallback.`);
      
      // Try fallback (no-op, but consistent behavior)
      await this.fallbackStorage.deleteFile(filePath);
    }
  }

  async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
    if (!this.primaryStorage) {
      return await this.fallbackStorage.getSignedUrl(filePath, expiresInSeconds);
    }

    try {
      return await this.primaryStorage.getSignedUrl(filePath, expiresInSeconds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.warn(`⚠️ GCS signed URL generation failed (${errorMessage}). Using local fallback.`);
      
      // Fallback to local storage signed URL (returns local:// URL)
      return await this.fallbackStorage.getSignedUrl(filePath, expiresInSeconds);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (!this.primaryStorage) {
      return await this.fallbackStorage.fileExists(filePath);
    }

    try {
      return await this.primaryStorage.fileExists(filePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.warn(`⚠️ GCS file existence check failed (${errorMessage}). Using local fallback.`);
      
      // Fallback returns false (file doesn't exist in local storage)
      return await this.fallbackStorage.fileExists(filePath);
    }
  }

  /**
   * Check if an error is related to authentication/authorization.
   * Common GCS auth errors include:
   * - invalid_grant / invalid_rapt (RAPT token issues)
   * - Permission denied
   * - Unable to impersonate
   * - Credential errors
   */
  private isAuthenticationError(errorMessage: string): boolean {
    const authErrorPatterns = [
      'invalid_grant',
      'invalid_rapt',
      'unable to impersonate',
      'permission denied',
      'authentication',
      'unauthorized',
      'credential',
      'access denied',
      'forbidden',
    ];

    const lowerMessage = errorMessage.toLowerCase();
    return authErrorPatterns.some(pattern => lowerMessage.includes(pattern));
  }
}

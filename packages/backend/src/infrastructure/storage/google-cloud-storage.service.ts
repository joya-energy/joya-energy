// Google Cloud Storage implementation
import { Storage } from '@google-cloud/storage';
import { IFileStorageService, FileStorageResult } from '@backend/modules/common/interfaces/storage.interface';
import { Logger } from '@backend/middlewares';

export class GoogleCloudStorageService implements IFileStorageService {
  private storage: Storage;
  private bucketName: string;
  private projectId: string;

  constructor() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILENAME;
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '';
    this.projectId = projectId || '';

    if (!projectId || !this.bucketName) {
      throw new Error('Google Cloud Storage configuration is incomplete. Please check environment variables.');
    }

    this.storage = new Storage({
      projectId,
      keyFilename,
    });

    Logger.info(`Google Cloud Storage initialized: project=${projectId}, bucket=${this.bucketName}`);
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string = 'application/pdf',
    folder: string = 'audit-reports'
  ): Promise<FileStorageResult> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const key = `${folder}/${Date.now()}-${fileName}`;
      const file = bucket.file(key);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalName: fileName,
          },
        },
        public: false, // Private access - use signed URLs
      });

      // Generate public URL (but file is private, so use signed URLs instead)
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${key}`;

      Logger.info(`File uploaded successfully to Google Cloud: ${key}`);

      return {
        success: true,
        url: publicUrl,
        key,
      };
    } catch (error) {
      Logger.error('Failed to upload file to Google Cloud Storage', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Google Cloud upload error',
      };
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      await file.delete();
      Logger.info(`File deleted successfully from Google Cloud: ${key}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete file from Google Cloud: ${key}`, error);
      return false;
    }
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      // Generate signed URL for private file access
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresIn * 1000), // Convert to milliseconds
      });

      return signedUrl;
    } catch (error) {
      Logger.error(`Failed to generate signed URL for Google Cloud file: ${key}`, error);
      return null;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }
}

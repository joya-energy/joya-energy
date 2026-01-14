import { Storage } from '@google-cloud/storage';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { HTTP400Error } from '@backend/errors/http.error';
import { type IFileStorageService, type UploadFileResult } from './file-storage.interface';
import path from 'path';

export class GoogleCloudStorageService implements IFileStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(bucketName: string, keyFilename?: string, impersonateServiceAccount?: string) {
    this.bucketName = bucketName;
    
    // If keyFilename is provided, use service account key file
    if (keyFilename) {
      const resolvedPath = path.isAbsolute(keyFilename) 
        ? keyFilename 
        : path.resolve(process.cwd(), keyFilename);
      this.storage = new Storage({ keyFilename: resolvedPath });
    } else {
      // Use Application Default Credentials (ADC)
      // For signed URLs without JSON keys, use service account impersonation:
      // 1. Set GOOGLE_IMPERSONATE_SERVICE_ACCOUNT environment variable, OR
      // 2. Run: gcloud auth application-default login --impersonate-service-account=SERVICE_ACCOUNT_EMAIL
      this.storage = new Storage();
      
      if (impersonateServiceAccount) {
        // Set environment variable for impersonation (if not already set via gcloud command)
        if (!process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
          process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT = impersonateServiceAccount;
        }
        Logger.info(`🔐 Service account impersonation configured: ${impersonateServiceAccount}`);
        Logger.info(`📝 To use signed URLs, run: gcloud auth application-default login --impersonate-service-account=${impersonateServiceAccount}`);
      } else {
        Logger.warn(`⚠️ No service account impersonation configured. Signed URLs may not work with user credentials.`);
      }
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<UploadFileResult> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const file = bucket.file(filePath);

      await file.save(buffer, {
        metadata: {
          contentType: this.getContentType(fileName),
        },
        // Note: public: true is not compatible with uniform bucket-level access
        // Files are stored privately - use signed URLs for secure access
      });

      // Store the direct URL (not accessible unless bucket is public or using signed URLs)
      const directUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;

      Logger.info(`✅ File uploaded to GCS: ${filePath}`);

      return {
        filePath,
        publicUrl: directUrl, // This is the direct URL, but files are private by default
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`❌ Failed to upload file to GCS: ${errorMessage}`, error);
      throw new HTTP400Error(`Failed to upload file to Google Cloud Storage: ${errorMessage}`, error);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const exists = await file.exists();
      if (!exists[0]) {
        Logger.warn(`⚠️ File does not exist in GCS: ${filePath}`);
        return;
      }

      await file.delete();
      Logger.info(`✅ File deleted from GCS: ${filePath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`❌ Failed to delete file from GCS: ${errorMessage}`, error);
      throw new HTTP400Error(`Failed to delete file from Google Cloud Storage: ${errorMessage}`, error);
    }
  }

  async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      // Try to generate a signed URL using Application Default Credentials
      // Note: This may fail if ADC doesn't have a private key for signing
      // (e.g., user credentials from gcloud auth don't have signing capability)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });

      Logger.info(`✅ Generated signed URL for ${filePath} (expires in ${expiresInSeconds}s)`);
      return signedUrl;
    } catch (error) {
      // If signed URL generation fails (e.g., no private key in ADC),
      // log a warning and fall back to public URL (if bucket is public)
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.warn(`⚠️ Failed to generate signed URL: ${errorMessage}. Using public URL fallback.`);
      
      // Fallback to public URL (works if bucket IAM allows public access)
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
      return publicUrl;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`❌ Failed to check file existence: ${errorMessage}`, error);
      return false;
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      txt: 'text/plain',
      html: 'text/html',
    };
    return contentTypes[extension ?? ''] ?? 'application/octet-stream';
  }
}


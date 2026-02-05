import { Storage, type StorageOptions } from '@google-cloud/storage';
import path from 'path';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { HTTP400Error } from '@backend/errors/http.error';
import {
  type IFileStorageService,
  type UploadFileResult,
} from './file-storage.interface';

/** Parse service account JSON from env (GCS_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS_JSON). Used on Railway/serverless where no key file exists. */
function getCredentialsFromEnv(): Record<string, string> | null {
  const raw =
    process.env.GCS_SERVICE_ACCOUNT_JSON ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      parsed.type === 'service_account' &&
      typeof parsed.private_key === 'string' &&
      typeof parsed.client_email === 'string'
    ) {
      return parsed as Record<string, string>;
    }
  } catch {
    // invalid JSON
  }
  return null;
}

export class GoogleCloudStorageService implements IFileStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(
    bucketName: string,
    keyFilename?: string,
    impersonateServiceAccount?: string
  ) {
    this.bucketName = bucketName;

    let options: StorageOptions;

    // 1) Key file path (local or server with mounted secret)
    if (keyFilename != null && String(keyFilename).trim() !== '') {
      const resolvedPath = path.isAbsolute(keyFilename)
        ? keyFilename
        : path.resolve(process.cwd(), keyFilename);
      options = { keyFilename: resolvedPath };
      Logger.info(`✅ GCS initialized with key file: ${resolvedPath}`);
    } else {
      // 2) Service account JSON from env (Railway, Vercel, etc.) – no file needed
      const credentials = getCredentialsFromEnv();
      if (credentials !== null && credentials !== undefined) {
        options = { credentials };
        Logger.info(
          `✅ GCS initialized with credentials from GCS_SERVICE_ACCOUNT_JSON`
        );
      } else {
        // 3) Application Default Credentials (file path in GOOGLE_APPLICATION_CREDENTIALS, or gcloud, or GCP metadata server)
        if (
          impersonateServiceAccount != null &&
          impersonateServiceAccount !== ''
        ) {
          if (!process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
            process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT =
              impersonateServiceAccount;
          }
          Logger.info(
            `🔐 Service account impersonation configured: ${impersonateServiceAccount}`
          );
          Logger.info(
            `📝 To authenticate locally: gcloud auth application-default login --impersonate-service-account=${impersonateServiceAccount}`
          );
          Logger.info(
            `📝 For Railway/production: set GCS_SERVICE_ACCOUNT_JSON to the full service account JSON (see GCS_SIGNED_URLS_SETUP.md)`
          );
        } else {
          Logger.info(
            `📝 GCS using Application Default Credentials. Set GOOGLE_APPLICATION_CREDENTIALS or GCS_SERVICE_ACCOUNT_JSON for uploads.`
          );
        }
        options = {};
      }
    }

    this.storage = new Storage(options);
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    folder?: string
  ): Promise<UploadFileResult> {
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if it's a credentials/authentication error
      const isCredentialError =
        errorMessage.includes('Could not load the default credentials') ||
        errorMessage.includes('credentials') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('permission');

      if (isCredentialError) {
        Logger.warn(
          `⚠️ GCS upload failed (credentials issue): ${errorMessage}`
        );
        Logger.warn(
          `⚠️ File will not be saved to cloud storage. PDF is still returned/sent by email if requested.`
        );
        Logger.info(
          `📝 To fix: Set up GCS credentials (see GCS_SIGNED_URLS_SETUP.md)`
        );
      } else {
        Logger.error(`❌ Failed to upload file to GCS: ${errorMessage}`, error);
      }

      // Re-throw the error so FileService can handle it and use fallback values
      throw new HTTP400Error(
        `Failed to upload file to Google Cloud Storage: ${errorMessage}`,
        error
      );
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(`❌ Failed to delete file from GCS: ${errorMessage}`, error);
      throw new HTTP400Error(
        `Failed to delete file from Google Cloud Storage: ${errorMessage}`,
        error
      );
    }
  }

  async getSignedUrl(
    filePath: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
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

      Logger.info(
        `✅ Generated signed URL for ${filePath} (expires in ${expiresInSeconds}s)`
      );
      return signedUrl;
    } catch (error) {
      // If signed URL generation fails (e.g., no private key in ADC),
      // log a warning and fall back to public URL (if bucket is public)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.warn(
        `⚠️ Failed to generate signed URL: ${errorMessage}. Using public URL fallback.`
      );

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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

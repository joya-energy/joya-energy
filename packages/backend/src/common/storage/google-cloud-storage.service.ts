import { Storage } from '@google-cloud/storage';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { HTTP400Error } from '@backend/errors/http.error';
import { type IFileStorageService, type UploadFileResult } from './file-storage.interface';

export class GoogleCloudStorageService implements IFileStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(
    bucketName: string,
    // @ts-ignore - kept for backward compatibility
    keyFilename?: string,
    impersonateServiceAccount?: string
  ) {
    this.bucketName = bucketName;
    
    // If keyFilename is provided, use service account key file
    if (keyFilename) {
      const resolvedPath = path.isAbsolute(keyFilename) 
        ? keyFilename 
        : path.resolve(process.cwd(), keyFilename);
      try {
        this.storage = new Storage({ keyFilename: resolvedPath });
        Logger.info(`✅ GCS initialized with key file: ${resolvedPath}`);
      } catch (error) {
        Logger.error(`❌ Failed to initialize GCS with key file ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    } else {
      // Use Application Default Credentials (ADC)
      // For signed URLs without JSON keys, use service account impersonation:
      // 1. Set GOOGLE_IMPERSONATE_SERVICE_ACCOUNT environment variable, OR
      // 2. Run: gcloud auth application-default login --impersonate-service-account=SERVICE_ACCOUNT_EMAIL
      // 3. Or set GOOGLE_APPLICATION_CREDENTIALS to point to a service account JSON file
      try {
        this.storage = new Storage();
        
        if (impersonateServiceAccount) {
          // Set environment variable for impersonation (if not already set via gcloud command)
          if (!process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
            process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT = impersonateServiceAccount;
          }
          Logger.info(`🔐 Service account impersonation configured: ${impersonateServiceAccount}`);
          Logger.info(`📝 To authenticate, run: gcloud auth application-default login --impersonate-service-account=${impersonateServiceAccount}`);
          Logger.info(`📝 Or set GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account JSON file path`);
        } else {
          Logger.warn(`⚠️ No service account impersonation configured. Signed URLs may not work with user credentials.`);
          Logger.info(`📝 To authenticate, set GOOGLE_APPLICATION_CREDENTIALS or run: gcloud auth application-default login`);
        }
      } catch (error) {
        Logger.error(`❌ Failed to initialize GCS with Application Default Credentials: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
    
    // Create Storage client
    // The @google-cloud/storage library automatically handles:
    // - GCP metadata server authentication (in production on GCP)
    // - Application Default Credentials (local development)
    // - Service account impersonation (via GOOGLE_IMPERSONATE_SERVICE_ACCOUNT env var)
    this.storage = new Storage();
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
      
      // Check if it's a credentials/authentication error
      const isCredentialError = errorMessage.includes('Could not load the default credentials') ||
                                errorMessage.includes('credentials') ||
                                errorMessage.includes('authentication') ||
                                errorMessage.includes('permission');
      
      if (isCredentialError) {
        Logger.warn(`⚠️ GCS upload failed (credentials issue): ${errorMessage}`);
        Logger.warn(`⚠️ File will not be saved to cloud storage. Email will still be sent with PDF attachment.`);
        Logger.info(`📝 To fix: Set up GCS credentials (see GCS_SIGNED_URLS_SETUP.md)`);
      } else {
        Logger.error(`❌ Failed to upload file to GCS: ${errorMessage}`, error);
      }
      
      // Re-throw the error so FileService can handle it and use fallback values
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

  /**
   * Extract meaningful error details from GCS errors.
   * Helps identify authentication issues, permission problems, etc.
   */
  private extractErrorDetails(error: unknown): string | null {
    if (!error) {
      return null;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Authentication errors
    if (lowerMessage.includes('invalid_rapt') || lowerMessage.includes('invalid_grant')) {
      return 'Authentication token expired or invalid. Re-authenticate with: gcloud auth application-default login --impersonate-service-account=SERVICE_ACCOUNT';
    }

    if (lowerMessage.includes('unable to impersonate')) {
      return 'Service account impersonation failed. Check GCS_IMPERSONATE_SERVICE_ACCOUNT configuration';
    }

    // Permission errors
    if (lowerMessage.includes('permission denied') || lowerMessage.includes('access denied')) {
      return 'Insufficient permissions. Check service account IAM roles';
    }

    // Network/connectivity errors
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout') || lowerMessage.includes('connection')) {
      return 'Network connectivity issue. Check internet connection';
    }

    // Bucket errors
    if (lowerMessage.includes('bucket') && (lowerMessage.includes('not found') || lowerMessage.includes('does not exist'))) {
      return `Bucket '${this.bucketName}' not found. Check GCS_BUCKET_NAME configuration`;
    }

    return null;
  }
}

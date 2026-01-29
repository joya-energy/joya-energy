import { FileService } from './file.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { GoogleCloudStorageService } from '@backend/common/storage/google-cloud-storage.service';
import { FallbackStorageService } from '@backend/common/storage/fallback-storage.service';
import { ServerConfig } from '@backend/configs/server.config';
import { IFileStorageService } from '@backend/common/storage/file-storage.interface';

let fileServiceInstance: FileService;

export function getFileService(): FileService {
  if (fileServiceInstance) {
    return fileServiceInstance;
  }

  const gcsConfig = ServerConfig.config.googleCloudStorage;
  
  let storageService: IFileStorageService;
  
  if (!gcsConfig.bucketName || gcsConfig.bucketName.trim() === '') {
    storageService = new FallbackStorageService();
    Logger.warn('⚠️ GCS_BUCKET_NAME not configured. Using local fallback storage (files will not be persisted).');
  } else {
    // Initialize GCS service (constructor doesn't throw, errors happen during upload)
    // We'll handle upload errors gracefully in FileService.uploadAndSaveFile()
    storageService = new GoogleCloudStorageService(
      gcsConfig.bucketName, 
      gcsConfig.keyFilename,
      gcsConfig.impersonateServiceAccount
    );
    
    // Log configuration status
    if (gcsConfig.keyFilename) {
      Logger.info(`✅ FileService initialized with Google Cloud Storage (using key file: ${gcsConfig.keyFilename})`);
    } else if (gcsConfig.impersonateServiceAccount) {
      Logger.info(`✅ FileService initialized with Google Cloud Storage (using impersonation: ${gcsConfig.impersonateServiceAccount})`);
      Logger.info(`📝 Note: If upload fails, ensure credentials are set up. See GCS_SIGNED_URLS_SETUP.md`);
    } else {
      Logger.info(`✅ FileService initialized with Google Cloud Storage (using Application Default Credentials)`);
      Logger.info(`📝 Note: If upload fails, set GOOGLE_APPLICATION_CREDENTIALS or run: gcloud auth application-default login`);
    }
  }

  fileServiceInstance = new FileService(storageService);

  return fileServiceInstance;
}


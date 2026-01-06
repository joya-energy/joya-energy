import { FileService } from './file.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { GoogleCloudStorageService } from '@backend/common/storage/google-cloud-storage.service';
import { LocalFallbackStorageService } from '@backend/common/storage/local-fallback-storage.service';
import { ServerConfig } from '@backend/configs/server.config';

let fileServiceInstance: FileService;

export function getFileService(): FileService {
  if (fileServiceInstance) {
    return fileServiceInstance;
  }

  const gcsConfig = ServerConfig.config.googleCloudStorage;
  
      const storageService = (!gcsConfig.bucketName || gcsConfig.bucketName.trim() === '')
        ? new LocalFallbackStorageService()
        : new GoogleCloudStorageService(
            gcsConfig.bucketName, 
            gcsConfig.keyFilename,
            gcsConfig.impersonateServiceAccount
          );

  fileServiceInstance = new FileService(storageService);
  
  if (gcsConfig.bucketName && gcsConfig.bucketName.trim() !== '') {
    Logger.info('✅ FileService initialized with Google Cloud Storage');
  } else {
    Logger.warn('⚠️ GCS_BUCKET_NAME not configured. Using local fallback storage (files will not be persisted).');
  }

  return fileServiceInstance;
}


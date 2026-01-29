import { FileService } from './file.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { FallbackStorageService } from '@backend/common/storage/fallback-storage.service';
import { ServerConfig } from '@backend/configs/server.config';

let fileServiceInstance: FileService;

export function getFileService(): FileService {
  if (fileServiceInstance) {
    return fileServiceInstance;
  }

  const gcsConfig = ServerConfig.config.googleCloudStorage;
  
  const storageService = new FallbackStorageService(
    gcsConfig.bucketName,
    gcsConfig.keyFilename,
    gcsConfig.impersonateServiceAccount
  );

  fileServiceInstance = new FileService(storageService);
  
  if (gcsConfig.bucketName && gcsConfig.bucketName.trim() !== '') {
    Logger.info('✅ FileService initialized with Google Cloud Storage (with local fallback)');
  } else {
    Logger.warn('⚠️ GCS_BUCKET_NAME not configured. Using no-op storage (files will not be persisted).');
  }

  return fileServiceInstance;
}


// Temporarily using local storage until OVH credentials are configured
import { LocalStorageService } from './local-storage.service';

export class OVHStorageService extends LocalStorageService {
  constructor() {
    super('ovh-exports'); // Use a different folder for OVH

    console.warn('⚠️ OVH Object Storage not fully configured. Using local storage as fallback.');
    console.log('To enable OVH Object Storage:');
    console.log('- Set STORAGE_TYPE=ovh in environment');
    console.log('- Configure OVH_ACCESS_KEY_ID, OVH_SECRET_ACCESS_KEY, OVH_BUCKET_NAME');
    console.log('- Install @aws-sdk packages for S3 compatibility');
  }
}

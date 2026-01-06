export interface UploadFileResult {
  filePath: string;
  publicUrl: string;
}

export interface IFileStorageService {
  uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<UploadFileResult>;
  deleteFile(filePath: string): Promise<void>;
  getSignedUrl(filePath: string, expiresInSeconds?: number): Promise<string>;
  fileExists(filePath: string): Promise<boolean>;
}


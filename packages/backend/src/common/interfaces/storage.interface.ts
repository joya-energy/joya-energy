export interface FileStorageResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface IFileStorageService {
  uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType?: string,
    folder?: string
  ): Promise<FileStorageResult>;

  deleteFile(key: string): Promise<boolean>;

  getFileUrl(key: string, expiresIn?: number): Promise<string | null>;

  fileExists(key: string): Promise<boolean>;
}

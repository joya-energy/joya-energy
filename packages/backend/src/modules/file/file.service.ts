import CommonService from '@backend/modules/common/common.service';
import { fileRepository } from './file.repository';
import { type IFile, type ICreateFile, FileType } from '@shared/interfaces/file.interface';
import { IFileStorageService } from '@backend/common/storage/file-storage.interface';
import { HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares/logger.midddleware';

export class FileService extends CommonService<IFile> {
  private readonly storageService: IFileStorageService;

  constructor(storageService: IFileStorageService) {
    super(fileRepository);
    this.storageService = storageService;
  }

  async uploadAndSaveFile(
    buffer: Buffer,
    originalFileName: string,
    fileType: FileType,
    metadata?: IFile['metadata']
  ): Promise<IFile> {
    const fileName = this.generateFileName(originalFileName);
    const folder = this.getFolderForFileType(fileType);
    
    let filePath: string;
    let publicUrl: string;
    
    try {
      const uploadResult = await this.storageService.uploadFile(
        buffer,
        fileName,
        folder
      );
      filePath = uploadResult.filePath;
      publicUrl = uploadResult.publicUrl;
    } catch (error) {
      // If storage upload fails (e.g., GCS credentials issue), use fallback values
      // This allows the file record to be saved in DB even if cloud storage fails
      Logger.warn(`⚠️ Storage upload failed, using fallback values: ${error instanceof Error ? error.message : String(error)}`);
      filePath = folder ? `${folder}/${fileName}` : fileName;
      publicUrl = `fallback://${filePath}`; // Placeholder URL
    }

    const fileData: ICreateFile = {
      fileName,
      originalFileName,
      filePath,
      publicUrl,
      fileType,
      mimeType: this.getMimeType(originalFileName),
      size: buffer.length,
      metadata,
    };

    const file = await this.create(fileData);
    Logger.info(`✅ File saved to database: ${file.id}`);
    
    return file;
  }

  /**
   * Helper method to find a file by ID directly from repository.
   * Bypasses CommonService.findById which passes filters object that causes populate error.
   */
  private async findFileById(id: string): Promise<IFile | null> {
    return await (this.repository as any).getById(id, null);
  }

  async getFileWithSignedUrl(fileId: string, expiresInSeconds: number = 3600): Promise<IFile & { signedUrl: string }> {
    const file = await this.findFileById(fileId);
    
    if (!file) {
      throw new HTTP404Error(`File not found: ${fileId}`);
    }

    const signedUrl = await this.storageService.getSignedUrl(file.filePath, expiresInSeconds);
    
    return {
      ...file,
      signedUrl,
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const file = await this.findFileById(fileId);
    
    if (!file) {
      throw new HTTP404Error(`File not found: ${fileId}`);
    }

    try {
      await this.storageService.deleteFile(file.filePath);
      await this.delete(fileId);
      Logger.info(`✅ File deleted: ${fileId}`);
      return true;
    } catch (error) {
      Logger.error(`❌ Failed to delete file ${fileId}`, error);
      throw error;
    }
  }

  private generateFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const extension = originalFileName.split('.').pop() ?? 'pdf';
    const baseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    return `${baseName}_${timestamp}_${randomSuffix}.${extension}`;
  }

  private getFolderForFileType(fileType: FileType): string {
    const folderMap: Record<FileType, string> = {
      [FileType.PDF_PV_REPORT]: 'pdfs/pv-reports',
      [FileType.PDF_AUDIT_REPORT]: 'pdfs/audit-reports',
      [FileType.OTHER]: 'others',
    };
    return folderMap[fileType] ?? 'others';
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      txt: 'text/plain',
      html: 'text/html',
    };
    return mimeTypes[extension ?? ''] ?? 'application/octet-stream';
  }
}


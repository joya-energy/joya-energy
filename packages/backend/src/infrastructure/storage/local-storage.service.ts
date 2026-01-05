import fs from 'fs';
import path from 'path';
import { IFileStorageService, FileStorageResult } from '@backend/modules/common/interfaces/storage.interface';
import { Logger } from '@backend/middlewares';

export class LocalStorageService implements IFileStorageService {
  private baseDir: string;

  constructor(baseDir: string = 'exports') {
    this.baseDir = path.resolve(process.cwd(), baseDir);

    // Ensure directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      Logger.info(`Created local storage directory: ${this.baseDir}`);
    }
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string = 'application/pdf',
    folder: string = 'audit-reports'
  ): Promise<FileStorageResult> {
    try {
      const folderPath = path.join(this.baseDir, folder);

      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const key = `${folder}/${fileName}`;
      const filePath = path.join(this.baseDir, key);

      fs.writeFileSync(filePath, buffer);

      Logger.info(`File saved locally: ${filePath}`);

      return {
        success: true,
        url: `file://${filePath}`, // Local file URL
        key,
      };
    } catch (error) {
      Logger.error('Failed to save file locally', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown local storage error',
      };
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, key);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        Logger.info(`File deleted locally: ${filePath}`);
        return true;
      }

      return false;
    } catch (error) {
      Logger.error(`Failed to delete local file: ${key}`, error);
      return false;
    }
  }

  async getFileUrl(key: string, expiresIn?: number): Promise<string | null> {
    try {
      const filePath = path.join(this.baseDir, key);

      if (fs.existsSync(filePath)) {
        // For local files, return the file path as URL
        // In a real web server, this would be served through a static file middleware
        return `file://${filePath}`;
      }

      return null;
    } catch (error) {
      Logger.error(`Failed to get local file URL: ${key}`, error);
      return null;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, key);
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }
}

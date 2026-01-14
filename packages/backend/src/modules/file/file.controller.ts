import { type Request, type Response } from 'express';
import { getFileService } from './file.service.factory';
import { type IFile } from '@shared/interfaces/file.interface';
import { HttpStatusCode } from '@shared';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';

const fileService = getFileService();

export class FileController {
  public getFileById = async (req: Request, res: Response<IFile & { signedUrl: string }>): Promise<void> => {
    try {
      const { id } = req.params;
      const expiresIn = req.query.expiresIn ? Number(req.query.expiresIn) : 3600;
      const file = await fileService.getFileWithSignedUrl(id, expiresIn);
      res.status(HttpStatusCode.OK).json(file);
    } catch (error) {
      Logger.error(`Error: File not found: ${String(error)}`);
      throw new HTTP404Error('Error: File not found', error);
    }
  };

  public deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await fileService.deleteFile(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(`Error: File not deleted: ${String(error)}`);
      throw new HTTP400Error('Error: File not deleted', error);
    }
  };
}

export const fileController = new FileController();


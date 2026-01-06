import CommonRepository from '@backend/modules/common/common.repository';
import { FileModel, type FileDocument } from '@backend/models/file';
import {
  type IFile,
  type ICreateFile,
  type IUpdateFile,
} from '@shared/interfaces/file.interface';

export class FileRepository extends CommonRepository<IFile, FileDocument, ICreateFile, IUpdateFile> {
  constructor() {
    super(FileModel);
  }
}

export const fileRepository = new FileRepository();


import { Model } from 'mongoose';
import { IFile } from '@backend/modules/audit-solaire/entities/file.entity';

// Create model for files (we'll register it in the models)
let FileModel: Model<IFile>;

export const initializeFileModel = (model: Model<IFile>) => {
  FileModel = model;
};

export const getFileModel = (): Model<IFile> => {
  if (!FileModel) {
    throw new Error('File model not initialized. Call initializeFileModel first.');
  }
  return FileModel;
};

export class FileRepository {
  private model: Model<IFile>;

  constructor() {
    this.model = getFileModel();
  }

  async create(fileData: Partial<IFile>): Promise<IFile> {
    const file = new this.model(fileData);
    return await file.save();
  }

  async findById(id: string): Promise<IFile | null> {
    return await this.model.findById(id);
  }

  async findByAuditId(auditId: string): Promise<IFile[]> {
    return await this.model.find({ auditId }).sort({ createdAt: -1 });
  }

  async findBySimulationId(simulationId: string): Promise<IFile[]> {
    return await this.model.find({ simulationId }).sort({ createdAt: -1 });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async findExpiredFiles(): Promise<IFile[]> {
    return await this.model.find({
      expiresAt: { $lt: new Date() },
    });
  }
}

export const fileRepository = new FileRepository();

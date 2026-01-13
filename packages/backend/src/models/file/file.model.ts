import { type IFile, FileType } from '@shared/interfaces/file.interface';
import { type Model, type Document } from 'mongoose';
import { buildSchema } from '@backend/common/BaseSchema';
import { type ObjectId } from 'mongodb';
import { ModelsCollection, AuditSimulationTypes } from '@backend/enums';

export type FileDocument = IFile & Document<ObjectId>;

export const File: Model<FileDocument> = buildSchema<FileDocument>(
  ModelsCollection.FILE,
  {
    fileName: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true, trim: true },
    publicUrl: { type: String, required: true, trim: true },
    fileType: { type: String, enum: Object.values(FileType), required: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    metadata: {
      type: {
        simulationId: { type: String, required: false },
        simulationType: { type: String, enum: Object.values(AuditSimulationTypes), required: false },
        companyName: { type: String, required: false },
      },
      required: false,
      _id: false,
    },
  },
  {
    timestamps: true
  }
);


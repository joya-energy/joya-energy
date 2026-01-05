import { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string; // S3 key or local path
  storageUrl: string; // Direct access URL
  folder: string; // e.g., 'audit-reports', 'pv-reports'
  auditId?: string; // Reference to audit if applicable
  simulationId?: string; // Reference to solar simulation if applicable
  uploadedBy?: string; // User ID
  createdAt: Date;
  expiresAt?: Date; // For temporary files
}

export const FileSchema = new Schema<IFile>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  storageKey: { type: String, required: true },
  storageUrl: { type: String, required: true },
  folder: { type: String, required: true, default: 'audit-reports' },
  auditId: { type: String },
  simulationId: { type: String },
  uploadedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
}, {
  timestamps: true,
});

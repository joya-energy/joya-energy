import { BusinessObject, UpdateBusinessObject, CreateBusinessObject } from './buisness.interface';

export enum FileType {
  PDF_PV_REPORT = 'pdf-pv-report',
  PDF_AUDIT_REPORT = 'pdf-audit-report',
  OTHER = 'other',
}

export interface IFile extends BusinessObject {
  fileName: string;
  originalFileName: string;
  filePath: string;
  publicUrl: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  metadata?: {
    simulationId?: string;
    simulationType?: 'audit-solaire' | 'audit-energetique' | 'audit-financier';
    companyName?: string;
    [key: string]: string | undefined;
  };
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IFile, 'createdAt' | 'updatedAt'>;

export type ICreateFile = CreateBusinessObject<IFile, ReadOnlyProperties>;
export type IUpdateFile = UpdateBusinessObject<IFile, ReadOnlyProperties>;


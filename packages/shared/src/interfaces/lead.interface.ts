import { BusinessObject, UpdateBusinessObject, CreateBusinessObject } from './buisness.interface';

export interface ILead extends BusinessObject {
  email: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  companyName?: string;
  source?: string; // e.g., 'simulator', 'contact-form', 'newsletter'
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<ILead, 'createdAt' | 'updatedAt'>;

export type ICreateLead = CreateBusinessObject<ILead, ReadOnlyProperties>;
export type IUpdateLead = UpdateBusinessObject<ILead, ReadOnlyProperties>;

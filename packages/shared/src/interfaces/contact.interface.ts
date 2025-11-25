import { BusinessObject, UpdateBusinessObject, CreateBusinessObject } from './buisness.interface';
import { ContactSubject } from '@shared/enums/contact.enum';

export interface IContact extends BusinessObject {
  name: string;
  email: string;
  message: string;
  phoneNumber: string;
  subject: ContactSubject;    
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IContact, 'createdAt' | 'updatedAt'>;

export type ICreateContact = CreateBusinessObject<IContact, ReadOnlyProperties>;
export type IUpdateContact = UpdateBusinessObject<IContact, ReadOnlyProperties>;





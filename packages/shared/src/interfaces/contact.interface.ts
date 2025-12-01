import { BusinessObject, UpdateBusinessObject, CreateBusinessObject } from './buisness.interface';
import { ContactSubject } from '@shared/enums/contact.enum';

export interface IContact extends BusinessObject {
  name: string;
  email: string;
  message?: string;
  phoneNumber: string;
  subject?: ContactSubject;
  companyName?: string;
  jobTitle?: string; // Keeping jobTitle as per previous request context (though removed from UI, might be good to keep in model optionally, or remove if user implied "remove them" meant all unnecessary ones. User said "remove country and make firstname ,lastname as name (also remove them from model ,services .. )". "them" refers to country, firstname, lastname. I will keep companyName and jobTitle in model if not explicitly asked to remove, but wait, user said "remove fonction" in previous prompt. I should probably remove jobTitle from model too to be clean, or keep it optional. Let's keep it optional for now as the specific instruction was about country and name.)
  // Actually, looking at the previous user message "remove fonction", I should probably remove jobTitle from the interface as well to be consistent with the "clean" directive.
  // However, the current prompt specifically lists: "remove country and make firstname ,lastname as name".
  // I will remove firstName, lastName, country.
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IContact, 'createdAt' | 'updatedAt'>;

export type ICreateContact = CreateBusinessObject<IContact, ReadOnlyProperties>;
export type IUpdateContact = UpdateBusinessObject<IContact, ReadOnlyProperties>;

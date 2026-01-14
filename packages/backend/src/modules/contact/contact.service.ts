// packages/backend/src/modules/contact/contact.service.ts
import CommonService from '@backend/modules/common/common.service';
import { mailService } from '@backend/common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { contactRepository } from './contact.repository';
import { HTTP404Error } from '@backend/errors/http.error';
import { PaginationOptions, PaginatedResult } from '@shared/interfaces/pagination.interface';
import { type IContact, type ICreateContact } from '@shared/interfaces/contact.interface';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export class ContactService extends CommonService<IContact> {
  constructor() {
    super(contactRepository);
  }

  public async createContact(payload: ICreateContact): Promise<IContact> {
    const contact = await this.create(payload);

    // send notification email
    await this.sendNotification(contact).catch((error) => {
      Logger.warn(`Failed to send contact notification email: ${(error as Error).message}`);
    });

    return contact;
  }

  public async getContacts(options: PaginationOptions): Promise<PaginatedResult<IContact>> {
    const page = options.page && options.page > 0 ? options.page : DEFAULT_PAGE;
    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    return contactRepository.paginate({ page, limit });
  }

  public async getContactById(id: string): Promise<IContact> {
    const contact = await this.findById(id);
    if (!contact) throw new HTTP404Error('Contact not found');
    return contact;
  }

  public async deleteContact(id: string): Promise<void> {
    const deleted = await this.delete(id);
    if (!deleted) throw new HTTP404Error('Contact not found');
  }
  private async sendNotification(contact: IContact): Promise<void> {
    if (!contact.email) {
      Logger.warn('Contact email is missing. Skipping notification.');
      return;
    }
await mailService.sendMail({
  to: contact.email,
  subject: 'Nouveau message de contact',
  text: 'Vous avez reçu un nouveau message via le formulaire de contact.',
  html: '<p>Vous avez reçu un nouveau message via le formulaire de contact.</p>',
  templateId: Number(process.env.POSTMARK_CONTACT_TEMPLATE_ID),
  templateModel: {
    name: contact.name ?? '',
    email: contact.email ?? '',
    phoneNumber: contact.phoneNumber ?? '',
    message: contact.message ?? '',
  },
  attachments: [], // REQUIRED by interface (empty is OK)
});


  }
}

export const contactService = new ContactService();

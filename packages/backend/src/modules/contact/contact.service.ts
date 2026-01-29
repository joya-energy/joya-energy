import CommonService from '@backend/modules/common/common.service';
import { mailService } from '@backend/common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import {
  type IContact,
  type ICreateContact,

} from '@shared/interfaces/contact.interface';
import { contactRepository } from './contact.repository';
import { HTTP404Error } from '@backend/errors/http.error';
import { PaginationOptions, PaginatedResult } from '@shared/interfaces/pagination.interface';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export class ContactService extends CommonService<IContact> {
  constructor() {
    super(contactRepository);
  }

  public async createContact(payload: ICreateContact): Promise<IContact> {
    const contact = await this.create(payload);

    await this.sendNotification(contact).catch((error) => {
      Logger.warn(`Failed to send contact notification email: ${(error as Error).message}`);
    });

    return contact;
  }

  public async getContacts(options: PaginationOptions): Promise<PaginatedResult<IContact>> {
    const page = Number.isFinite(options.page) && options.page > 0 ? options.page : DEFAULT_PAGE;
    const rawLimit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, MAX_LIMIT);

    return contactRepository.paginate({ page, limit });
  }

  public async getContactById(id: string): Promise<IContact> {
    const contact = await this.findById(id);

    if (!contact) {
      throw new HTTP404Error('Contact not found');
    }

    return contact;
  }

  public async deleteContact(id: string): Promise<void> {
    const deleted = await this.delete(id);

    if (!deleted) {
      throw new HTTP404Error('Contact not found');
    }
  }

  private async sendNotification(contact: IContact): Promise<void> {
    const recipient = process.env.EMAIL_TO;
    Logger.info('Sending notification email to:', process.env.EMAIL_TO);
    if (!recipient) {
      Logger.warn('EMAIL_TO is not configured. Skipping notification email.');
      return;
    }

    await mailService.sendMail({
      to: recipient,
      subject: `New contact from ${contact.name}`,
      text: contact.message,
      html: `<p><strong>Name:</strong> ${contact.name}</p>
             <p><strong>Email:</strong> ${contact.email}</p>
             <p><strong>Message:</strong></p>
             <p>${contact.message.replace(/\n/g, '<br>')}</p>`
    });
  }
}

export const contactService = new ContactService();

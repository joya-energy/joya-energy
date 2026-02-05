// packages/backend/src/modules/contact/contact.service.ts
import CommonService from '@backend/modules/common/common.service';
import { mailService } from '@backend/common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { contactRepository } from './contact.repository';
import { HTTP404Error } from '@backend/errors/http.error';
import {
  PaginationOptions,
  PaginatedResult,
} from '@shared/interfaces/pagination.interface';
import {
  type IContact,
  type ICreateContact,
} from '@shared/interfaces/contact.interface';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/** Postmark template "joya_mail" (alias: code-your-own-1) – body: {{{ @content }}} */
const CONTACT_CONFIRMATION_TEMPLATE_ID = 42404133;

const CONTACT_ADMIN_EMAIL =
  process.env.CONTACT_ADMIN_EMAIL ?? 'rayan@joya-energy.com';

export class ContactService extends CommonService<IContact> {
  constructor() {
    super(contactRepository);
  }

  public async createContact(payload: ICreateContact): Promise<IContact> {
    const contact = await this.create(payload);

    // Send confirmation to user (template) + notification to admin (simple mail)
    this.sendContactEmails(contact).catch((error) => {
      Logger.warn(`Contact emails error: ${(error as Error).message}`);
    });

    return contact;
  }

  public async getContacts(
    options: PaginationOptions
  ): Promise<PaginatedResult<IContact>> {
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
  /**
   * Sends two emails: (1) confirmation to the user via Postmark template, (2) notification to admin.
   */
  private async sendContactEmails(contact: IContact): Promise<void> {
    if (!contact.email) {
      Logger.warn('Contact email is missing. Skipping contact emails.');
      return;
    }

    // 1) Confirmation to user – Postmark template "joya_mail" ({{{ @content }}})
    const confirmationContent = `
      <p>Bonjour ${escapeHtml(contact.name ?? '')},</p>
      <p>Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.</p>
      <p>Cordialement,<br/>L'équipe JOYA Energy</p>
    `;
    try {
      await mailService.sendMail({
        to: contact.email,
        subject: 'Votre message a bien été reçu | JOYA Energy',
        text: 'Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.',
        html: confirmationContent,
        templateId: CONTACT_CONFIRMATION_TEMPLATE_ID,
        templateModel: { content: confirmationContent },
        attachments: [],
      });
      Logger.info(`✅ Contact confirmation sent to ${contact.email}`);
    } catch (err) {
      Logger.warn(
        `Failed to send contact confirmation to user: ${(err as Error).message}`
      );
    }

    // 2) Notification to admin – simple email with full contact details
    const adminHtml = `
      <p>Nouveau message reçu via le formulaire de contact.</p>
      <ul>
        <li><strong>Nom :</strong> ${escapeHtml(contact.name ?? '')}</li>
        <li><strong>Email :</strong> ${escapeHtml(contact.email ?? '')}</li>
        <li><strong>Téléphone :</strong> ${escapeHtml(contact.phoneNumber ?? '')}</li>
        <li><strong>Entreprise :</strong> ${escapeHtml(contact.companyName ?? '')}</li>
        <li><strong>Sujet :</strong> ${escapeHtml(String(contact.subject ?? ''))}</li>
      </ul>
      <p><strong>Message :</strong></p>
      <p>${escapeHtml(contact.message ?? '').replace(/\n/g, '<br>')}</p>
    `;
    const adminText = `Contact - ${contact.name ?? ''} (${contact.email ?? ''}). Tél: ${contact.phoneNumber ?? ''}. Sujet: ${contact.subject ?? ''}. Message: ${(contact.message ?? '').replace(/\n/g, ' ')}`;
    try {
      await mailService.sendSimpleMail({
        to: CONTACT_ADMIN_EMAIL,
        subject: `[JOYA Contact] ${contact.subject ?? 'Sans sujet'} – ${contact.name ?? ''}`,
        text: adminText,
        html: adminHtml,
      });
      Logger.info(
        `✅ Contact notification sent to admin (${CONTACT_ADMIN_EMAIL})`
      );
    } catch (err) {
      Logger.warn(
        `Failed to send contact notification to admin: ${(err as Error).message}`
      );
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const contactService = new ContactService();

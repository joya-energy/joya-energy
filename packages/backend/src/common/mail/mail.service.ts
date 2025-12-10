import nodemailer, { type Transporter } from 'nodemailer';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { ServerClient } from 'postmark';

// Attachment type compatible with both Postmark and Nodemailer
export interface MailAttachment {
  Name: string;
  Content: string;
  ContentType: string;
  ContentID?: string | null;
}

// Options for sending an email
export interface MailOptions {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  templateId?: number;
  templateModel?: Record<string, unknown>;
  attachments?: MailAttachment[];
}

// SMTP configuration type
interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export class MailService {
  private transporter?: Transporter;
  private postmarkClient?: ServerClient;

  private buildConfig(): MailConfig | null {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      Logger.warn('⚠️ Mail configuration is incomplete. Emails will not be sent.');
      return null;
    }

    return {
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: EMAIL_FROM ?? SMTP_USER
    };
  }

  private ensureTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const config = this.buildConfig();
    if (!config) return null;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    Logger.info('📬 SMTP transporter initialized.');
    return this.transporter;
  }

  private ensurePostmarkClient(): ServerClient | null {
    if (this.postmarkClient) return this.postmarkClient;

    const token = process.env.POSTMARK_SERVER_TOKEN;
    if (!token) {
      Logger.warn('⚠️ POSTMARK_SERVER_TOKEN missing. Falling back to SMTP.');
      return null;
    }

    Logger.info('📨 Postmark client initialized.');
    this.postmarkClient = new ServerClient(token);
    return this.postmarkClient;
  }

  public async sendMail(options: MailOptions): Promise<void> {
    const postmark = this.ensurePostmarkClient();
    const transporter = this.ensureTransporter();
    const config = this.buildConfig();
    const from = process.env.POSTMARK_FROM ?? config?.from ?? '';

    // -------------------------------------------------------------------
    // POSTMARK SENDING (PRIMARY)
    // -------------------------------------------------------------------
    if (postmark && (options.templateId || options.templateModel || options.attachments)) {
      try {
        Logger.info('📨 Attempting to send email via Postmark...');
        Logger.debug('🧵 Postmark Config:', {
          from,
          to: options.to,
          templateId: options.templateId,
          messageStream: process.env.POSTMARK_MESSAGE_STREAM,
        });

        Logger.debug('📦 Postmark Payload:', {
          From: from,
          To: options.to,
          TemplateId: options.templateId ?? 0,
          TemplateModel: options.templateModel ?? {},
          Attachments: options.attachments,
          MessageStream: process.env.POSTMARK_MESSAGE_STREAM ?? 'outbound'
        });

        // 🔥 REAL EXECUTION BREAKPOINT
        debugger;

        const response = await postmark.sendEmailWithTemplate({
          From: from,
          To: options.to,
          TemplateId: options.templateId ?? 0,
          TemplateModel: options.templateModel ?? {},
          Attachments: options.attachments?.map(a => ({
            Name: a.Name,
            Content: a.Content,
            ContentType: a.ContentType,
            ContentID: a.ContentID ?? null
          })),
          MessageStream: process.env.POSTMARK_MESSAGE_STREAM ?? 'outbound'
        });

        Logger.info('✅ Email successfully sent via Postmark.');
        Logger.debug('📨 Postmark Response:', response);

        return;
      } catch (err) {
        Logger.error(`❌ Postmark send failed: ${(err as Error).message}. Falling back to SMTP.`);
        Logger.error(err);
      }
    }

    // -------------------------------------------------------------------
    // SMTP FALLBACK
    // -------------------------------------------------------------------
    if (!transporter) {
      Logger.warn('⚠️ No SMTP transporter configured. Email skipped.');
      return;
    }

    try {
      Logger.info('📬 Sending email via SMTP fallback...');

      await transporter.sendMail({
        from: config?.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(a => ({
          filename: a.Name,
          content: Buffer.from(a.Content, 'base64'),
          contentType: a.ContentType,
          cid: a.ContentID ?? undefined
        }))
      });

      Logger.info(`✅ Email sent via SMTP to ${options.to}`);
    } catch (err) {
      Logger.error(`❌ Failed to send email via SMTP: ${(err as Error).message}`);
      throw err;
    }
  }
}

export const mailService = new MailService();

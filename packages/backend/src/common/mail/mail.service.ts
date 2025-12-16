import nodemailer, { Transporter } from 'nodemailer';
import { ServerClient } from 'postmark';
import { Logger } from '@backend/middlewares/logger.midddleware';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface MailAttachment {
  Name: string;
  Content: string; // base64
  ContentType: string;
  ContentID: string;
}

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  templateId: number;
  templateModel: Record<string, string | number | boolean>;
  attachments: MailAttachment[];
}

interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

/* -------------------------------------------------------------------------- */
/*                         SAFE TRANSPORT UNION                   */
/* -------------------------------------------------------------------------- */

type EmailTransport =
  | { type: 'postmark'; client: ServerClient }
  | { type: 'smtp'; client: Transporter };

/* -------------------------------------------------------------------------- */
/*                                MAIL SERVICE                                 */
/* -------------------------------------------------------------------------- */

export class MailService {
  private transporter?: Transporter;
  private postmarkClient?: ServerClient;

  /* ---------------------------- CONFIG BUILDER ---------------------------- */

  private buildConfig(): MailConfig | null {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      Logger.warn('⚠️ SMTP config incomplete — email sending disabled.');
      return null;
    }

    const port = Number(SMTP_PORT);
    if (Number.isNaN(port)) {
      throw new Error('Invalid SMTP_PORT');
    }

    return {
      host: SMTP_HOST,
      port,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: EMAIL_FROM ?? SMTP_USER,
    };
  }

  /* ------------------------ SAFE TRANSPORT RESOLUTION ----------------------- */

  private ensureTransport(): EmailTransport {
    // 1️⃣ Postmark first
    const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
    if (postmarkToken) {
      if (!this.postmarkClient) {
        this.postmarkClient = new ServerClient(postmarkToken);
        Logger.info('📨 Postmark client initialized');
      }

      return {
        type: 'postmark',
        client: this.postmarkClient,
      };
    }

    // 2️⃣ SMTP fallback
    const config = this.buildConfig();
    if (!config) {
      throw new Error('No email transport available');
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        tls: {
        rejectUnauthorized: false, 
         },


        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      Logger.info('📬 SMTP transporter initialized');
    }

    return {
      type: 'smtp',
      client: this.transporter,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                  SEND MAIL                                 */
  /* -------------------------------------------------------------------------- */

  public async sendMail(options: MailOptions): Promise<void> {
    const transport = this.ensureTransport();

    const from =
    process.env.POSTMARK_FROM ??
    process.env.EMAIL_FROM ??
    '';

      if (!from) {
    throw new Error('EMAIL_FROM / POSTMARK_FROM is missing');
  }

    try {
      /* ---------------------------- POSTMARK ---------------------------- */

      if (transport.type === 'postmark') {
        Logger.info('📨 Sending email via Postmark');

        await transport.client.sendEmailWithTemplate({
          From: from,
          To: options.to,
          TemplateId: options.templateId,
          TemplateModel: options.templateModel,
          Attachments: options.attachments.map(a => ({
            Name: a.Name,
            Content: a.Content,
            ContentType: a.ContentType,
            ContentID: a.ContentID,
          })),
          MessageStream:
            process.env.POSTMARK_MESSAGE_STREAM ?? 'outbound',
        });

        Logger.info('✅ Email sent via Postmark');
        return;
      }

      /* ----------------------------- SMTP ------------------------------ */

      Logger.info('📬 Sending email via SMTP');

      await transport.client.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments.map(a => ({
          filename: a.Name,
          content: Buffer.from(a.Content, 'base64'),
          contentType: a.ContentType,
          cid: a.ContentID,
        })),
      });

      Logger.info(`✅ Email sent via SMTP to ${options.to}`);

    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      Logger.error(`❌ Email send failed: ${message}`);
      throw err;
    }
  }
}

export const mailService = new MailService();

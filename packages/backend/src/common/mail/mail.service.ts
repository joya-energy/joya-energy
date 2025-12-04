import nodemailer, { type Transporter } from 'nodemailer';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { ServerClient } from 'postmark';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: number;
  templateModel?: Record<string, unknown>;
}
interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

class MailService {
  public transporter?: Transporter;

  private buildConfig(): MailConfig | null {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      Logger.warn('Mail configuration is incomplete. Emails will not be sent.');
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
    if (this.transporter) {
      return this.transporter;
    }

    const config = this.buildConfig();

    if (!config) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    return this.transporter;
  }
  
  public async sendMail(options: MailOptions): Promise<void> {
    Logger.info(
      `Postmark debug: ${JSON.stringify({
        templateId: options.templateId,
        hasModel: !!options.templateModel,
        typeofTemplateId: typeof options.templateId
      })}`
    );



    // Try Postmark first
    const postmarkClient = this.ensurePostmarkClient();
  
    if (postmarkClient) {
      const stream = process.env.POSTMARK_MESSAGE_STREAM ?? 'outbound';
      const from = process.env.POSTMARK_FROM ?? this.buildConfig()?.from ?? '';
  
      try {
        if (options.templateId && options.templateModel) {
          await postmarkClient.sendEmailWithTemplate({
            From: from,
            To: options.to,
            TemplateId: options.templateId,
            TemplateModel: options.templateModel,
            MessageStream: stream
          });
        } else {
          await postmarkClient.sendEmail({
            From: from,
            To: options.to,
            Subject: options.subject,
            HtmlBody: options.html,
            TextBody: options.text,
            MessageStream: stream
          });
        }
  
        Logger.info(`Email dispatched via Postmark to ${options.to}`);
        return;
      } catch (error) {
        Logger.error(`Postmark send failed: ${(error as Error).message}. Falling back to SMTP.`);
      }
    }
  
    // Fallback: existing Nodemailer logic
    const transporter = this.ensureTransporter();
  
    if (!transporter) {
      Logger.warn('Transporter not configured. Skipping email send.');
      return;
    }
  
    const config = this.buildConfig();
  
    try {
      await transporter.sendMail({
        from: config?.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });
      Logger.info(`Email dispatched via SMTP to ${options.to}`);
    } catch (error) {
      Logger.error(`Failed to send email via SMTP: ${(error as Error).message}`);
      throw error;
    }
  }


  private postmarkClient?: ServerClient;

  private ensurePostmarkClient(): ServerClient | null {
    if (this.postmarkClient) return this.postmarkClient;
  
    const token = process.env.POSTMARK_SERVER_TOKEN;
    if (!token) {
      Logger.warn('POSTMARK_SERVER_TOKEN missing. Falling back to SMTP.');
      return null;
    }
  
    this.postmarkClient = new ServerClient(token);
    return this.postmarkClient;
  }

}

export const mailService = new MailService();



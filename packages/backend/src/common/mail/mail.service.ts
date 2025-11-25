import nodemailer, { type Transporter } from 'nodemailer';
import { Logger } from '@backend/middlewares/logger.midddleware';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
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
      Logger.info(`Email dispatched to ${options.to}`);
    } catch (error) {
      Logger.error(`Failed to send email: ${(error as Error).message}`);
      throw error;
    }
  }
}

export const mailService = new MailService();



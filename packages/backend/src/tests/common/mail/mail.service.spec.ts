import nodemailer from 'nodemailer';
import { mailService } from '../../../common/BaseSchema';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));

const createTransportMock = nodemailer.createTransport as jest.Mock;

describe('MailService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error resetting private field for testing purposes
    mailService.transporter = undefined;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('sends an email when configuration is complete', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'password';
    process.env.EMAIL_FROM = 'noreply@example.com';

    await mailService.sendMail({
      to: 'dest@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test'
    });

    expect(createTransportMock).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'dest@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test'
    });
  });

  it('skips sending when configuration is incomplete', async () => {
    await mailService.sendMail({
      to: 'dest@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(createTransportMock).not.toHaveBeenCalled();
  });
});

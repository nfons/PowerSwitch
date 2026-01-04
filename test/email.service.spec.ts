import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../src/email/email.service';

// Mock nodemailer
jest.mock('nodemailer', () => {
  return {
    __esModule: true,
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
  };
});

import * as nodemailer from 'nodemailer';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const createModule = async (env: Record<string, string | undefined>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => env[key],
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize without transporter when credentials are missing', async () => {
    await createModule({ GMAIL_USER: undefined, GMAIL_PASS: undefined });

    // transporter should not be created
    expect((nodemailer as any).createTransport).not.toHaveBeenCalled();

    await expect(
      service.sendMail({ to: 'user@example.com', subject: 'Test' }),
    ).resolves.toBeUndefined();
  });

  it('should initialize transporter when credentials are provided', async () => {
    await createModule({ GMAIL_USER: 'test@gmail.com', GMAIL_PASS: 'secret', GMAIL_FROM: 'PowerSwitch <test@gmail.com>' });

    expect((nodemailer as any).createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'test@gmail.com', pass: 'secret' },
    });
  });

  it('should send email using transporter when configured', async () => {
    await createModule({ GMAIL_USER: 'test@gmail.com', GMAIL_PASS: 'secret' });

    const transporter = (nodemailer as any).createTransport.mock.results[0].value;

    await service.sendMail({ to: 'user@example.com', subject: 'Hello', text: 'Test body' });

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Hello',
        text: 'Test body',
      }),
    );
  });

  it('should respect custom from address if provided', async () => {
    await createModule({ GMAIL_USER: 'test@gmail.com', GMAIL_PASS: 'secret' });
    const transporter = (nodemailer as any).createTransport.mock.results[0].value;

    await service.sendMail({ to: 'user@example.com', subject: 'Hello', html: '<b>Hi</b>', from: 'Custom <custom@example.com>' });

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Custom <custom@example.com>' }),
    );
  });

  it('should initialize Ethereal SMTP transporter when EMAIL_TEST is set', async () => {
    await createModule({ GMAIL_USER: 'ethereal@example.com', GMAIL_PASS: 'secret', EMAIL_TEST: 'true' });

    expect((nodemailer as any).createTransport).toHaveBeenCalledWith({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'ethereal@example.com', pass: 'secret' },
    });
  });
});


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn('GMAIL_USER or GMAIL_PASS not set; EmailService will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async sendMail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter is not configured. Skipping sendMail.');
      return;
    }

    const fromDefault = `"Your PowerSwitch Instance" <${this.configService.get<string>('GMAIL_USER')}>`; // gmail specific i think?
    try {
      await this.transporter.sendMail({
        from: options.from || fromDefault,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email sent to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    } catch (error) {
      this.logger.error('Failed to send email', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}


/**
 * Email service for sending transactional emails
 * Note: This is a basic implementation. For production, consider using:
 * - nodemailer with SMTP
 * - SendGrid API
 * - AWS SES
 * - Resend
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private from: string;
  private smtpHost?: string;
  private smtpPort?: number;
  private smtpUser?: string;
  private smtpPass?: string;

  constructor() {
    this.from = process.env.SMTP_FROM || 'noreply@inventorypro.com';
    this.smtpHost = process.env.SMTP_HOST;
    this.smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
    this.smtpUser = process.env.SMTP_USER;
    this.smtpPass = process.env.SMTP_PASS;
  }

  /**
   * Send email
   * For now, this logs the email. In production, integrate with actual email service.
   */
  async send(options: EmailOptions): Promise<boolean> {
    try {
      // Log email for development
      console.log('====== EMAIL ======');
      console.log('From:', this.from);
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('HTML:', options.html);
      console.log('==================');

      // TODO: Implement actual email sending with nodemailer or email service
      // Example with nodemailer:
      /*
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpPort === 465,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });

      await transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      */

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const { welcomeEmailTemplate } = await import('./templates/welcome.template');
    const html = welcomeEmailTemplate(firstName);

    return this.send({
      to,
      subject: 'Welcome to InventoryPro',
      html,
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(to: string, firstName: string, verificationLink: string): Promise<boolean> {
    const { verificationEmailTemplate } = await import('./templates/verification.template');
    const html = verificationEmailTemplate(firstName, verificationLink);

    return this.send({
      to,
      subject: 'Verify your email address',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, firstName: string, resetLink: string): Promise<boolean> {
    const { passwordResetEmailTemplate } = await import('./templates/password-reset.template');
    const html = passwordResetEmailTemplate(firstName, resetLink);

    return this.send({
      to,
      subject: 'Reset your password',
      html,
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(to: string, firstName: string): Promise<boolean> {
    const { passwordChangedEmailTemplate } = await import('./templates/password-changed.template');
    const html = passwordChangedEmailTemplate(firstName);

    return this.send({
      to,
      subject: 'Your password has been changed',
      html,
    });
  }

  /**
   * Send account created notification (for admin-created accounts)
   */
  async sendAccountCreatedEmail(
    to: string,
    firstName: string,
    tempPassword: string,
    loginLink: string
  ): Promise<boolean> {
    const { accountCreatedEmailTemplate } = await import('./templates/account-created.template');
    const html = accountCreatedEmailTemplate(firstName, tempPassword, loginLink);

    return this.send({
      to,
      subject: 'Your account has been created',
      html,
    });
  }
}

export const emailService = new EmailService();

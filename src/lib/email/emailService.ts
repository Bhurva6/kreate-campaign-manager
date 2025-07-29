import nodemailer from 'nodemailer';
import { EmailOptions, EmailResponse } from './types';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASS;

    if (!emailUser || !emailPassword) {
      console.warn(
        'Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.'
      );
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Verify the email transporter connection
   */
  async verifyConnection(): Promise<EmailResponse> {
    try {
      await this.transporter.verify();
      this.isConfigured = true;
      return {
        success: true,
        message: 'Email service connection verified successfully',
      };
    } catch (error) {
      this.isConfigured = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to verify email service connection',
        error: errorMessage,
      };
    }
  }

  /**
   * Send an email using the configured transporter
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Verify connection if not already done
      if (!this.isConfigured) {
        const verificationResult = await this.verifyConnection();
        if (!verificationResult.success) {
          return verificationResult;
        }
      }

      // Validate required fields
      if (!options.to || !options.subject) {
        return {
          success: false,
          message: 'Missing required fields: to and subject are required',
          error: 'Invalid email options',
        };
      }

      if (!options.html && !options.text) {
        return {
          success: false,
          message: 'Either html or text content is required',
          error: 'No email content provided',
        };
      }

      // Send the email
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
      };
    }
  }

  /**
   * Get the current configuration status
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Gracefully close the transporter
   */
  async close(): Promise<void> {
    this.transporter.close();
    this.isConfigured = false;
  }
}

// Export a singleton instance
export const emailService = new EmailService();

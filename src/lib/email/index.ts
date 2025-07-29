import { emailService } from './emailService';
import { emailTemplates } from './templates';
import { EmailResponse } from './types';

/**
 * Send a verification email with OTP
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  otp: string,
  appName: string = 'Kreate'
): Promise<EmailResponse> {
  const template = emailTemplates.verification(name, otp, appName);
  
  return await emailService.sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send a password reset email with OTP
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  otp: string,
  appName: string = 'Kreate'
): Promise<EmailResponse> {
  const template = emailTemplates.passwordReset(name, otp, appName);
  
  return await emailService.sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send a welcome email after successful verification
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  appName: string = 'Kreate',
  frontendUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000'
): Promise<EmailResponse> {
  const template = emailTemplates.welcome(name, appName, frontendUrl);
  
  return await emailService.sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  appName: string = 'Kreate'
): Promise<EmailResponse> {
  const template = emailTemplates.notification(title, message, appName);
  
  return await emailService.sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send a custom email with your own content
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  content: { html?: string; text?: string },
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>
): Promise<EmailResponse> {
  return await emailService.sendEmail({
    to,
    subject,
    html: content.html,
    text: content.text,
    attachments,
  });
}

/**
 * Verify that the email service is properly configured and working
 */
export async function verifyEmailService(): Promise<EmailResponse> {
  return await emailService.verifyConnection();
}

/**
 * Check if the email service is ready to send emails
 */
export function isEmailServiceReady(): boolean {
  return emailService.isReady();
}

// Re-export types for convenience
export type { EmailOptions, EmailResponse } from './types';

// Re-export the service instance if needed for advanced usage
export { emailService } from './emailService';

// =============================================================================
// COMPATIBILITY LAYER - Legacy function names for backward compatibility
// =============================================================================

/**
 * Legacy compatibility function for email verification OTP
 * @deprecated Use sendVerificationEmail instead
 */
export async function sendEmailVerificationOTP(
  email: string,
  otp: string,
  name: string,
  appName: string = 'Kreate'
): Promise<EmailResponse> {
  return await sendVerificationEmail(email, name, otp, appName);
}

/**
 * Legacy compatibility function for password reset OTP
 * @deprecated Use sendPasswordResetEmail instead
 */
export async function sendPasswordResetOTP(
  email: string,
  otp: string,
  name: string,
  appName: string = 'Kreate'
): Promise<EmailResponse> {
  return await sendPasswordResetEmail(email, name, otp, appName);
}

/**
 * Legacy compatibility function for basic email sending
 * @deprecated Use sendCustomEmail instead
 */
export async function sendEmail(
  email: string,
  subject: string,
  message: string
): Promise<any> {
  const result = await sendCustomEmail(email, subject, { html: message });
  
  // Return legacy format for compatibility
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error
  };
}

/**
 * Legacy compatibility function for transporter verification
 * @deprecated Use verifyEmailService instead
 */
export async function verifyTransporter(): Promise<boolean> {
  const result = await verifyEmailService();
  return result.success;
}

/**
 * Legacy compatibility function for email configuration
 * @deprecated Email configuration is now handled internally
 */
export function getEmailConfig() {
  return {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    APP_NAME: process.env.APP_NAME || 'Kreate',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    isConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    isGmail: process.env.EMAIL_USER?.toLowerCase().endsWith('@gmail.com') || false
  };
}

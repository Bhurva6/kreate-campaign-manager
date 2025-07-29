/**
 * Email Service - Main Entry Point
 * Re-exports all email functionality from the email module
 */

// Re-export all email functions and types
export * from './email/index';

// Re-export specific commonly used functions for convenience
export { 
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendCustomEmail,
  verifyEmailService,
  isEmailServiceReady,
  emailService
} from './email/index';
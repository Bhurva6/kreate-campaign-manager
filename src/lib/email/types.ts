export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

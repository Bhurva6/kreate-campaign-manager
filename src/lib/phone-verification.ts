import twilio from 'twilio';
import { auth } from './firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider,
  ConfirmationResult
} from 'firebase/auth';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  verificationId?: string;
  confirmationResult?: ConfirmationResult;
  method?: 'firebase' | 'twilio';
}

export class PhoneVerificationService {
  private static recaptchaVerifier: RecaptchaVerifier | null = null;
  private static otpStorage: Map<string, { otp: string; expires: number }> = new Map();

  /**
   * Initialize RecaptchaVerifier for Firebase phone authentication
   */
  static async initializeRecaptcha(containerId: string = 'recaptcha-container'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear();
        }

        this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
            resolve();
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            reject(new Error('reCAPTCHA expired'));
          },
          'error-callback': (error: any) => {
            console.error('reCAPTCHA error:', error);
            reject(error);
          }
        });

        this.recaptchaVerifier.render().then(() => {
          resolve();
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send OTP using Firebase (preferred method)
   */
  static async sendOTPWithFirebase(phoneNumber: string): Promise<PhoneVerificationResult> {
    try {
      if (!this.recaptchaVerifier) {
        await this.initializeRecaptcha();
      }

      console.log('Sending Firebase OTP to:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier!
      );

      return {
        success: true,
        message: 'OTP sent successfully via Firebase',
        verificationId: confirmationResult.verificationId,
        confirmationResult,
        method: 'firebase'
      };
    } catch (error: any) {
      console.error('Firebase OTP error:', error);
      // Fallback to Twilio if Firebase fails
      return this.sendOTPWithTwilio(phoneNumber);
    }
  }

  /**
   * Send OTP using Twilio (fallback method)
   */
  static async sendOTPWithTwilio(phoneNumber: string): Promise<PhoneVerificationResult> {
    try {
      if (!client) {
        throw new Error('Twilio not configured');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      await client.messages.create({
        body: `Your Kreate verification code is: ${otp}. This code will expire in 10 minutes.`,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });

      // Store OTP temporarily
      this.otpStorage.set(phoneNumber, { otp, expires });

      return {
        success: true,
        message: 'OTP sent successfully via SMS',
        method: 'twilio'
      };
    } catch (error: any) {
      console.error('Twilio OTP error:', error);
      return {
        success: false,
        message: `Failed to send OTP: ${error.message}`,
      };
    }
  }

  /**
   * Main method to send OTP (tries Firebase first, then Twilio)
   */
  static async sendOTP(phoneNumber: string): Promise<PhoneVerificationResult> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    // Try Firebase first
    const result = await this.sendOTPWithFirebase(formattedPhone);
    if (result.success) {
      return result;
    }

    // Fallback to Twilio
    return this.sendOTPWithTwilio(formattedPhone);
  }

  /**
   * Verify OTP for Firebase
   */
  static async verifyFirebaseOTP(confirmationResult: ConfirmationResult, otpCode: string) {
    try {
      const result = await confirmationResult.confirm(otpCode);
      return {
        success: true,
        message: 'Phone number verified successfully',
        user: result.user
      };
    } catch (error: any) {
      console.error('Firebase OTP verification error:', error);
      return {
        success: false,
        message: `Invalid OTP code: ${error.message}`
      };
    }
  }

  /**
   * Verify OTP for Twilio
   */
  static async verifyTwilioOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const stored = this.otpStorage.get(formattedPhone);
      
      if (!stored) {
        return {
          success: false,
          message: 'No OTP found for this phone number'
        };
      }

      if (Date.now() > stored.expires) {
        this.otpStorage.delete(formattedPhone);
        return {
          success: false,
          message: 'OTP has expired'
        };
      }

      if (stored.otp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP code'
        };
      }

      // Clean up
      this.otpStorage.delete(formattedPhone);
      
      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error: any) {
      console.error('Error verifying Twilio OTP:', error);
      return {
        success: false,
        message: 'Error verifying OTP',
      };
    }
  }

  /**
   * General OTP verification method
   */
  static async verifyOTP(
    phoneNumber: string, 
    otp: string, 
    confirmationResult?: ConfirmationResult
  ): Promise<{ success: boolean; message: string; user?: any }> {
    if (confirmationResult) {
      return this.verifyFirebaseOTP(confirmationResult, otp);
    } else {
      return this.verifyTwilioOTP(phoneNumber, otp);
    }
  }

  /**
   * Format phone number to E.164 format
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!phoneNumber.startsWith('+')) {
      return `${countryCode}${cleaned}`;
    }
    
    return phoneNumber;
  }

  /**
   * Clean up resources
   */
  static cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.otpStorage.clear();
  }
}

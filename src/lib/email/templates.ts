export const emailTemplates = {
  verification: (name: string, otp: string, appName: string) => ({
    subject: `Verify your ${appName} account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">${appName}</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #666; line-height: 1.6;">
            Thanks for signing up! Please verify your email address to complete your registration.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #fff; padding: 20px; border-radius: 4px; display: inline-block; border: 2px dashed #007bff;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff;">${process.env.EMAIL_USER}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Hi ${name}, verify your ${appName} account with this OTP: ${otp}. This OTP will expire in 10 minutes.`,
  }),

  passwordReset: (name: string, otp: string, appName: string) => ({
    subject: `Reset your ${appName} password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">${appName}</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password. Use the OTP below to reset your password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #fff; padding: 20px; border-radius: 4px; display: inline-block; border: 2px dashed #dc3545;">
              <span style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff;">${process.env.EMAIL_USER}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Hi ${name}, reset your ${appName} password with this OTP: ${otp}. This OTP will expire in 10 minutes.`,
  }),

  welcome: (name: string, appName: string, frontendUrl: string) => ({
    subject: `Welcome to ${appName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">${appName}</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Welcome ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your account has been successfully verified. You can now access all features of ${appName}.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Get Started
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff;">${process.env.EMAIL_USER}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Welcome ${name}! Your ${appName} account has been successfully verified. Visit ${frontendUrl} to get started.`,
  }),

  notification: (title: string, message: string, appName: string) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">${appName}</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin-top: 0;">${title}</h1>
          <p style="color: #666; line-height: 1.6;">${message}</p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff;">${process.env.EMAIL_USER}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `${title}: ${message}`,
  }),
};

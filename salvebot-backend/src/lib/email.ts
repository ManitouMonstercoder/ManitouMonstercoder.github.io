import { Env } from '../types'

export class EmailService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  // Generate a 6-digit verification code
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Store verification code in KV with 10 minute expiry
  async storeVerificationCode(email: string, code: string): Promise<void> {
    const expiry = Date.now() + (10 * 60 * 1000) // 10 minutes
    await this.env.VERIFY_KV.put(email, JSON.stringify({
      code,
      expires: expiry,
      created: Date.now()
    }), {
      expirationTtl: 600 // 10 minutes in seconds
    })
  }

  // Verify code against stored value
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const stored = await this.env.VERIFY_KV.get(email)
      if (!stored) return false

      const data = JSON.parse(stored)
      
      // Check if code matches and hasn't expired
      if (data.code === code && Date.now() < data.expires) {
        // Delete the code after successful verification
        await this.env.VERIFY_KV.delete(email)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error verifying code:', error)
      return false
    }
  }

  // Send verification email using MailChannels
  async sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
    try {
      const emailData = {
        personalizations: [
          {
            to: [{ email, name }],
          },
        ],
        from: {
          email: 'noreply@salvebot.com',
          name: 'Salvebot',
        },
        subject: 'Verify your email address',
        content: [
          {
            type: 'text/html',
            value: this.getVerificationEmailTemplate(name, code),
          },
        ],
      }

      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending verification email:', error)
      return false
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    try {
      const resetUrl = `https://salvebot.com/reset-password?token=${resetToken}`
      
      const emailData = {
        personalizations: [
          {
            to: [{ email, name }],
          },
        ],
        from: {
          email: 'noreply@salvebot.com',
          name: 'Salvebot',
        },
        subject: 'Reset your password',
        content: [
          {
            type: 'text/html',
            value: this.getPasswordResetEmailTemplate(name, resetUrl),
          },
        ],
      }

      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }

  // Store password reset token with 1 hour expiry
  async storePasswordResetToken(email: string, token: string): Promise<void> {
    const expiry = Date.now() + (60 * 60 * 1000) // 1 hour
    await this.env.VERIFY_KV.put(`reset:${email}`, JSON.stringify({
      token,
      expires: expiry,
      created: Date.now()
    }), {
      expirationTtl: 3600 // 1 hour in seconds
    })
  }

  // Verify password reset token
  async verifyPasswordResetToken(token: string): Promise<string | null> {
    try {
      // Search for the token in KV (we'll need to store it with a token key too)
      const tokenData = await this.env.VERIFY_KV.get(`token:${token}`)
      if (!tokenData) return null

      const data = JSON.parse(tokenData)
      
      // Check if token hasn't expired
      if (Date.now() < data.expires) {
        return data.email
      }
      
      return null
    } catch (error) {
      console.error('Error verifying reset token:', error)
      return null
    }
  }

  // Store token with both email and token keys for easy lookup
  async storePasswordResetTokenWithLookup(email: string, token: string): Promise<void> {
    const expiry = Date.now() + (60 * 60 * 1000) // 1 hour
    const tokenData = {
      token,
      email,
      expires: expiry,
      created: Date.now()
    }

    // Store with email key for email-based lookup
    await this.env.VERIFY_KV.put(`reset:${email}`, JSON.stringify(tokenData), {
      expirationTtl: 3600 // 1 hour in seconds
    })

    // Store with token key for token-based lookup
    await this.env.VERIFY_KV.put(`token:${token}`, JSON.stringify(tokenData), {
      expirationTtl: 3600 // 1 hour in seconds
    })
  }

  // Delete password reset token after use
  async deletePasswordResetToken(email: string, token: string): Promise<void> {
    await this.env.VERIFY_KV.delete(`reset:${email}`)
    await this.env.VERIFY_KV.delete(`token:${token}`)
  }

  private getVerificationEmailTemplate(name: string, code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify your email address</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #007bff; }
        .code-box { background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 Salvebot</div>
        </div>
        
        <h1>Verify your email address</h1>
        
        <p>Hi ${name},</p>
        
        <p>Thanks for signing up for Salvebot! To complete your account setup, please verify your email address by entering the following 6-digit code:</p>
        
        <div class="code-box">
            <div class="code">${code}</div>
        </div>
        
        <p>This code will expire in 10 minutes for security reasons.</p>
        
        <p>If you didn't create a Salvebot account, you can safely ignore this email.</p>
        
        <div class="footer">
            <p>Best regards,<br>The Salvebot Team</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset your password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #007bff; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 Salvebot</div>
        </div>
        
        <h1>Reset your password</h1>
        
        <p>Hi ${name},</p>
        
        <p>You requested to reset your password for your Salvebot account. Click the button below to set a new password:</p>
        
        <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        
        <div class="footer">
            <p>Best regards,<br>The Salvebot Team</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
    `
  }
}
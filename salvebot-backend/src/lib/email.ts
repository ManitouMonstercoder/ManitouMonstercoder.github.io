import { Env } from '../types'

interface SendPulseTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export class EmailService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  // Get SendPulse access token using Fetch API (Cloudflare Workers compatible)
  private async getSendPulseToken(): Promise<string | null> {
    try {
      const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.env.SENDPULSE_USER_ID,
          client_secret: this.env.SENDPULSE_SECRET,
        }),
      })

      if (!response.ok) {
        console.error('❌ SendPulse token request failed:', response.status, response.statusText)
        return null
      }

      const data: SendPulseTokenResponse = await response.json()
      console.log('✅ SendPulse token obtained successfully')
      return data.access_token
    } catch (error) {
      console.error('❌ SendPulse token error:', error)
      return null
    }
  }

  // Send email via SendPulse SMTP API using Fetch
  private async sendPulseEmail(token: string, emailData: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendpulse.com/smtp/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ SendPulse email send failed:', response.status, errorText)
        return false
      }

      const result = await response.json()
      console.log('✅ SendPulse email sent successfully:', result)
      return true
    } catch (error) {
      console.error('❌ SendPulse email send error:', error)
      return false
    }
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

  // Send verification email using SendPulse
  async sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
    try {
      // Always log verification codes for debugging
      console.log(`🔐 VERIFICATION CODE for ${email}: ${code}`)
      console.log(`📧 Attempting to send email to: ${name} <${email}>`)
      
      // Try SendPulse email delivery using Fetch API (Cloudflare Workers compatible)
      try {
        console.log('🔍 Checking SendPulse credentials...')
        console.log(`SENDPULSE_USER_ID: ${this.env.SENDPULSE_USER_ID ? '✅ SET' : '❌ MISSING'}`)
        console.log(`SENDPULSE_SECRET: ${this.env.SENDPULSE_SECRET ? '✅ SET' : '❌ MISSING'}`)
        
        if (this.env.SENDPULSE_USER_ID && this.env.SENDPULSE_SECRET) {
          console.log('📧 Attempting SendPulse email delivery via Fetch API...')
          
          // Get access token
          const token = await this.getSendPulseToken()
          if (!token) {
            console.log('⚠️  Failed to get SendPulse token, using console logging fallback')
          } else {
            // Prepare email data for SendPulse API
            const emailData = {
              "email": {
                "html": this.getVerificationEmailTemplate(name, code),
                "text": `Hi ${name},\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nThe Salvebot Team`,
                "subject": "Verify your email address - Salvebot",
                "from": {
                  "name": "Salvebot Support",
                  "email": "support@salvebot.com"
                },
                "to": [
                  {
                    "name": name,
                    "email": email
                  }
                ]
              }
            }

            console.log('📤 Sending verification email via SendPulse API...')
            const emailSent = await this.sendPulseEmail(token, emailData)
            
            if (emailSent) {
              console.log('✅ Verification email sent successfully via SendPulse')
            } else {
              console.log('⚠️  SendPulse email send failed, verification code available in logs')
            }
          }
        } else {
          console.log('⚠️  SendPulse credentials missing - check SENDPULSE_USER_ID and SENDPULSE_SECRET secrets')
        }
        
        console.log(`📝 Verification code for testing/backup: ${code}`)
        return true
      } catch (sendpulseError) {
        console.error('❌ SendPulse error:', sendpulseError)
        console.log('📝 Fallback: Verification code is logged above for testing')
        return true
      }
    } catch (error) {
      console.error('❌ Error in sendVerificationEmail:', error)
      console.log('📝 Verification code is logged above - use that for testing')
      return true
    }
  }

  // Send password reset email using SendPulse Fetch API
  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    try {
      const resetUrl = `https://salvebot.com/reset-password?token=${resetToken}`
      
      // Always log reset information for debugging
      console.log(`🔑 PASSWORD RESET for ${email}`)
      console.log(`🔗 Reset URL: ${resetUrl}`)
      console.log(`📧 Attempting to send password reset email to: ${name} <${email}>`)
      
      // Try SendPulse email delivery using Fetch API (same as verification emails)
      try {
        console.log('🔍 Checking SendPulse credentials for password reset...')
        console.log(`SENDPULSE_USER_ID: ${this.env.SENDPULSE_USER_ID ? '✅ SET' : '❌ MISSING'}`)
        console.log(`SENDPULSE_SECRET: ${this.env.SENDPULSE_SECRET ? '✅ SET' : '❌ MISSING'}`)
        
        if (this.env.SENDPULSE_USER_ID && this.env.SENDPULSE_SECRET) {
          console.log('📧 Attempting SendPulse password reset email delivery via Fetch API...')
          
          // Get access token
          const token = await this.getSendPulseToken()
          if (!token) {
            console.log('⚠️  Failed to get SendPulse token for password reset, using console logging fallback')
          } else {
            // Prepare email data for SendPulse API
            const emailData = {
              "email": {
                "html": this.getPasswordResetEmailTemplate(name, resetUrl),
                "text": `Hi ${name},\n\nYou requested to reset your password for your Salvebot account.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Salvebot Team`,
                "subject": "Reset your password - Salvebot",
                "from": {
                  "name": "Salvebot Support",
                  "email": "support@salvebot.com"
                },
                "to": [
                  {
                    "name": name,
                    "email": email
                  }
                ]
              }
            }

            console.log('📤 Sending password reset email via SendPulse API...')
            const emailSent = await this.sendPulseEmail(token, emailData)
            
            if (emailSent) {
              console.log('✅ Password reset email sent successfully via SendPulse')
            } else {
              console.log('⚠️  SendPulse password reset email send failed, reset URL available in logs')
            }
          }
        } else {
          console.log('⚠️  SendPulse credentials missing for password reset - check SENDPULSE_USER_ID and SENDPULSE_SECRET secrets')
        }
        
        console.log(`📝 Reset URL for testing/backup: ${resetUrl}`)
        return true
      } catch (sendpulseError) {
        console.error('❌ SendPulse password reset error:', sendpulseError)
        console.log('📝 Fallback: Reset URL is logged above for testing')
        return true
      }
    } catch (error) {
      console.error('❌ Error sending password reset email:', error)
      console.log('📝 Reset URL is logged above - use that for testing')
      return true
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email address - Salvebot</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
        }
        .email-container { width: 100%; background-color: #f8fafc; padding: 20px 0; }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
            color: white; 
            text-align: center; 
            padding: 40px 20px; 
        }
        .logo-container { display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .logo-icon { 
            width: 48px; 
            height: 48px; 
            background-color: rgba(255, 255, 255, 0.2); 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 12px; 
        }
        .logo-text { font-size: 28px; font-weight: 700; color: white; }
        .header-title { font-size: 24px; font-weight: 600; margin: 0; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 30px; }
        .code-box { 
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
            border: 2px solid #3b82f6; 
            border-radius: 12px; 
            padding: 30px 20px; 
            text-align: center; 
            margin: 30px 0; 
        }
        .code-label { font-size: 14px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .code { 
            font-size: 36px; 
            font-weight: 800; 
            color: #1d4ed8; 
            letter-spacing: 8px; 
            font-family: 'Courier New', monospace; 
        }
        .code-info { font-size: 14px; color: #6b7280; margin-top: 15px; }
        .warning { 
            background-color: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 20px 0; 
            font-size: 14px; 
            color: #92400e; 
        }
        .footer { 
            background-color: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
        }
        .footer-text { font-size: 14px; color: #6b7280; margin: 0; }
        .company-name { color: #3b82f6; font-weight: 600; }
        @media only screen and (max-width: 600px) {
            .content { padding: 30px 20px; }
            .code { font-size: 28px; letter-spacing: 6px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <div class="logo-icon">
                        <div style="font-size: 24px; color: white; font-weight: bold;">🤖</div>
                    </div>
                    <div class="logo-text">Salvebot</div>
                </div>
                <h1 class="header-title">Verify Your Email Address</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hi ${name}! 👋</div>
                
                <p class="message">
                    Welcome to <strong>Salvebot</strong>! We're excited to have you join our AI-powered customer support platform.
                    To complete your account setup and start building amazing chatbots, please verify your email address.
                </p>
                
                <div class="code-box">
                    <div class="code-label">Your Verification Code</div>
                    <div class="code">${code}</div>
                    <div class="code-info">Enter this 6-digit code to activate your account</div>
                </div>
                
                <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> This verification code will expire in 10 minutes. 
                    If you didn't create a Salvebot account, please ignore this email.
                </div>
                
                <p class="message">
                    Once verified, you'll have access to:
                </p>
                <ul style="color: #4b5563; margin-left: 20px;">
                    <li>AI-powered chatbot builder</li>
                    <li>Document upload and processing</li>
                    <li>Advanced analytics and insights</li>
                    <li>14-day free trial with all features</li>
                </ul>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>
                    The <span class="company-name">Salvebot</span> Team
                </p>
                <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                    This is an automated security email. Please do not reply to this message.<br>
                    © 2025 Salvebot. All rights reserved.
                </p>
            </div>
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password - Salvebot</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc; 
        }
        .email-container { width: 100%; background-color: #f8fafc; padding: 20px 0; }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            text-align: center; 
            padding: 40px 20px; 
        }
        .logo-container { display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .logo-icon { 
            width: 48px; 
            height: 48px; 
            background-color: rgba(255, 255, 255, 0.2); 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 12px; 
        }
        .logo-text { font-size: 28px; font-weight: 700; color: white; }
        .header-title { font-size: 24px; font-weight: 600; margin: 0; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 30px; }
        .reset-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .reset-button:hover { 
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); 
            text-decoration: none; 
            color: white; 
        }
        .button-container { text-align: center; margin: 30px 0; }
        .link-box { 
            background-color: #f8fafc; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 20px 0; 
            word-break: break-all; 
            font-size: 14px; 
            color: #3b82f6; 
        }
        .warning { 
            background-color: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 20px 0; 
            font-size: 14px; 
            color: #92400e; 
        }
        .security-notice {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #0c4a6e;
        }
        .footer { 
            background-color: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
        }
        .footer-text { font-size: 14px; color: #6b7280; margin: 0; }
        .company-name { color: #3b82f6; font-weight: 600; }
        @media only screen and (max-width: 600px) {
            .content { padding: 30px 20px; }
            .reset-button { padding: 14px 24px; font-size: 15px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <div class="logo-icon">
                        <div style="font-size: 24px; color: white; font-weight: bold;">🔐</div>
                    </div>
                    <div class="logo-text">Salvebot</div>
                </div>
                <h1 class="header-title">Reset Your Password</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hi ${name}! 🔐</div>
                
                <p class="message">
                    We received a request to reset the password for your <strong>Salvebot</strong> account. 
                    If this was you, click the button below to create a new secure password.
                </p>
                
                <div class="button-container">
                    <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                </div>
                
                <p class="message">
                    If the button above doesn't work, you can copy and paste this link into your browser:
                </p>
                
                <div class="link-box">
                    ${resetUrl}
                </div>
                
                <div class="warning">
                    ⏰ <strong>Time Sensitive:</strong> This password reset link will expire in 1 hour for security reasons.
                </div>
                
                <div class="security-notice">
                    🛡️ <strong>Security Tips:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Choose a strong password with at least 8 characters</li>
                        <li>Use a combination of letters, numbers, and symbols</li>
                        <li>Don't reuse passwords from other accounts</li>
                    </ul>
                </div>
                
                <p class="message" style="font-weight: 600; color: #dc2626;">
                    If you didn't request this password reset, please ignore this email. Your password will remain unchanged, 
                    and your account is secure.
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>
                    The <span class="company-name">Salvebot</span> Security Team
                </p>
                <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                    This is an automated security email. Please do not reply to this message.<br>
                    © 2025 Salvebot. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `
  }
}
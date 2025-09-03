import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Env, User } from '../types'
import { AuthService } from '../lib/auth'
import { StripeService } from '../lib/stripe'
import { SecurityValidator } from '../lib/security'
import { EmailService } from '../lib/email'
import { generateId, validateEmail, jsonResponse, errorResponse } from '../lib/utils'

const authRouter = new Hono<{ Bindings: Env }>()

// Strong password validation regex
const strongPasswordSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "Password must contain at least one number")
  .regex(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, "Password must contain at least one special character")
  .regex(/^[^\s]*$/, "Password cannot contain spaces")

// Full name validation - requires at least first and last name
const fullNameSchema = z.string()
  .min(3, "Full name must be at least 3 characters")
  .max(100, "Full name cannot exceed 100 characters")
  .regex(/^[a-zA-Z]+(\s+[a-zA-Z]+)+$/, "Please enter your full name (first and last name required)")

const signupSchema = z.object({
  name: fullNameSchema,
  email: z.string().email(),
  password: strongPasswordSchema,
  company: z.string().optional()
})

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
})

const passwordResetRequestSchema = z.object({
  email: z.string().email()
})

const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: strongPasswordSchema
})

const resendVerificationSchema = z.object({
  email: z.string().email()
})

authRouter.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { name, email, password, company } = c.req.valid('json')
  
  try {
    // Check if user already exists
    const existingUser = await c.env.USERS.get(email)
    if (existingUser) {
      return c.json({
        success: false,
        message: 'That email already has an account. Please log in instead.'
      }, 409)
    }

    // Hash password
    const authService = new AuthService(c.env.JWT_SECRET)
    const hashedPassword = await authService.hashPassword(password)
    
    // Generate user ID and get Stripe service
    const userId = generateId()
    const stripeService = new StripeService(c.env.STRIPE_SECRET_KEY)
    
    // Create Stripe customer
    const stripeCustomerId = await stripeService.createCustomer({
      id: userId,
      email,
      name,
      company
    } as any)

    // Create user object (initially unverified)
    const now = new Date().toISOString()
    const user: User = {
      id: userId,
      email,
      name,
      company,
      hashedPassword,
      stripeCustomerId,
      subscriptionStatus: 'trial',
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      isNewUser: true,
      loginCount: 0,
      securityScore: 85,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      isEmailVerified: false,
      emailVerifiedAt: null
    }

    // Save user to KV
    await c.env.USERS.put(email, JSON.stringify(user))

    // Generate and send verification code
    const emailService = new EmailService(c.env)
    const verificationCode = emailService.generateVerificationCode()
    
    await emailService.storeVerificationCode(email, verificationCode)
    const emailSent = await emailService.sendVerificationEmail(email, verificationCode, name)

    if (!emailSent) {
      console.error('Failed to send verification email')
      // Don't fail the signup, user can request resend
    }

    return c.json({
      success: true,
      message: 'Account created successfully. Please check your email for the verification code.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate,
        isNewUser: user.isNewUser,
        securityScore: user.securityScore,
        isEmailVerified: user.isEmailVerified
      },
      requiresVerification: true
    }, 201)
  } catch (error) {
    console.error('Signup error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return c.json({ 
      success: false,
      message: 'Failed to create account'
    }, 500)
  }
})

// Email verification endpoint
authRouter.post('/verify-email', zValidator('json', emailVerificationSchema), async (c) => {
  const { email, code } = c.req.valid('json')
  
  try {
    // Check if user exists
    const userData = await c.env.USERS.get(email)
    if (!userData) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }

    const user: User = JSON.parse(userData)
    
    // Check if already verified
    if (user.isEmailVerified) {
      return c.json({
        success: true,
        message: 'Email is already verified'
      })
    }

    // Verify the code
    const emailService = new EmailService(c.env)
    const isValidCode = await emailService.verifyCode(email, code)
    
    if (!isValidCode) {
      return c.json({
        success: false,
        message: 'Invalid or expired verification code'
      }, 400)
    }

    // Update user as verified
    const now = new Date().toISOString()
    user.isEmailVerified = true
    user.emailVerifiedAt = now
    user.updatedAt = now

    // Save updated user
    await c.env.USERS.put(email, JSON.stringify(user))

    // Generate JWT token for immediate login
    const authService = new AuthService(c.env.JWT_SECRET)
    const token = await authService.generateToken({ id: user.id, email: user.email })

    return c.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate,
        isNewUser: user.isNewUser,
        securityScore: user.securityScore,
        isEmailVerified: user.isEmailVerified
      },
      token
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return c.json({
      success: false,
      message: 'Failed to verify email'
    }, 500)
  }
})

// Resend verification code endpoint
authRouter.post('/resend-verification', zValidator('json', resendVerificationSchema), async (c) => {
  const { email } = c.req.valid('json')
  
  try {
    // Check if user exists
    const userData = await c.env.USERS.get(email)
    if (!userData) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }

    const user: User = JSON.parse(userData)
    
    // Check if already verified
    if (user.isEmailVerified) {
      return c.json({
        success: false,
        message: 'Email is already verified'
      }, 400)
    }

    // Generate and send new verification code
    const emailService = new EmailService(c.env)
    const verificationCode = emailService.generateVerificationCode()
    
    await emailService.storeVerificationCode(email, verificationCode)
    const emailSent = await emailService.sendVerificationEmail(email, verificationCode, user.name)

    if (!emailSent) {
      console.error('Failed to resend verification email')
      return c.json({
        success: false,
        message: 'Failed to send verification email'
      }, 500)
    }

    return c.json({
      success: true,
      message: 'Verification code sent successfully'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return c.json({
      success: false,
      message: 'Failed to resend verification code'
    }, 500)
  }
})

authRouter.post('/signin', zValidator('json', signinSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  
  try {
    const authService = new AuthService(c.env.JWT_SECRET)
    // Get user
    const userData = await c.env.USERS.get(email)
    if (!userData) {
      return c.json({
        success: false,
        message: "You don't have an account. Please create a free account to get started.",
        requiresSignup: true
      }, 404)
    }

    const user: User = JSON.parse(userData)
    
    // Check if account is locked
    if (user.accountLockedUntil) {
      const lockExpiry = new Date(user.accountLockedUntil)
      if (new Date() < lockExpiry) {
        const minutesLeft = Math.ceil((lockExpiry.getTime() - Date.now()) / (1000 * 60))
        return c.json({
          success: false,
          message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes or reset your password.`
        }, 429)
      } else {
        // Lock expired, reset failed attempts
        user.accountLockedUntil = undefined
        user.failedLoginAttempts = 0
      }
    }
    
    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.hashedPassword)
    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1
      user.failedLoginAttempts = failedAttempts
      user.lastFailedLogin = new Date().toISOString()
      
      // Lock account after 5 failed attempts for 30 minutes
      if (failedAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        await c.env.USERS.put(email, JSON.stringify(user))
        return c.json({
          success: false,
          message: 'Account locked due to multiple failed login attempts. Please try again in 30 minutes or reset your password.'
        }, 429)
      }
      
      await c.env.USERS.put(email, JSON.stringify(user))
      return c.json({
        success: false,
        message: `Invalid credentials. ${5 - failedAttempts} attempts remaining before account lockout.`
      }, 401)
    }

    // SECURITY: Check if email is verified before allowing login
    if (!user.isEmailVerified) {
      return c.json({
        success: false,
        message: 'Please verify your email address before signing in. Check your inbox for the verification code.',
        requiresVerification: true,
        email: user.email
      }, 403)
    }

    // Update user login tracking and reset security fields
    const now = new Date().toISOString()
    user.lastLoginAt = now
    user.updatedAt = now
    user.loginCount = (user.loginCount || 0) + 1
    user.isNewUser = false // Mark as returning user after first login
    user.failedLoginAttempts = 0 // Reset failed attempts on successful login
    user.lastFailedLogin = undefined
    user.accountLockedUntil = undefined
    
    // Save updated user
    await c.env.USERS.put(email, JSON.stringify(user))

    // Generate token
    const token = await authService.generateToken({ id: user.id, email: user.email })

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate,
        isNewUser: user.isNewUser,
        loginCount: user.loginCount,
        lastLoginAt: user.lastLoginAt,
        securityScore: user.securityScore
      },
      token
    })
  } catch (error) {
    console.error('Signin error:', error)
    return c.json({
      success: false,
      message: 'Failed to sign in'
    }, 500)
  }
})

authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  const authService = new AuthService(c.env.JWT_SECRET)
  
  const token = authService.extractBearerToken(authHeader)
  if (!token) {
    return errorResponse('Missing authorization token', 401)
  }

  const payload = await authService.verifyToken(token)
  if (!payload) {
    return errorResponse('Invalid token', 401)
  }

  try {
    const userData = await c.env.USERS.get(payload.email)
    if (!userData) {
      return errorResponse('User not found', 404)
    }

    const user: User = JSON.parse(userData)
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate,
        isNewUser: user.isNewUser,
        loginCount: user.loginCount,
        lastLoginAt: user.lastLoginAt,
        securityScore: user.securityScore
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return errorResponse('Failed to get user', 500)
  }
})

// Request password reset
authRouter.post('/request-password-reset', zValidator('json', passwordResetRequestSchema), async (c) => {
  const { email } = c.req.valid('json')
  
  try {
    // Check if user exists
    const userData = await c.env.USERS.get(email)
    
    if (!userData) {
      // User doesn't exist - redirect to signup instead of hiding this info
      return c.json({
        success: false,
        message: 'No account found with this email address. Please create a free account to get started.',
        requiresSignup: true
      }, 404)
    }

    const user: User = JSON.parse(userData)

    // Check rate limiting - max 2 password reset attempts per hour
    const rateLimitKey = `password_reset_${email}`
    const existingAttempts = await c.env.VERIFY_KV.get(rateLimitKey)
    
    if (existingAttempts) {
      const attempts = JSON.parse(existingAttempts)
      if (attempts.count >= 2) {
        const timeLeft = Math.ceil((new Date(attempts.expires).getTime() - Date.now()) / (1000 * 60))
        return c.json({
          success: false,
          message: `Too many password reset attempts. Please contact support or try again in ${timeLeft} minutes.`,
          contactSupport: true
        }, 429)
      }
      // Increment attempt count
      attempts.count += 1
      await c.env.VERIFY_KV.put(rateLimitKey, JSON.stringify(attempts), { expirationTtl: 3600 })
    } else {
      // First attempt
      const rateLimit = {
        count: 1,
        expires: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }
      await c.env.VERIFY_KV.put(rateLimitKey, JSON.stringify(rateLimit), { expirationTtl: 3600 })
    }
    
    // Generate secure reset token
    const resetToken = crypto.randomUUID()
    
    // Store reset token
    const emailService = new EmailService(c.env)
    await emailService.storePasswordResetTokenWithLookup(email, resetToken)
    
    // Send reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, user.name)
    
    if (!emailSent) {
      return c.json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      }, 500)
    }
    
    return c.json({
      success: true,
      message: 'Password reset link sent to your email address. Please check your inbox.'
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return c.json({
      success: false,
      message: 'Failed to process password reset request. Please try again.'
    }, 500)
  }
})

// Reset password with token
authRouter.post('/reset-password', zValidator('json', passwordResetSchema), async (c) => {
  const { token, newPassword } = c.req.valid('json')
  
  try {
    // Verify reset token and get email
    const emailService = new EmailService(c.env)
    const email = await emailService.verifyPasswordResetToken(token)
    
    if (!email) {
      return c.json({
        success: false,
        message: 'Invalid or expired reset token'
      }, 400)
    }

    // Get user
    const userData = await c.env.USERS.get(email)
    if (!userData) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }

    const user: User = JSON.parse(userData)
    
    // Check if new password is same as current password
    const authService = new AuthService(c.env.JWT_SECRET)
    const isSamePassword = await authService.verifyPassword(newPassword, user.hashedPassword)
    
    if (isSamePassword) {
      return c.json({
        success: false,
        message: 'New password cannot be the same as your current password. Please choose a different password.'
      }, 400)
    }

    // Check against password history (last 5 passwords)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPassword of user.passwordHistory) {
        const isOldPassword = await authService.verifyPassword(newPassword, oldPassword)
        if (isOldPassword) {
          return c.json({
            success: false,
            message: 'You cannot reuse a previous password. Please choose a new password you have not used before.'
          }, 400)
        }
      }
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(newPassword)
    
    // Update password history (keep last 5 passwords)
    const passwordHistory = user.passwordHistory || []
    passwordHistory.unshift(user.hashedPassword) // Add current password to history
    if (passwordHistory.length > 5) {
      passwordHistory.pop() // Keep only last 5 passwords
    }
    
    // Update user with new password and reset security fields
    const now = new Date().toISOString()
    user.hashedPassword = hashedPassword
    user.passwordHistory = passwordHistory
    user.updatedAt = now
    user.failedLoginAttempts = 0 // Reset failed attempts
    user.lastFailedLogin = undefined
    user.accountLockedUntil = undefined

    // Save updated user
    await c.env.USERS.put(email, JSON.stringify(user))
    
    // Delete the reset token
    await emailService.deletePasswordResetToken(email, token)

    return c.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return c.json({
      success: false,
      message: 'Failed to reset password'
    }, 500)
  }
})

// Test endpoint to get verification code (for development/testing only)
authRouter.get('/test-verification-code/:email', async (c) => {
  try {
    const email = c.req.param('email')
    const stored = await c.env.VERIFY_KV.get(email)
    
    if (!stored) {
      return c.json({
        success: false,
        message: 'No verification code found for this email'
      }, 404)
    }

    const data = JSON.parse(stored)
    return c.json({
      success: true,
      email: email,
      code: data.code,
      created: new Date(data.created).toISOString(),
      expires: new Date(data.expires).toISOString()
    })
  } catch (error) {
    console.error('Test verification code error:', error)
    return c.json({
      success: false,
      message: 'Failed to retrieve verification code'
    }, 500)
  }
})

// Test endpoint to check SendPulse configuration (for debugging)
authRouter.get('/test-sendpulse-config', async (c) => {
  try {
    return c.json({
      success: true,
      credentials: {
        sendpulseUserId: c.env.SENDPULSE_USER_ID ? 'SET' : 'MISSING',
        sendpulseSecret: c.env.SENDPULSE_SECRET ? 'SET' : 'MISSING',
        environment: c.env.ENVIRONMENT || 'unknown'
      }
    })
  } catch (error) {
    console.error('Test SendPulse config error:', error)
    return c.json({
      success: false,
      message: 'Failed to check SendPulse config'
    }, 500)
  }
})

export { authRouter }
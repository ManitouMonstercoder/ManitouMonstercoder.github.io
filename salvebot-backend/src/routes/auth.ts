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

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
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
  newPassword: z.string().min(8)
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
    console.error('Signup error:', error)
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
  
  const authService = new AuthService(c.env.JWT_SECRET)
  
  try {
    // Get user
    const userData = await c.env.USERS.get(email)
    if (!userData) {
      return errorResponse('Invalid credentials', 401)
    }

    const user: User = JSON.parse(userData)
    
    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.hashedPassword)
    if (!isValidPassword) {
      return errorResponse('Invalid credentials', 401)
    }

    // Update user login tracking
    const now = new Date().toISOString()
    user.lastLoginAt = now
    user.updatedAt = now
    user.loginCount = (user.loginCount || 0) + 1
    user.isNewUser = false // Mark as returning user after first login
    
    // Save updated user
    await c.env.USERS.put(email, JSON.stringify(user))

    // Generate token
    const token = await authService.generateToken({ id: user.id, email: user.email })

    return jsonResponse({
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
    return errorResponse('Failed to sign in', 500)
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
    
    return jsonResponse({
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
    // Check if user exists (but don't reveal this information in response)
    const userData = await c.env.USERS.get(email)
    
    if (userData) {
      const user: User = JSON.parse(userData)
      
      // Generate secure reset token
      const resetToken = crypto.randomUUID()
      
      // Store reset token
      const emailService = new EmailService(c.env)
      await emailService.storePasswordResetTokenWithLookup(email, resetToken)
      
      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken, user.name)
    }
    
    // Always return the same response for security (don't reveal if email exists)
    return c.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return c.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
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
    
    // Hash new password
    const authService = new AuthService(c.env.JWT_SECRET)
    const hashedPassword = await authService.hashPassword(newPassword)
    
    // Update user with new password
    const now = new Date().toISOString()
    user.hashedPassword = hashedPassword
    user.updatedAt = now

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

export { authRouter }
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Env, User } from '../types'
import { AuthService } from '../lib/auth'
import { StripeService } from '../lib/stripe'
import { SecurityValidator } from '../lib/security'
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

authRouter.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { name, email, password, company } = c.req.valid('json')
  
  // Enhanced security validation
  const emailValidation = SecurityValidator.validateEmail(email)
  if (!emailValidation.valid) {
    return errorResponse(emailValidation.reason!, 400)
  }

  const nameValidation = SecurityValidator.validateName(name)
  if (!nameValidation.valid) {
    return errorResponse(nameValidation.reason!, 400)
  }

  const passwordValidation = SecurityValidator.validatePassword(password)
  if (!passwordValidation.valid) {
    return errorResponse(passwordValidation.reason!, 400)
  }

  const authService = new AuthService(c.env.JWT_SECRET)
  
  // Check if user already exists
  const existingUser = await c.env.USERS.get(email)
  if (existingUser) {
    return errorResponse('An account with this email already exists. Please sign in instead.', 409)
  }

  try {
    // Hash password
    const hashedPassword = await authService.hashPassword(password)
    
    // Create user
    const userId = generateId()
    const now = new Date().toISOString()
    
    // Generate security score
    const securityScore = SecurityValidator.generateSecurityScore(email, name)
    
    const user: User = {
      id: userId,
      email,
      name,
      company,
      hashedPassword,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now, // First login
      subscriptionStatus: 'trial',
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      securityScore,
      isNewUser: true,
      loginCount: 1
    }

    // Create Stripe customer
    const stripeService = new StripeService(c.env.STRIPE_SECRET_KEY)
    const customerId = await stripeService.createCustomer(user)
    user.stripeCustomerId = customerId

    // Store user
    await c.env.USERS.put(email, JSON.stringify(user))
    await c.env.USERS.put(`id:${userId}`, email) // ID to email mapping

    // Generate token
    const token = await authService.generateToken({ id: userId, email })

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate
      },
      token
    }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return errorResponse('Failed to create account', 500)
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

export { authRouter }
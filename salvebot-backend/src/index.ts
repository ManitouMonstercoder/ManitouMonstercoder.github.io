import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Env } from './types'
import { authRouter } from './routes/auth'
import { chatbotsRouter } from './routes/chatbots'
import { chatRouter } from './routes/chat'
import { documentsRouter } from './routes/documents'
import { domainsRouter } from './routes/domains'
import { corsHeaders, jsonResponse, errorResponse } from './lib/utils'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      c.env.CORS_ORIGIN,
      'https://salvebot.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean)
    
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))

// Health check
app.get('/', (c) => {
  return jsonResponse({
    name: 'Salvebot API',
    version: '1.0.0',
    status: 'operational',
    environment: c.env.ENVIRONMENT || 'development'
  })
})

// API Routes
app.route('/api/auth', authRouter)
app.route('/api/chatbots', chatbotsRouter)
app.route('/api/chat', chatRouter)
app.route('/api/documents', documentsRouter)
app.route('/api/domains', domainsRouter)

// Stripe webhooks
app.post('/api/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature')
  if (!signature) {
    return errorResponse('Missing stripe signature', 400)
  }

  try {
    const body = await c.req.text()
    const { StripeService } = await import('./lib/stripe')
    const stripeService = new StripeService(c.env.STRIPE_SECRET_KEY)
    
    const event = await stripeService.constructWebhookEvent(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    )

    const result = await stripeService.handleWebhookEvent(event)
    
    // Update user subscription status
    if (result.userId && result.action === 'subscription_updated') {
      const userEmail = await c.env.USERS.get(`id:${result.userId}`)
      if (userEmail) {
        const userData = await c.env.USERS.get(userEmail)
        if (userData) {
          const user = JSON.parse(userData)
          user.subscriptionStatus = result.data.status === 'active' ? 'active' : 'inactive'
          user.updatedAt = new Date().toISOString()
          await c.env.USERS.put(userEmail, JSON.stringify(user))
        }
      }
    }

    return jsonResponse({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return errorResponse('Webhook processing failed', 400)
  }
})


// Billing endpoints
app.post('/api/billing/create-checkout', async (c) => {
  // TODO: Implement Stripe checkout session creation
  return errorResponse('Billing not implemented yet', 501)
})

app.post('/api/billing/create-portal', async (c) => {
  // TODO: Implement Stripe customer portal
  return errorResponse('Billing portal not implemented yet', 501)
})

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return errorResponse('Internal server error', 500)
})

// 404 handler
app.notFound((c) => {
  return errorResponse('Not found', 404)
})

// Export Durable Objects
export { ChatSession } from './durable-objects/ChatSession'

export default app



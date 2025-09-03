import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Env, Chatbot, User } from '../types'
import { AuthService } from '../lib/auth'
import { generateId, validateDomain, generateEmbedCode, jsonResponse, errorResponse } from '../lib/utils'

const chatbotsRouter = new Hono<{ Bindings: Env }>()

const createChatbotSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().min(1),
  welcomeMessage: z.string().optional(),
  theme: z.string().optional(),
  position: z.string().optional()
})

const updateChatbotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  welcomeMessage: z.string().optional(),
  theme: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional()
})

// Middleware to authenticate and get user
async function authenticateUser(c: any): Promise<User | null> {
  const authHeader = c.req.header('Authorization')
  const authService = new AuthService(c.env.JWT_SECRET)
  
  const token = authService.extractBearerToken(authHeader)
  if (!token) return null

  const payload = await authService.verifyToken(token)
  if (!payload) return null

  const userData = await c.env.USERS.get(payload.email)
  if (!userData) return null

  return JSON.parse(userData)
}

chatbotsRouter.get('/', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    // Get all chatbots for this user
    const chatbotsList = await c.env.CHATBOTS.list({ prefix: `user:${user.id}:` })
    const chatbots: Chatbot[] = []

    for (const key of chatbotsList.keys) {
      const chatbotData = await c.env.CHATBOTS.get(key.name)
      if (chatbotData) {
        chatbots.push(JSON.parse(chatbotData))
      }
    }

    return jsonResponse({ chatbots })
  } catch (error) {
    console.error('Get chatbots error:', error)
    return errorResponse('Failed to get chatbots', 500)
  }
})

chatbotsRouter.post('/', zValidator('json', createChatbotSchema), async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  // Check subscription limits
  if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trial') {
    return errorResponse('Active subscription required', 403)
  }

  const { name, domain, welcomeMessage, theme, position } = c.req.valid('json')
  
  if (!validateDomain(domain)) {
    return errorResponse('Invalid domain format', 400)
  }

  try {
    const chatbotId = generateId()
    const now = new Date().toISOString()
    
    const chatbot: Chatbot = {
      id: chatbotId,
      userId: user.id,
      name,
      domain,
      isActive: true, // Allow immediate testing, can be disabled later if needed
      isVerified: false,
      embedCode: generateEmbedCode(chatbotId, domain),
      createdAt: now,
      updatedAt: now,
      settings: {
        welcomeMessage: welcomeMessage || 'Hello! How can I help you today?',
        theme: theme || 'light',
        position: position || 'bottom-right'
      },
      stats: {
        conversationsCount: 0,
        documentsCount: 0
      }
    }

    // Store chatbot
    await c.env.CHATBOTS.put(`user:${user.id}:${chatbotId}`, JSON.stringify(chatbot))
    await c.env.CHATBOTS.put(`id:${chatbotId}`, `user:${user.id}:${chatbotId}`) // ID mapping

    return jsonResponse({ chatbot }, 201)
  } catch (error) {
    console.error('Create chatbot error:', error)
    return errorResponse('Failed to create chatbot', 500)
  }
})

chatbotsRouter.get('/:id', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const chatbotId = c.req.param('id')
  
  try {
    const chatbotData = await c.env.CHATBOTS.get(`user:${user.id}:${chatbotId}`)
    if (!chatbotData) {
      return errorResponse('Chatbot not found', 404)
    }

    const chatbot: Chatbot = JSON.parse(chatbotData)
    return jsonResponse({ chatbot })
  } catch (error) {
    console.error('Get chatbot error:', error)
    return errorResponse('Failed to get chatbot', 500)
  }
})

chatbotsRouter.put('/:id', zValidator('json', updateChatbotSchema), async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const chatbotId = c.req.param('id')
  const updates = c.req.valid('json')
  
  try {
    const chatbotData = await c.env.CHATBOTS.get(`user:${user.id}:${chatbotId}`)
    if (!chatbotData) {
      return errorResponse('Chatbot not found', 404)
    }

    const chatbot: Chatbot = JSON.parse(chatbotData)
    
    // Update fields
    if (updates.name) chatbot.name = updates.name
    if (updates.isActive !== undefined) chatbot.isActive = updates.isActive
    if (updates.welcomeMessage) chatbot.settings.welcomeMessage = updates.welcomeMessage
    if (updates.theme) chatbot.settings.theme = updates.theme
    if (updates.position) chatbot.settings.position = updates.position
    
    chatbot.updatedAt = new Date().toISOString()

    // Store updated chatbot
    await c.env.CHATBOTS.put(`user:${user.id}:${chatbotId}`, JSON.stringify(chatbot))

    return jsonResponse({ chatbot })
  } catch (error) {
    console.error('Update chatbot error:', error)
    return errorResponse('Failed to update chatbot', 500)
  }
})

chatbotsRouter.delete('/:id', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const chatbotId = c.req.param('id')
  
  try {
    const chatbotData = await c.env.CHATBOTS.get(`user:${user.id}:${chatbotId}`)
    if (!chatbotData) {
      return errorResponse('Chatbot not found', 404)
    }

    // Delete chatbot and related data
    await c.env.CHATBOTS.delete(`user:${user.id}:${chatbotId}`)
    await c.env.CHATBOTS.delete(`id:${chatbotId}`)
    
    // Delete related documents
    try {
      const documentsList = await c.env.DOCUMENTS.list({ prefix: `chatbot:${chatbotId}:doc:` })
      
      for (const key of documentsList.keys) {
        const docRefPath = await c.env.DOCUMENTS.get(key.name)
        if (docRefPath) {
          const documentData = await c.env.DOCUMENTS.get(docRefPath)
          if (documentData) {
            const document = JSON.parse(documentData)
            
            // Delete chunks
            for (const chunk of document.chunks || []) {
              await c.env.DOCUMENTS.delete(`chunk:${chunk.id}`)
            }
            
            // Delete document file from R2
            await c.env.FILES_BUCKET.delete(`documents/${document.id}`)
            
            // Delete document record
            await c.env.DOCUMENTS.delete(docRefPath)
          }
        }
        
        // Delete document reference
        await c.env.DOCUMENTS.delete(key.name)
      }
    } catch (error) {
      console.error('Error deleting chatbot documents:', error)
    }

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Delete chatbot error:', error)
    return errorResponse('Failed to delete chatbot', 500)
  }
})

export { chatbotsRouter }
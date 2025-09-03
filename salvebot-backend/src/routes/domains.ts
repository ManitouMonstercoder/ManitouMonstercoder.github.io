import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Env, Chatbot } from '../types'
import { authMiddleware } from '../lib/auth'
import { generateId, jsonResponse, errorResponse } from '../lib/utils'

const domainsRouter = new Hono<{ Bindings: Env }>()

const startVerificationSchema = z.object({
  chatbotId: z.string().min(1),
  method: z.enum(['dns', 'file'])
})

const verifyDomainSchema = z.object({
  chatbotId: z.string().min(1)
})

// Get domain verification status for a chatbot
domainsRouter.get('/chatbot/:chatbotId', authMiddleware, async (c) => {
  const chatbotId = c.req.param('chatbotId')
  const userId = c.get('userId')

  try {
    // Get chatbot to verify ownership
    const chatbotData = await c.env.CHATBOTS.get(`user:${userId}:${chatbotId}`)
    if (!chatbotData) {
      return errorResponse('Chatbot not found', 404)
    }

    const chatbot: Chatbot = JSON.parse(chatbotData)

    // Get domain verification data
    const verificationKey = `domain_verification:${chatbotId}`
    const verificationData = await c.env.CHATBOTS.get(verificationKey)

    let verification = null
    if (verificationData) {
      verification = JSON.parse(verificationData)
    }

    return jsonResponse({
      domain: chatbot.domain,
      isVerified: chatbot.isVerified,
      verification: verification || {
        method: null,
        token: null,
        dnsRecord: null,
        fileName: null,
        fileContent: null,
        status: 'pending'
      }
    })
  } catch (error) {
    console.error('Get domain verification error:', error)
    return errorResponse('Failed to get domain verification status', 500)
  }
})

// Start domain verification process
domainsRouter.post('/verify', authMiddleware, zValidator('json', startVerificationSchema), async (c) => {
  const { chatbotId, method } = c.req.valid('json')
  const userId = c.get('userId')

  try {
    // Get chatbot to verify ownership
    const chatbotData = await c.env.CHATBOTS.get(`user:${userId}:${chatbotId}`)
    if (!chatbotData) {
      return errorResponse('Chatbot not found', 404)
    }

    const chatbot: Chatbot = JSON.parse(chatbotData)

    // Generate verification token
    const verificationToken = generateId(32)

    // Create verification data based on method
    let verification
    if (method === 'dns') {
      verification = {
        method: 'dns',
        token: verificationToken,
        dnsRecord: {
          type: 'TXT',
          name: '_salvebot-verification',
          value: `salvebot-verification=${verificationToken}`
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    } else if (method === 'file') {
      verification = {
        method: 'file',
        token: verificationToken,
        fileName: 'salvebot-verification.txt',
        fileContent: `salvebot-verification=${verificationToken}`,
        filePath: `/.well-known/salvebot-verification.txt`,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    }

    // Store verification data
    const verificationKey = `domain_verification:${chatbotId}`
    await c.env.CHATBOTS.put(verificationKey, JSON.stringify(verification))

    return jsonResponse({
      message: 'Domain verification started',
      verification
    })
  } catch (error) {
    console.error('Start domain verification error:', error)
    return errorResponse('Failed to start domain verification', 500)
  }
})

// Verify domain ownership
domainsRouter.put('/verify/:chatbotId', authMiddleware, async (c) => {
  const chatbotId = c.req.param('chatbotId')
  const userId = c.get('userId')

  try {
    // Get chatbot to verify ownership
    const chatbotData = await c.env.CHATBOTS.get(`user:${userId}:${chatbotId}`)
    if (!chatbotData) {
      return errorResponse('Chatbot not found', 404)
    }

    const chatbot: Chatbot = JSON.parse(chatbotData)

    // Get verification data
    const verificationKey = `domain_verification:${chatbotId}`
    const verificationData = await c.env.CHATBOTS.get(verificationKey)
    
    if (!verificationData) {
      return errorResponse('No verification process found. Please start verification first.', 400)
    }

    const verification = JSON.parse(verificationData)
    
    // Check verification based on method
    let isVerified = false
    let errorMessage = ''

    if (verification.method === 'dns') {
      // Check DNS TXT record
      try {
        const dnsResponse = await fetch(`https://dns.google/resolve?name=${verification.dnsRecord.name}.${chatbot.domain}&type=TXT`)
        const dnsData = await dnsResponse.json()
        
        if (dnsData.Answer) {
          const txtRecords = dnsData.Answer
            .filter((record: any) => record.type === 16) // TXT record type
            .map((record: any) => record.data.replace(/"/g, '')) // Remove quotes
          
          isVerified = txtRecords.some((record: string) => 
            record.includes(`salvebot-verification=${verification.token}`)
          )
        }
        
        if (!isVerified) {
          errorMessage = `DNS TXT record not found. Please add the TXT record: ${verification.dnsRecord.value}`
        }
      } catch (error) {
        errorMessage = 'Failed to check DNS records. Please try again.'
      }
    } else if (verification.method === 'file') {
      // Check file upload verification
      try {
        const fileUrl = `https://${chatbot.domain}${verification.filePath}`
        const fileResponse = await fetch(fileUrl, { 
          method: 'GET',
          headers: { 'User-Agent': 'Salvebot-Verification/1.0' }
        })
        
        if (fileResponse.ok) {
          const fileContent = await fileResponse.text()
          isVerified = fileContent.trim() === verification.fileContent
        }
        
        if (!isVerified) {
          errorMessage = `Verification file not found or incorrect at ${fileUrl}`
        }
      } catch (error) {
        errorMessage = 'Failed to access verification file. Please ensure it\'s accessible.'
      }
    }

    // Update verification status
    verification.status = isVerified ? 'verified' : 'failed'
    verification.verifiedAt = isVerified ? new Date().toISOString() : null
    verification.error = isVerified ? null : errorMessage

    await c.env.CHATBOTS.put(verificationKey, JSON.stringify(verification))

    if (isVerified) {
      // Update chatbot verification status
      chatbot.isVerified = true
      chatbot.verifiedAt = new Date().toISOString()
      
      await c.env.CHATBOTS.put(`user:${userId}:${chatbotId}`, JSON.stringify(chatbot))
      
      // Also update the ID mapping
      const chatbotKey = await c.env.CHATBOTS.get(`id:${chatbotId}`)
      if (chatbotKey) {
        await c.env.CHATBOTS.put(chatbotKey, JSON.stringify(chatbot))
      }
    }

    return jsonResponse({
      verified: isVerified,
      message: isVerified ? 'Domain successfully verified!' : errorMessage,
      verification
    })
  } catch (error) {
    console.error('Verify domain error:', error)
    return errorResponse('Failed to verify domain', 500)
  }
})

export { domainsRouter }
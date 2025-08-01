import { Hono } from 'hono'
import { z } from 'zod'
import { Env, Document, DocumentChunk, User, Chatbot } from '../types'
import { AuthService } from '../lib/auth'
import { RAGService } from '../lib/rag'
import { generateId, jsonResponse, errorResponse } from '../lib/utils'

const documentsRouter = new Hono<{ Bindings: Env }>()

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

// Helper to get chatbot and verify ownership
async function getChatbotForUser(c: any, user: User, chatbotId: string): Promise<Chatbot | null> {
  try {
    const chatbotData = await c.env.CHATBOTS.get(`user:${user.id}:${chatbotId}`)
    if (!chatbotData) return null
    return JSON.parse(chatbotData)
  } catch {
    return null
  }
}

// Upload document
documentsRouter.post('/upload', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const chatbotId = formData.get('chatbotId') as string

    if (!file || !chatbotId) {
      return errorResponse('File and chatbotId are required', 400)
    }

    // Verify chatbot ownership
    const chatbot = await getChatbotForUser(c, user, chatbotId)
    if (!chatbot) {
      return errorResponse('Chatbot not found', 404)
    }

    // Check file type and size
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Only PDF, TXT, and MD files are supported', 400)
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return errorResponse('File size must be less than 10MB', 400)
    }

    const documentId = generateId()
    const now = new Date().toISOString()
    
    // Read file content
    const fileContent = await file.text()
    
    // Create document record
    const document: Document = {
      id: documentId,
      userId: user.id,
      chatbotId: chatbotId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: now,
      status: 'processing',
      chunks: []
    }

    // Store document record
    await c.env.DOCUMENTS.put(`user:${user.id}:doc:${documentId}`, JSON.stringify(document))
    await c.env.DOCUMENTS.put(`chatbot:${chatbotId}:doc:${documentId}`, `user:${user.id}:doc:${documentId}`)

    // Store file content in R2
    await c.env.FILES_BUCKET.put(`documents/${documentId}`, fileContent, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.id,
        chatbotId: chatbotId,
      }
    })

    // Process document for RAG (async)
    try {
      const ragService = new RAGService(c.env.OPENAI_API_KEY)
      const chunks = await ragService.processDocument(fileContent, file.type)
      
      // Store chunks with embeddings
      const documentChunks: DocumentChunk[] = []
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const chunkId = `${documentId}_chunk_${i}`
        
        const documentChunk: DocumentChunk = {
          id: chunkId,
          documentId: documentId,
          content: chunk.content,
          embedding: chunk.embedding,
          metadata: chunk.metadata
        }
        
        documentChunks.push(documentChunk)
        
        // Store chunk in KV
        await c.env.DOCUMENTS.put(`chunk:${chunkId}`, JSON.stringify(documentChunk))
      }

      // Update document status and chunks
      document.status = 'ready'
      document.chunks = documentChunks
      await c.env.DOCUMENTS.put(`user:${user.id}:doc:${documentId}`, JSON.stringify(document))

      // Update chatbot stats
      chatbot.stats.documentsCount += 1
      chatbot.updatedAt = now
      await c.env.CHATBOTS.put(`user:${user.id}:${chatbotId}`, JSON.stringify(chatbot))

    } catch (error) {
      console.error('Document processing error:', error)
      // Update document status to error
      document.status = 'error'
      await c.env.DOCUMENTS.put(`user:${user.id}:doc:${documentId}`, JSON.stringify(document))
    }

    return jsonResponse({ 
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    }, 201)

  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse('Failed to upload document', 500)
  }
})

// Get documents for a chatbot
documentsRouter.get('/chatbot/:chatbotId', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const chatbotId = c.req.param('chatbotId')
  
  try {
    // Verify chatbot ownership
    const chatbot = await getChatbotForUser(c, user, chatbotId)
    if (!chatbot) {
      return errorResponse('Chatbot not found', 404)
    }

    // Get documents for this chatbot
    const documentsList = await c.env.DOCUMENTS.list({ prefix: `chatbot:${chatbotId}:doc:` })
    const documents = []

    for (const key of documentsList.keys) {
      const docKeyPath = await c.env.DOCUMENTS.get(key.name)
      if (docKeyPath) {
        const docData = await c.env.DOCUMENTS.get(docKeyPath)
        if (docData) {
          const doc = JSON.parse(docData)
          // Return only essential fields
          documents.push({
            id: doc.id,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            status: doc.status,
            uploadedAt: doc.uploadedAt
          })
        }
      }
    }

    return jsonResponse({ documents })
  } catch (error) {
    console.error('Get documents error:', error)
    return errorResponse('Failed to get documents', 500)
  }
})

// Delete document
documentsRouter.delete('/:documentId', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const documentId = c.req.param('documentId')
  
  try {
    const documentData = await c.env.DOCUMENTS.get(`user:${user.id}:doc:${documentId}`)
    if (!documentData) {
      return errorResponse('Document not found', 404)
    }

    const document: Document = JSON.parse(documentData)
    
    // Verify chatbot ownership
    const chatbot = await getChatbotForUser(c, user, document.chatbotId)
    if (!chatbot) {
      return errorResponse('Access denied', 403)
    }

    // Delete chunks
    for (const chunk of document.chunks) {
      await c.env.DOCUMENTS.delete(`chunk:${chunk.id}`)
    }

    // Delete document records
    await c.env.DOCUMENTS.delete(`user:${user.id}:doc:${documentId}`)
    await c.env.DOCUMENTS.delete(`chatbot:${document.chatbotId}:doc:${documentId}`)
    
    // Delete file from R2
    await c.env.FILES_BUCKET.delete(`documents/${documentId}`)

    // Update chatbot stats
    if (chatbot.stats.documentsCount > 0) {
      chatbot.stats.documentsCount -= 1
      chatbot.updatedAt = new Date().toISOString()
      await c.env.CHATBOTS.put(`user:${user.id}:${document.chatbotId}`, JSON.stringify(chatbot))
    }

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Delete document error:', error)
    return errorResponse('Failed to delete document', 500)
  }
})

// Get document details
documentsRouter.get('/:documentId', async (c) => {
  const user = await authenticateUser(c)
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const documentId = c.req.param('documentId')
  
  try {
    const documentData = await c.env.DOCUMENTS.get(`user:${user.id}:doc:${documentId}`)
    if (!documentData) {
      return errorResponse('Document not found', 404)
    }

    const document: Document = JSON.parse(documentData)
    
    // Verify chatbot ownership
    const chatbot = await getChatbotForUser(c, user, document.chatbotId)
    if (!chatbot) {
      return errorResponse('Access denied', 403)
    }

    return jsonResponse({ 
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt,
        chunksCount: document.chunks.length
      }
    })
  } catch (error) {
    console.error('Get document error:', error)
    return errorResponse('Failed to get document', 500)
  }
})

export { documentsRouter }
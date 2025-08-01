import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Env, Chatbot, Document, DocumentChunk, ChatMessage } from '../types'
import { RAGService } from '../lib/rag'
import { generateId, extractDomainFromUrl, jsonResponse, errorResponse } from '../lib/utils'

const chatRouter = new Hono<{ Bindings: Env }>()

const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
  domain: z.string().min(1)
})

async function verifyChatbotAccess(
  chatbotId: string,
  domain: string,
  env: Env
): Promise<{ allowed: boolean; chatbot?: Chatbot; reason?: string }> {
  try {
    // Get chatbot by ID
    const chatbotKey = await env.CHATBOTS.get(`id:${chatbotId}`)
    if (!chatbotKey) {
      return { allowed: false, reason: 'Chatbot not found' }
    }

    const chatbotData = await env.CHATBOTS.get(chatbotKey)
    if (!chatbotData) {
      return { allowed: false, reason: 'Chatbot not found' }
    }

    const chatbot: Chatbot = JSON.parse(chatbotData)

    // Check if chatbot is active
    if (!chatbot.isActive) {
      return { allowed: false, reason: 'Chatbot is not active' }
    }

    // Check domain verification
    if (!chatbot.isVerified) {
      return { allowed: false, reason: 'Domain not verified' }
    }

    // Verify domain matches
    const requestDomain = extractDomainFromUrl(domain)
    const chatbotDomain = extractDomainFromUrl(chatbot.domain)
    
    if (requestDomain !== chatbotDomain) {
      return { allowed: false, reason: 'Domain mismatch' }
    }

    // Check user subscription status
    const userEmail = await env.USERS.get(`id:${chatbot.userId}`)
    if (!userEmail) {
      return { allowed: false, reason: 'User not found' }
    }

    const userData = await env.USERS.get(userEmail)
    if (!userData) {
      return { allowed: false, reason: 'User not found' }
    }

    const user = JSON.parse(userData)
    if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trial') {
      return { allowed: false, reason: 'Subscription required' }
    }

    // Check trial expiry
    if (user.subscriptionStatus === 'trial' && user.trialEndDate) {
      const trialEnd = new Date(user.trialEndDate)
      if (trialEnd < new Date()) {
        return { allowed: false, reason: 'Trial expired' }
      }
    }

    return { allowed: true, chatbot }
  } catch (error) {
    console.error('Error verifying chatbot access:', error)
    return { allowed: false, reason: 'Verification failed' }
  }
}

async function getChatbotDocuments(chatbotId: string, env: Env): Promise<DocumentChunk[]> {
  try {
    // Get all document references for this chatbot
    const documentsList = await env.DOCUMENTS.list({ prefix: `chatbot:${chatbotId}:doc:` })
    const chunks: DocumentChunk[] = []

    for (const key of documentsList.keys) {
      // Get the document reference (points to actual document)
      const docRefPath = await env.DOCUMENTS.get(key.name)
      if (docRefPath) {
        // Get the actual document data
        const documentData = await env.DOCUMENTS.get(docRefPath)
        if (documentData) {
          const document: Document = JSON.parse(documentData)
          if (document.status === 'ready' && document.chunks) {
            // Get all chunks for this document
            for (const chunk of document.chunks) {
              const chunkData = await env.DOCUMENTS.get(`chunk:${chunk.id}`)
              if (chunkData) {
                const fullChunk: DocumentChunk = JSON.parse(chunkData)
                chunks.push(fullChunk)
              }
            }
          }
        }
      }
    }

    return chunks
  } catch (error) {
    console.error('Error getting chatbot documents:', error)
    return []
  }
}

// Public chat endpoint (no authentication required)
chatRouter.post('/:chatbotId', zValidator('json', chatMessageSchema), async (c) => {
  const chatbotId = c.req.param('chatbotId')
  const { message, sessionId, domain } = c.req.valid('json')

  // Verify chatbot access
  const verification = await verifyChatbotAccess(chatbotId, domain, c.env)
  if (!verification.allowed) {
    return errorResponse(verification.reason || 'Access denied', 403)
  }

  const chatbot = verification.chatbot!

  try {
    // Initialize RAG service
    const ragService = new RAGService(c.env.OPENAI_API_KEY)

    // Get chatbot documents
    const chunks = await getChatbotDocuments(chatbotId, c.env)

    if (chunks.length === 0) {
      // No documents available, provide basic response
      const basicResponse = `I'm sorry, but I don't have access to any information to help answer your question. Please contact support for assistance.`
      
      return jsonResponse({
        response: basicResponse,
        sessionId: sessionId || generateId(),
        confidence: 0
      })
    }

    // Perform RAG query
    const { response, retrievedChunks } = await ragService.performRAGQuery(
      message,
      chunks,
      chatbot.settings
    )

    // Generate or use existing session ID
    const currentSessionId = sessionId || generateId()

    // Store chat message (optional - for analytics)
    const messageId = generateId()
    const timestamp = new Date().toISOString()
    
    const chatMessage: ChatMessage = {
      id: messageId,
      chatbotId,
      sessionId: currentSessionId,
      role: 'assistant',
      content: response,
      timestamp,
      metadata: {
        retrievedChunks,
        confidence: retrievedChunks.length > 0 ? 0.8 : 0.3
      }
    }

    // Store message for analytics (fire and forget)
    c.env.DOCUMENTS.put(
      `chat:${chatbotId}:${currentSessionId}:${messageId}`,
      JSON.stringify(chatMessage)
    ).catch(console.error)

    // Update chatbot stats
    chatbot.stats.conversationsCount += 1
    chatbot.stats.lastActive = timestamp
    c.env.CHATBOTS.put(
      `user:${chatbot.userId}:${chatbotId}`,
      JSON.stringify(chatbot)
    ).catch(console.error)

    return jsonResponse({
      response,
      sessionId: currentSessionId,
      confidence: chatMessage.metadata?.confidence || 0.5
    })

  } catch (error) {
    console.error('Chat error:', error)
    return errorResponse('Failed to process message', 500)
  }
})

// Widget JavaScript endpoint
chatRouter.get('/widget.js', async (c) => {
  const widgetJs = `
(function() {
  'use strict';
  
  const WIDGET_API_BASE = '${c.env.CORS_ORIGIN || 'https://api.salvebot.workers.dev'}';
  
  function createWidget() {
    const script = document.currentScript;
    const chatbotId = script.getAttribute('data-chatbot-id');
    const domain = script.getAttribute('data-domain') || window.location.hostname;
    
    if (!chatbotId) {
      console.error('Salvebot: chatbot-id is required');
      return;
    }

    let isOpen = false;
    let sessionId = null;
    
    // Widget HTML
    const widgetHTML = \`
      <div id="salvebot-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div id="salvebot-button" style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <div id="salvebot-chat" style="display: none; position: absolute; bottom: 70px; right: 0; width: 350px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); overflow: hidden;">
          <div style="background: #007bff; color: white; padding: 16px; font-weight: 600;">
            Chat Support
            <button id="salvebot-close" style="float: right; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>
          </div>
          <div id="salvebot-messages" style="height: 400px; overflow-y: auto; padding: 16px; background: #f8f9fa;"></div>
          <div style="padding: 16px; border-top: 1px solid #dee2e6;">
            <div style="display: flex; gap: 8px;">
              <input id="salvebot-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 20px; outline: none;">
              <button id="salvebot-send" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer;">Send</button>
            </div>
          </div>
        </div>
      </div>
    \`;
    
    // Insert widget
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    const button = document.getElementById('salvebot-button');
    const chat = document.getElementById('salvebot-chat');
    const close = document.getElementById('salvebot-close');
    const input = document.getElementById('salvebot-input');
    const send = document.getElementById('salvebot-send');
    const messages = document.getElementById('salvebot-messages');
    
    // Toggle widget
    button.addEventListener('click', () => {
      isOpen = !isOpen;
      chat.style.display = isOpen ? 'block' : 'none';
      if (isOpen && !sessionId) {
        addMessage('assistant', 'Hello! How can I help you today?');
      }
    });
    
    close.addEventListener('click', () => {
      isOpen = false;
      chat.style.display = 'none';
    });
    
    // Send message
    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;
      
      addMessage('user', message);
      input.value = '';
      
      try {
        const response = await fetch(\`\${WIDGET_API_BASE}/api/chat/\${chatbotId}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId, domain })
        });
        
        const data = await response.json();
        
        if (data.response) {
          sessionId = data.sessionId;
          addMessage('assistant', data.response);
        } else {
          addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
      } catch (error) {
        addMessage('assistant', 'Sorry, I cannot connect right now. Please try again later.');
      }
    }
    
    function addMessage(role, content) {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = \`
        margin-bottom: 12px;
        padding: 8px 12px;
        border-radius: 12px;
        max-width: 80%;
        \${role === 'user' 
          ? 'background: #007bff; color: white; margin-left: auto; text-align: right;' 
          : 'background: white; color: #333; margin-right: auto;'
        }
      \`;
      messageDiv.textContent = content;
      messages.appendChild(messageDiv);
      messages.scrollTop = messages.scrollHeight;
    }
    
    send.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`;

  return new Response(widgetJs, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders(c.env.CORS_ORIGIN)
    },
  })
})

export { chatRouter }

function corsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
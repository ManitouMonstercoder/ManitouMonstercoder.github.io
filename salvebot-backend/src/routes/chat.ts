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

    // Check domain verification (required for all domains)
    if (!chatbot.isVerified) {
      return { allowed: false, reason: 'Sorry, this chatbot is not available for your domain. Please check your domain verification.' }
    }

    // Verify domain matches
    const requestDomain = extractDomainFromUrl(domain)
    const chatbotDomain = extractDomainFromUrl(chatbot.domain)
    
    if (requestDomain !== chatbotDomain) {
      return { allowed: false, reason: 'Sorry, this chatbot is not available for your domain. Please check your domain verification.' }
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
    
    // Widget HTML with enhanced UI
    const widgetHTML = \`
      <div id="salvebot-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Floating Action Button -->
        <div id="salvebot-button" style="width: 60px; height: 60px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,123,255,0.3); transition: all 0.3s ease; position: relative;">
          <svg id="salvebot-chat-icon" width="24" height="24" fill="white" viewBox="0 0 24 24" style="transition: opacity 0.2s;">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <svg id="salvebot-close-icon" width="20" height="20" fill="white" viewBox="0 0 24 24" style="display: none; transition: opacity 0.2s;">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          <!-- Notification dot for new messages -->
          <div id="salvebot-notification" style="display: none; position: absolute; top: 5px; right: 5px; width: 12px; height: 12px; background: #dc3545; border-radius: 50%; border: 2px solid white;"></div>
        </div>
        
        <!-- Chat Window -->
        <div id="salvebot-chat" style="display: none; position: absolute; bottom: 70px; right: 0; width: 350px; height: 500px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; transform: scale(0.9); opacity: 0; transition: all 0.3s ease;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px 16px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; background: #28a745; border-radius: 50%;"></div>
              <span style="font-weight: 600; font-size: 16px;">AI Assistant</span>
            </div>
            <button id="salvebot-close" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Messages Container -->
          <div id="salvebot-messages" style="height: 380px; overflow-y: auto; padding: 16px; background: #f8f9fa; display: flex; flex-direction: column; gap: 12px;">
            <!-- Welcome message will be added here -->
          </div>
          
          <!-- Typing Indicator -->
          <div id="salvebot-typing" style="display: none; padding: 0 16px 8px 16px;">
            <div style="background: white; padding: 12px; border-radius: 16px; max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              <div style="display: flex; gap: 4px; align-items: center;">
                <span style="font-size: 12px; color: #6c757d;">AI is typing</span>
                <div style="display: flex; gap: 2px;">
                  <div style="width: 4px; height: 4px; background: #6c757d; border-radius: 50%; animation: salvebot-pulse 1.4s infinite ease-in-out; animation-delay: 0s;"></div>
                  <div style="width: 4px; height: 4px; background: #6c757d; border-radius: 50%; animation: salvebot-pulse 1.4s infinite ease-in-out; animation-delay: 0.2s;"></div>
                  <div style="width: 4px; height: 4px; background: #6c757d; border-radius: 50%; animation: salvebot-pulse 1.4s infinite ease-in-out; animation-delay: 0.4s;"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Input Area -->
          <div style="padding: 12px 16px; border-top: 1px solid #e9ecef; background: white;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <input id="salvebot-input" type="text" placeholder="Ask me anything..." style="flex: 1; padding: 10px 16px; border: 1px solid #e9ecef; border-radius: 24px; outline: none; font-size: 14px; background: #f8f9fa; transition: all 0.2s;" onfocus="this.style.background='white'; this.style.borderColor='#007bff'" onblur="this.style.background='#f8f9fa'; this.style.borderColor='#e9ecef'">
              <button id="salvebot-send" style="padding: 10px 16px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; border: none; border-radius: 24px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s; display: flex; align-items: center; gap: 4px;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <span id="salvebot-send-text">Send</span>
                <svg id="salvebot-send-icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 12l20-9-20 9v6l8-2-8-2v-6z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- CSS Animations -->
      <style>
        @keyframes salvebot-pulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes salvebot-slideIn {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        /* Custom scrollbar */
        #salvebot-messages::-webkit-scrollbar { width: 6px; }
        #salvebot-messages::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        #salvebot-messages::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        #salvebot-messages::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        
        /* Button hover effects */
        #salvebot-button:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 6px 20px rgba(0,123,255,0.4) !important;
        }
        
        #salvebot-send:disabled {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 480px) {
          #salvebot-chat {
            width: calc(100vw - 40px) !important;
            height: calc(100vh - 100px) !important;
            bottom: 70px !important;
            right: 20px !important;
          }
          #salvebot-widget {
            right: 10px !important;
            bottom: 10px !important;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          #salvebot-messages {
            background: #1a1a1a !important;
          }
        }
      </style>
    \`;
    
    // Insert widget
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    const button = document.getElementById('salvebot-button');
    const chat = document.getElementById('salvebot-chat');
    const close = document.getElementById('salvebot-close');
    const input = document.getElementById('salvebot-input');
    const send = document.getElementById('salvebot-send');
    const messages = document.getElementById('salvebot-messages');
    const typing = document.getElementById('salvebot-typing');
    const chatIcon = document.getElementById('salvebot-chat-icon');
    const closeIcon = document.getElementById('salvebot-close-icon');
    const sendText = document.getElementById('salvebot-send-text');
    
    let isLoading = false;
    
    // Enhanced toggle widget with animations
    function toggleWidget() {
      isOpen = !isOpen;
      
      if (isOpen) {
        // Open animation
        chat.style.display = 'block';
        setTimeout(() => {
          chat.style.transform = 'scale(1)';
          chat.style.opacity = '1';
        }, 10);
        
        // Switch button icons
        chatIcon.style.display = 'none';
        closeIcon.style.display = 'block';
        
        // Focus input
        setTimeout(() => input.focus(), 300);
        
        // Add welcome message if first time
        if (!sessionId && messages.children.length === 0) {
          setTimeout(() => {
            addMessage('assistant', '👋 Hello! I\\'m your AI assistant. How can I help you today?');
          }, 500);
        }
      } else {
        // Close animation
        chat.style.transform = 'scale(0.9)';
        chat.style.opacity = '0';
        setTimeout(() => {
          chat.style.display = 'none';
        }, 300);
        
        // Switch button icons
        chatIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    }
    
    button.addEventListener('click', toggleWidget);
    close.addEventListener('click', toggleWidget);
    
    // Enhanced send message with typing indicators
    async function sendMessage() {
      const message = input.value.trim();
      if (!message || isLoading) return;
      
      // Set loading state
      isLoading = true;
      send.disabled = true;
      sendText.textContent = 'Sending...';
      
      // Add user message
      addMessage('user', message);
      input.value = '';
      
      // Show typing indicator
      showTypingIndicator();
      
      try {
        const response = await fetch(\`\${WIDGET_API_BASE}/api/chat/\${chatbotId}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId, domain })
        });
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (response.ok && data.response) {
          sessionId = data.sessionId;
          // Simulate natural typing delay
          setTimeout(() => {
            addMessage('assistant', data.response, data.confidence);
          }, 500);
        } else {
          setTimeout(() => {
            addMessage('assistant', '❌ Sorry, I encountered an error. Please try again or contact support.', 0);
          }, 300);
        }
      } catch (error) {
        hideTypingIndicator();
        setTimeout(() => {
          addMessage('assistant', '🔌 Sorry, I cannot connect right now. Please check your internet connection and try again.', 0);
        }, 300);
      } finally {
        // Reset loading state
        isLoading = false;
        send.disabled = false;
        sendText.textContent = 'Send';
      }
    }
    
    // Show typing indicator
    function showTypingIndicator() {
      typing.style.display = 'block';
      messages.scrollTop = messages.scrollHeight + 100;
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
      typing.style.display = 'none';
    }
    
    // Enhanced message function with timestamps and confidence
    function addMessage(role, content, confidence = 1) {
      const messageWrapper = document.createElement('div');
      messageWrapper.style.cssText = \`
        display: flex;
        flex-direction: column;
        \${role === 'user' ? 'align-items: flex-end;' : 'align-items: flex-start;'}
        margin-bottom: 16px;
        animation: salvebot-slideIn 0.3s ease-out;
      \`;
      
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = \`
        padding: 12px 16px;
        border-radius: 18px;
        max-width: 80%;
        word-wrap: break-word;
        line-height: 1.4;
        font-size: 14px;
        position: relative;
        \${role === 'user' 
          ? 'background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; border-bottom-right-radius: 6px;' 
          : 'background: white; color: #333; border-bottom-left-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'
        }
      \`;
      
      messageDiv.textContent = content;
      messageWrapper.appendChild(messageDiv);
      
      // Add timestamp
      const timeDiv = document.createElement('div');
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      timeDiv.style.cssText = \`
        font-size: 11px;
        color: #6c757d;
        margin-top: 4px;
        \${role === 'user' ? 'text-align: right;' : 'text-align: left;'}
      \`;
      
      // Add confidence indicator for assistant messages
      if (role === 'assistant' && confidence !== undefined) {
        const confidenceIcon = confidence > 0.7 ? '✅' : confidence > 0.3 ? '💭' : '❓';
        timeDiv.textContent = \`\${confidenceIcon} \${timeString}\`;
      } else {
        timeDiv.textContent = timeString;
      }
      
      messageWrapper.appendChild(timeDiv);
      messages.appendChild(messageWrapper);
      
      // Smooth scroll to bottom
      messages.scrollTo({
        top: messages.scrollHeight,
        behavior: 'smooth'
      });
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
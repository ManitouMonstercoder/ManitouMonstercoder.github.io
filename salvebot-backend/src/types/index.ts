export interface Env {
  // KV Namespaces
  USERS: KVNamespace
  CHATBOTS: KVNamespace
  DOCUMENTS: KVNamespace
  DOMAINS: KVNamespace
  
  // R2 Bucket
  FILES_BUCKET: R2Bucket
  
  // D1 Database
  DB: D1Database
  
  // Durable Objects
  CHAT_SESSION: DurableObjectNamespace
  
  // Environment Variables
  ENVIRONMENT: string
  CORS_ORIGIN: string
  JWT_SECRET: string
  STRIPE_PUBLISHABLE_KEY: string
  
  // Secrets
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  OPENAI_API_KEY: string
}

export interface User {
  id: string
  email: string
  name: string
  company?: string
  hashedPassword: string
  createdAt: string
  updatedAt: string
  stripeCustomerId?: string
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
  trialEndDate?: string
}

export interface Chatbot {
  id: string
  userId: string
  name: string
  domain: string
  isActive: boolean
  isVerified: boolean
  embedCode: string
  createdAt: string
  updatedAt: string
  settings: {
    welcomeMessage: string
    theme: string
    position: string
  }
  stats: {
    conversationsCount: number
    documentsCount: number
    lastActive?: string
  }
}

export interface Document {
  id: string
  userId: string
  chatbotId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  status: 'processing' | 'ready' | 'error'
  chunks: DocumentChunk[]
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding: number[]
  metadata: {
    page?: number
    section?: string
  }
}

export interface Domain {
  id: string
  userId: string
  chatbotId: string
  domain: string
  isVerified: boolean
  verificationToken: string
  verificationMethod: 'dns' | 'file'
  createdAt: string
  verifiedAt?: string
}

export interface ChatMessage {
  id: string
  chatbotId: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    retrievedChunks?: string[]
    confidence?: number
  }
}

export interface ChatSession {
  id: string
  chatbotId: string
  domain: string
  messages: ChatMessage[]
  createdAt: string
  lastMessageAt: string
}

export interface StripeSubscription {
  id: string
  userId: string
  customerId: string
  status: string
  planId: string
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelledAt?: number
  createdAt: string
  updatedAt: string
}
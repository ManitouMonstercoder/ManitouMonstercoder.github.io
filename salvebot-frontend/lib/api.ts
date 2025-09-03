const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://salvebot-api.fideleamazing.workers.dev'

export interface AuthResponse {
  success?: boolean
  message?: string
  token?: string
  email?: string
  user?: {
    id: string
    name: string
    email: string
    company?: string
    subscriptionStatus?: string
    trialEndDate?: string
    isNewUser?: boolean
    loginCount?: number
    lastLoginAt?: string
    securityScore?: number
    isEmailVerified?: boolean
  }
  requiresVerification?: boolean
  requiresSignup?: boolean
}

export interface ApiError {
  success: false
  message: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('salvebot_token') : null
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      }
    }

    console.log('API Request:', { url, method: config.method || 'GET', headers: config.headers, body: config.body })

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors from Zod
        if (data.error && data.error.issues) {
          const validationErrors = data.error.issues.map((issue: any) => issue.message).join('; ')
          throw new Error(validationErrors)
        }
        // Handle other error formats
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication endpoints
  async signup(userData: {
    name: string
    email: string
    password: string
    company?: string
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async signin(credentials: {
    email: string
    password: string
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async me(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/me')
  }

  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  }

  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  // Chatbot endpoints
  async getChatbots(): Promise<any> {
    return this.request('/api/chatbots')
  }

  async getChatbot(chatbotId: string): Promise<any> {
    return this.request(`/api/chatbots/${chatbotId}`)
  }

  async refreshEmbedCode(chatbotId: string): Promise<any> {
    return this.request(`/api/chatbots/${chatbotId}/refresh-embed`, {
      method: 'POST'
    })
  }

  async createChatbot(data: any): Promise<any> {
    return this.request('/api/chatbots', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }


  async updateChatbot(id: string, data: any): Promise<any> {
    return this.request(`/api/chatbots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteChatbot(id: string): Promise<any> {
    return this.request(`/api/chatbots/${id}`, {
      method: 'DELETE',
    })
  }

  // Document endpoints
  async uploadDocument(file: File, chatbotId: string): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatbotId', chatbotId)

    return this.request('/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  }

  async getDocuments(chatbotId: string): Promise<any> {
    return this.request(`/api/documents/chatbot/${chatbotId}`)
  }

  async getDocument(documentId: string): Promise<any> {
    return this.request(`/api/documents/${documentId}`)
  }

  async deleteDocument(documentId: string): Promise<any> {
    return this.request(`/api/documents/${documentId}`, {
      method: 'DELETE',
    })
  }

  // Domain Verification API methods
  async getDomainVerification(chatbotId: string): Promise<any> {
    return this.request(`/api/domains/chatbot/${chatbotId}`)
  }

  async startDomainVerification(chatbotId: string, method: 'dns' | 'file'): Promise<any> {
    return this.request(`/api/domains/verify`, {
      method: 'POST',
      body: JSON.stringify({ chatbotId, method })
    })
  }

  async verifyDomain(chatbotId: string): Promise<any> {
    return this.request(`/api/domains/verify/${chatbotId}`, {
      method: 'PUT'
    })
  }

  // Billing and Stripe API methods
  async getUsage(): Promise<any> {
    return this.request('/api/billing/usage')
  }

  async createStripeSession(planId: string): Promise<any> {
    return this.request('/api/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ planId })
    })
  }

  async createStripePortalSession(): Promise<any> {
    return this.request('/api/billing/create-portal-session', {
      method: 'POST'
    })
  }

  // Settings API methods
  async updateProfile(data: { name: string; company?: string }): Promise<any> {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    return this.request('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateNotificationSettings(notifications: any): Promise<any> {
    return this.request('/api/user/notifications', {
      method: 'PUT',
      body: JSON.stringify(notifications)
    })
  }

  async deleteAccount(): Promise<any> {
    return this.request('/api/user/delete', {
      method: 'DELETE'
    })
  }

  // Analytics API methods
  async getAnalytics(chatbotId: string, dateRange: string): Promise<any> {
    const params = new URLSearchParams({
      chatbotId,
      dateRange
    })
    return this.request(`/api/analytics?${params.toString()}`)
  }

  // Chat API methods (public endpoint, no auth required)
  async sendChatMessage(chatbotId: string, message: string, sessionId?: string, domain?: string): Promise<any> {
    const currentDomain = domain || (typeof window !== 'undefined' ? window.location.hostname : 'localhost')
    const url = `${this.baseUrl}/api/chat/${chatbotId}`
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        domain: currentDomain
      })
    }

    console.log('Chat API Request:', { 
      url, 
      headers: config.headers, 
      body: JSON.parse(config.body as string),
      chatbotId,
      domain: currentDomain 
    })

    try {
      const response = await fetch(url, config)
      console.log('Chat API Response:', { status: response.status, statusText: response.statusText })
      
      if (!response.ok) {
        let errorText
        try {
          const errorJson = await response.json()
          errorText = errorJson.message || errorJson.error || JSON.stringify(errorJson)
        } catch {
          errorText = await response.text()
        }
        console.log('Chat API Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Chat API Success:', data)
      return data
      
    } catch (error) {
      console.error('Chat API Error:', error)
      throw error
    }
  }
}

export const api = new ApiClient()

// Auth utility functions
export const authUtils = {
  saveToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('salvebot_token', token)
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('salvebot_token')
    }
    return null
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('salvebot_token')
    }
  },

  isAuthenticated: () => {
    return !!authUtils.getToken()
  },
}
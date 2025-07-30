const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://salvebot-api.fideleamazing.workers.dev'

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    name: string
    email: string
  }
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

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
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

  // Chatbot endpoints
  async getChatbots(): Promise<any> {
    return this.request('/api/chatbots')
  }

  async createChatbot(data: any): Promise<any> {
    return this.request('/api/chatbots', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

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
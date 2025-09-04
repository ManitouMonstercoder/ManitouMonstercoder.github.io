'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { ArrowLeftIcon, EyeIcon, CopyIcon, RefreshCwIcon, ZoomInIcon, ZoomOutIcon, MonitorIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface Chatbot {
  id: string
  name: string
  domain: string
  welcomeMessage: string
  theme: string
  position: string
  isActive: boolean
  isVerified: boolean
  embedCode: string
  settings?: {
    welcomeMessage: string
    theme: string
    position: string
  }
}

export default function PreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatbotId = searchParams.get('id')
  const previewRef = useRef<HTMLDivElement>(null)

  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showWidget, setShowWidget] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const widgetContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatbotId) {
      loadChatbot()
    }
  }, [chatbotId])

  const loadChatbot = async () => {
    try {
      const response = await api.getChatbot(chatbotId!)
      setChatbot(response.chatbot)
      
      if (response.chatbot?.domain) {
        await captureScreenshot(response.chatbot.domain)
      }
      
      // Load the real widget after chatbot data is loaded
      setTimeout(() => {
        loadRealWidget()
      }, 1000)
    } catch (error) {
      console.error('Failed to load chatbot:', error)
      setError('Failed to load chatbot details')
    } finally {
      setIsLoading(false)
    }
  }

  const captureScreenshot = async (domain: string) => {
    try {
      setIsCapturing(true)
      setError('')

      // Create a minimalist mockup background instead of real screenshot
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 1200
      canvas.height = 800
      
      if (ctx) {
        // Create a simple webpage mockup
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Header
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, canvas.width, 80)
        
        // Navigation elements
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(50, 25, 100, 30)
        ctx.fillRect(170, 25, 80, 30)
        ctx.fillRect(270, 25, 90, 30)
        
        // Main content area
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(50, 120, canvas.width - 100, 200)
        ctx.fillStyle = '#cbd5e1'
        ctx.fillRect(70, 140, 300, 20)
        ctx.fillRect(70, 180, 500, 15)
        ctx.fillRect(70, 210, 400, 15)
        ctx.fillRect(70, 240, 350, 15)
        
        // Sidebar
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(canvas.width - 250, 120, 200, 300)
        ctx.fillStyle = '#94a3b8'
        ctx.fillRect(canvas.width - 230, 140, 160, 15)
        ctx.fillRect(canvas.width - 230, 170, 120, 15)
        ctx.fillRect(canvas.width - 230, 200, 140, 15)
        
        // Footer
        ctx.fillStyle = '#334155'
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60)
        
        // Add domain text
        ctx.fillStyle = '#64748b'
        ctx.font = '16px Arial'
        ctx.fillText(domain, 50, 50)
      }
      
      const mockupUrl = canvas.toDataURL('image/png')
      setScreenshotUrl(mockupUrl)
      setSuccessMessage('Website preview generated successfully!')
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Failed to generate preview:', error)
      setError('Failed to generate website preview')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleRefreshScreenshot = () => {
    if (chatbot?.domain) {
      captureScreenshot(chatbot.domain)
    }
  }

  const copyEmbedCode = async () => {
    if (!chatbot?.embedCode) return

    try {
      await navigator.clipboard.writeText(chatbot.embedCode)
      setSuccessMessage('Embed code copied to clipboard!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Failed to copy embed code')
    }
  }


  // Load the real widget script
  const loadRealWidget = () => {
    if (!chatbot?.id || widgetLoaded) return

    // Remove any existing widget
    const existingWidget = document.getElementById('salvebot-widget')
    if (existingWidget) {
      existingWidget.remove()
    }

    // Create and load the widget script
    const script = document.createElement('script')
    script.src = 'https://salvebot-api.fideleamazing.workers.dev/api/chat/widget.js'
    script.async = true
    script.setAttribute('data-chatbot-id', chatbot.id)
    script.setAttribute('data-domain', chatbot.domain)
    
    script.onload = () => {
      setWidgetLoaded(true)
      // Move the widget into our container after it loads
      setTimeout(() => {
        const widget = document.getElementById('salvebot-widget')
        if (widget && widgetContainerRef.current) {
          widgetContainerRef.current.appendChild(widget)
          // Override positioning for preview
          widget.style.position = 'relative'
          widget.style.bottom = 'auto'
          widget.style.right = 'auto'
          widget.style.zIndex = '1'
        }
      }, 100)
    }

    script.onerror = () => {
      setError('Failed to load chatbot widget')
    }

    document.head.appendChild(script)
  }

  // Real widget handles all messaging now
  const handleTestMessage = async (userMessage: string) => {
    // This function is no longer used - the real widget handles messaging
    console.log('Real widget should handle:', userMessage)
    // setIsTyping(true)

    try {
      // Send message to RAG-powered AI backend
      // For preview mode, use the chatbot's configured domain instead of localhost
      const response = await api.sendChatMessage(
        chatbot.id, 
        userMessage, 
        // conversationId || undefined,
        chatbot.domain || 'preview-mode.salvebot.com'
      )

      if (response.response) {
        // addMessage('assistant', response.response)
        
        // Update session ID from backend
        if (response.sessionId) {
          // setConversationId(response.sessionId) - not needed for real widget
        }
      } else {
        // addMessage('assistant', 'Sorry, I encountered an issue processing your message. Please try again.')
      }

    } catch (error: any) {
      console.error('Failed to send message:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      })
      
      // Show more specific error messages
      if (error.message?.includes('403') || error.status === 403) {
        // addMessage('assistant', 'Sorry, this chatbot is not available for your domain. Please check your domain verification.')
      } else if (error.message?.includes('500') || error.status === 500) {
        // addMessage('assistant', 'Sorry, I\'m experiencing technical difficulties. Please try again in a moment.')
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('ERR_NETWORK')) {
        console.log('Network error:', error)
      } else {
        console.log('Other error:', error)
      }
    } finally {
      // setIsTyping(false) - not needed since real widget handles this
    }
  }

  const getWidgetPosition = () => {
    const position = chatbot?.settings?.position || chatbot?.position || 'bottom-right'
    
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  const getChatWindowPosition = (position: string) => {
    switch (position) {
      case 'bottom-left':
        return 'left-0 bottom-16'
      case 'top-right':
        return 'right-0 top-16'
      case 'top-left':
        return 'left-0 top-16'
      default:
        return 'right-0 bottom-16'
    }
  }

  const getWidgetTheme = () => {
    const theme = chatbot?.settings?.theme || chatbot?.theme || 'light'
    return theme === 'dark' ? 'dark' : 'light'
  }

  const getWidgetAvatar = () => {
    const avatar = (chatbot as any)?.settings?.avatar || (chatbot as any)?.avatar || 'bot'
    const avatarMap = {
      'bot': '🤖',
      'assistant': '👨‍💼',
      'support': '💁‍♀️',
      'chat': '💬',
      'help': '🆘',
      'info': 'ℹ️'
    }
    return avatarMap[avatar as keyof typeof avatarMap] || '🤖'
  }

  if (!chatbotId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Chatbot Selected</h2>
          <p className="text-muted-foreground mb-4">Please select a chatbot to preview.</p>
          <Button onClick={() => router.push('/dashboard')} className="btn-hover">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="btn-hover"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <EyeIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Widget Preview</h1>
                    <p className="text-sm text-muted-foreground">
                      See how your chatbot will look on your website
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshScreenshot}
                  disabled={isCapturing}
                  className="btn-hover"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${isCapturing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
                  className="btn-hover"
                >
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}
                  className="btn-hover"
                >
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWidget(!showWidget)}
                  className="btn-hover"
                >
                  {showWidget ? 'Hide Widget' : 'Show Widget'}
                </Button>
                
                {chatbot && (
                  <Button
                    onClick={copyEmbedCode}
                    className="btn-hover"
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Copy Embed Code
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Preview Info */}
              {chatbot && (
                <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Chatbot Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {chatbot.name}</p>
                        <p><span className="text-muted-foreground">Domain:</span> {chatbot.domain}</p>
                        <p><span className="text-muted-foreground">Status:</span> 
                          <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                            chatbot.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {chatbot.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Widget Settings</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Position:</span> {(chatbot?.settings?.position || chatbot?.position || 'bottom-right').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        <p><span className="text-muted-foreground">Theme:</span> {getWidgetTheme()}</p>
                        <p><span className="text-muted-foreground">Welcome:</span> {(chatbot.settings?.welcomeMessage || chatbot.welcomeMessage)?.substring(0, 30)}...</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Preview Controls</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadRealWidget()}
                          className="w-full btn-hover"
                          disabled={widgetLoaded}
                        >
                          {widgetLoaded ? 'Widget Loaded' : 'Load Widget'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Click to test the chat experience
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Website Preview */}
              <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Website Preview</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MonitorIcon className="h-4 w-4" />
                    <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                  </div>
                </div>
                
                <div 
                  ref={previewRef}
                  className="relative border border-border rounded-lg overflow-hidden bg-white"
                  style={{ 
                    height: '600px',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                    width: `${100 / zoomLevel}%`
                  }}
                >
                  {isCapturing ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Capturing screenshot...</p>
                      </div>
                    </div>
                  ) : screenshotUrl ? (
                    <img 
                      src={screenshotUrl}
                      alt={`Screenshot of ${chatbot?.domain}`}
                      className="w-full h-full object-cover"
                      onError={() => setError('Failed to load website screenshot')}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="text-center p-8">
                        <MonitorIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Website Preview</h3>
                        <p className="text-muted-foreground mb-4">
                          Your website screenshot will appear here
                        </p>
                        <Button
                          onClick={handleRefreshScreenshot}
                          disabled={isCapturing}
                          className="btn-hover"
                        >
                          <RefreshCwIcon className="h-4 w-4 mr-2" />
                          Capture Screenshot
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Chatbot Widget Overlay */}
                  {showWidget && chatbot && (
                    <div className={`absolute ${getWidgetPosition()} z-10`}>
                      {/* Real Widget Container */}
                      <div ref={widgetContainerRef} className="font-sans">
                        {!widgetLoaded && (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Integration Instructions */}
              {chatbot && (
                <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                  <h2 className="text-xl font-semibold mb-4">Integration Instructions</h2>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      To add this chatbot to your website, copy and paste the following code before the closing &lt;/body&gt; tag:
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm font-mono">
                        {chatbot.embedCode || `<script src="https://salvebot-api.fideleamazing.workers.dev/api/chat/widget.js" data-chatbot-id="${chatbot.id}" data-domain="${chatbot.domain}"></script>`}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        The widget will automatically appear on your website after adding this code.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyEmbedCode}
                        className="btn-hover"
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Bottom-right notifications */}
        {error && (
          <div className="fixed bottom-6 right-6 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right-5 fade-in-0">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span className="text-red-800 text-xs">!</span>
              </div>
              <div>
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-auto pl-3 text-red-400 hover:text-red-600"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right-5 fade-in-0">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span className="text-green-800 text-xs">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-sm mt-1">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-auto pl-3 text-green-400 hover:text-green-600"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
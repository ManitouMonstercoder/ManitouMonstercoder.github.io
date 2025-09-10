'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { ArrowLeftIcon, CopyIcon } from '@/components/icons'
import { api } from '@/lib/api'
import { useChatRuntime } from "@assistant-ui/react-ai-sdk"
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { Thread } from "@/components/assistant-ui/thread"

interface Chatbot {
  id: string
  name: string
  domain: string
  isActive: boolean
  isVerified: boolean
  embedCode: string
  settings?: {
    welcomeMessage?: string
    theme?: string
    position?: string
  }
}

function ChatInterface({ chatbot }: { chatbot: Chatbot }) {
  // Simple approach - just use the default useChatRuntime which calls /api/chat
  const runtime = useChatRuntime();

  // Store chatbot info in localStorage for the API to access
  useEffect(() => {
    localStorage.setItem('current-chatbot-id', chatbot.id);
    localStorage.setItem('current-chatbot-domain', chatbot.domain);
  }, [chatbot.id, chatbot.domain]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-[600px] border border-border/50 rounded-xl overflow-hidden bg-card">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const chatbotId = searchParams.get('id')
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (chatbotId) {
      loadChatbot()
    }
  }, [chatbotId])

  const loadChatbot = async () => {
    try {
      const response = await api.getChatbot(chatbotId!)
      setChatbot(response.chatbot)
    } catch (error: any) {
      console.error('Failed to load chatbot:', error)
      setError('Failed to load chatbot: ' + (error.message || 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccessMessage('Embed code copied to clipboard!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Failed to copy embed code')
      setTimeout(() => setError(''), 3000)
    }
  }

  if (!chatbotId) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">No Chatbot Selected</h1>
              <Link href="/dashboard">
                <Button>Return to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
                <div className="h-6 w-px bg-border" />
                <h1 className="text-2xl font-bold">Test Your Chatbot</h1>
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
                <p className="text-muted-foreground">Loading chatbot...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Chatbot Info */}
              {chatbot && (
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Chatbot Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{chatbot.name}</span></p>
                        <p><span className="text-muted-foreground">Domain:</span> <span className="font-medium">{chatbot.domain}</span></p>
                        <p><span className="text-muted-foreground">Status:</span> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            chatbot.isActive && chatbot.isVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {chatbot.isActive && chatbot.isVerified ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Widget Settings</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Position:</span> {chatbot.settings?.position || 'bottom-right'}</p>
                        <p><span className="text-muted-foreground">Theme:</span> {chatbot.settings?.theme || 'light'}</p>
                        <p><span className="text-muted-foreground">Welcome:</span> {(chatbot.settings?.welcomeMessage || 'Default message').substring(0, 30)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              {chatbot && (
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
                  <h3 className="font-semibold mb-4">Live Chat Test</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test your RAG-powered chatbot below. This uses your production backend and knowledge base.
                  </p>
                  <ChatInterface chatbot={chatbot} />
                </div>
              )}

              {/* Embed Code */}
              {chatbot && (
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
                  <h3 className="font-semibold mb-4">Embed Code</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Copy this code and paste it into your website's HTML to add the chatbot:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
                      <code>{chatbot.embedCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(chatbot.embedCode)}
                    >
                      <CopyIcon className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Error/Success Messages */}
        {error && (
          <div className="fixed bottom-6 right-6 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-3 text-red-400 hover:text-red-600"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium">Success</p>
                <p className="text-sm mt-1">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-3 text-green-400 hover:text-green-600"
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
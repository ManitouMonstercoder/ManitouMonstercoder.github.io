'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { BotIcon, ArrowRightIcon, SettingsIcon, GlobeIcon, FileTextIcon, MessageSquareIcon, CheckCircle2Icon, AlertCircleIcon, ClockIcon, EyeIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: 'processing' | 'ready' | 'error'
  uploadedAt: string
}

interface Chatbot {
  id: string
  name: string
  domain: string
  welcomeMessage: string
  theme: string
  position: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
  embedCode?: string
  stats?: {
    conversationsCount: number
    documentsCount: number
  }
}

export default function ChatbotManagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatbotId = searchParams.get('id')
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState('')

  useEffect(() => {
    if (chatbotId) {
      loadChatbotData()
    } else {
      setError('No chatbot ID provided')
      setIsLoading(false)
    }
  }, [chatbotId])

  const loadChatbotData = async () => {
    if (!chatbotId) return
    
    try {
      setIsLoading(true)
      const [chatbotResponse, documentsResponse] = await Promise.all([
        api.getChatbot(chatbotId),
        api.getDocuments(chatbotId).catch(() => ({ documents: [] }))
      ])

      if (chatbotResponse.chatbot) {
        setChatbot(chatbotResponse.chatbot)
      } else {
        setError('Chatbot not found')
      }
      
      setDocuments(documentsResponse.documents || [])
    } catch (error: any) {
      console.error('Failed to load chatbot data:', error)
      setError(error.message || 'Failed to load chatbot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentUpload = (document: Document) => {
    setDocuments(prev => [document, ...prev])
  }

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const getStatusBadge = () => {
    if (!chatbot) return null
    
    if (chatbot.isActive && chatbot.isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2Icon className="h-3 w-3 mr-1" />
          Active
        </span>
      )
    }
    
    if (chatbot.isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Inactive
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircleIcon className="h-3 w-3 mr-1" />
        Pending Verification
      </span>
    )
  }

  const copyEmbedCode = () => {
    if (chatbot?.embedCode) {
      navigator.clipboard.writeText(chatbot.embedCode)
      alert('Embed code copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !chatbot) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircleIcon className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Chatbot Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || 'The requested chatbot could not be found.'}</p>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowRightIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AuthGuard>
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
                  onClick={() => router.push('/dashboard')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Back to Dashboard
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <BotIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">{chatbot.name}</h1>
                    <p className="text-sm text-muted-foreground">{chatbot.domain}</p>
                  </div>
                  {getStatusBadge()}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/preview?id=${chatbot.id}`)}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button size="sm" className="btn-hover">
                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                  Test Chat
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-8 mt-6">
              {[
                { id: 'overview', label: 'Overview', icon: BotIcon },
                { id: 'documents', label: 'Documents', icon: FileTextIcon },
                { id: 'settings', label: 'Settings', icon: SettingsIcon },
                { id: 'embed', label: 'Embed Code', icon: GlobeIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                      <p className="text-2xl font-bold">{chatbot.stats?.conversationsCount || 0}</p>
                    </div>
                    <div className="p-3 bg-brand/10 rounded-xl">
                      <MessageSquareIcon className="h-6 w-6 text-brand" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Documents</p>
                      <p className="text-2xl font-bold">{documents.length}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <FileTextIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="text-2xl font-bold">
                        {chatbot.isActive && chatbot.isVerified ? 'Live' : 'Offline'}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <GlobeIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Overview */}
              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Welcome Message</p>
                    <p className="text-foreground mt-1">{chatbot.welcomeMessage}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Theme</p>
                    <p className="text-foreground mt-1 capitalize">{chatbot.theme}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Position</p>
                    <p className="text-foreground mt-1 capitalize">{chatbot.position.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-foreground mt-1">
                      {new Date(chatbot.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-8">
              <DocumentUpload
                chatbotId={chatbotId}
                onUploadSuccess={handleDocumentUpload}
                onUploadError={(error) => setError(error)}
              />
              <DocumentsList
                documents={documents}
                onDocumentDelete={handleDocumentDelete}
                onDocumentUpdate={loadChatbotData}
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-card p-8 rounded-2xl border border-border/50">
              <h3 className="text-lg font-semibold mb-6">Chatbot Settings</h3>
              <p className="text-muted-foreground">Settings management coming soon...</p>
            </div>
          )}

          {/* Embed Code Tab */}
          {activeTab === 'embed' && (
            <div className="space-y-6">
              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold mb-4">Embed Your Chatbot</h3>
                <p className="text-muted-foreground mb-6">
                  Copy and paste this code into your website to add your chatbot.
                </p>
                
                <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>
                    {`<script>
  window.salvebotConfig = {
    chatbotId: "${chatbotId}",
    theme: "${chatbot.theme}",
    position: "${chatbot.position}"
  };
</script>
<script src="https://salvebot-api.fideleamazing.workers.dev/api/chat/widget.js"></script>`}
                  </code>
                </div>
                
                <div className="flex items-center space-x-3 mt-4">
                  <Button onClick={copyEmbedCode}>
                    Copy Code
                  </Button>
                  <Button variant="outline">
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    Test Integration
                  </Button>
                </div>
              </div>

              {!chatbot.isVerified && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Domain Verification Required</h4>
                      <p className="text-yellow-700 mt-1">
                        You need to verify ownership of {chatbot.domain} before your chatbot can go live.
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Verify Domain
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
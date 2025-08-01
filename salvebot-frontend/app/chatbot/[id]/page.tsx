'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bot, ArrowLeft, Settings, Upload, Globe, BarChart3, Trash2, Copy, CheckCircle } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { api } from '@/lib/api'

export default function ChatbotDetailPage() {
  const router = useRouter()
  const params = useParams()
  const chatbotId = params.id as string

  const [chatbot, setChatbot] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [embedCopied, setEmbedCopied] = useState(false)

  useEffect(() => {
    loadChatbotData()
  }, [chatbotId])

  const loadChatbotData = async () => {
    try {
      const [chatbotResponse, documentsResponse] = await Promise.all([
        api.getChatbot(chatbotId),
        api.getDocuments(chatbotId).catch(() => ({ documents: [] }))
      ])

      setChatbot(chatbotResponse.chatbot)
      setDocuments(documentsResponse.documents || [])
    } catch (error: any) {
      console.error('Failed to load chatbot data:', error)
      setError(error.message || 'Failed to load chatbot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentUploadSuccess = (document: any) => {
    setDocuments(prev => [document, ...prev])
    loadChatbotData() // Refresh chatbot stats
  }

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    loadChatbotData() // Refresh chatbot stats
  }

  const copyEmbedCode = () => {
    if (chatbot?.embedCode) {
      navigator.clipboard.writeText(chatbot.embedCode)
      setEmbedCopied(true)
      setTimeout(() => setEmbedCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) {
      return
    }

    try {
      await api.deleteChatbot(chatbotId)
      router.push('/dashboard')
    } catch (error: any) {
      alert(error.message || 'Failed to delete chatbot')
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
            <h1 className="text-2xl font-bold mb-4">Chatbot Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || 'The chatbot you\'re looking for doesn\'t exist.'}</p>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
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
                  className="btn-hover"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">{chatbot.name}</h1>
                    <p className="text-sm text-muted-foreground">{chatbot.domain}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  chatbot.isActive && chatbot.isVerified 
                    ? 'status-active' 
                    : chatbot.isVerified 
                      ? 'status-inactive'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {chatbot.isActive && chatbot.isVerified 
                    ? 'Active' 
                    : chatbot.isVerified 
                      ? 'Inactive'
                      : 'Pending Verification'
                  }
                </span>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-8 mt-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'documents', label: 'Documents', icon: Upload },
                { id: 'embed', label: 'Embed Code', icon: Globe }
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
            </div>
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
                      <p className="text-sm text-muted-foreground">Conversations</p>
                      <p className="text-3xl font-bold">{chatbot.stats?.conversationsCount || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Documents</p>
                      <p className="text-3xl font-bold">{chatbot.stats?.documentsCount || 0}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Upload className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-lg font-semibold">
                        {chatbot.isActive && chatbot.isVerified ? 'Live' : 'Setup Required'}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Guide */}
              {(!chatbot.isActive || !chatbot.isVerified) && (
                <div className="bg-gradient-to-br from-brand/5 to-primary/5 border border-brand/20 rounded-2xl p-8">
                  <h3 className="text-lg font-semibold mb-4">Setup Guide</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        (chatbot.stats?.documentsCount || 0) > 0 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {(chatbot.stats?.documentsCount || 0) > 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">1</span>
                        )}
                      </div>
                      <span className={`${
                        (chatbot.stats?.documentsCount || 0) > 0 ? 'text-green-700' : 'text-muted-foreground'
                      }`}>Upload documents to train your chatbot</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        chatbot.isVerified ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {chatbot.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">2</span>
                        )}
                      </div>
                      <span className={`${
                        chatbot.isVerified ? 'text-green-700' : 'text-muted-foreground'
                      }`}>Verify your domain ownership</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        chatbot.isActive ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {chatbot.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">3</span>
                        )}
                      </div>
                      <span className={`${
                        chatbot.isActive ? 'text-green-700' : 'text-muted-foreground'
                      }`}>Add embed code to your website</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-8">
              <DocumentUpload
                chatbotId={chatbotId}
                onUploadSuccess={handleDocumentUploadSuccess}
                onUploadError={(error) => alert(error)}
              />
              <DocumentsList
                documents={documents}
                onDocumentDelete={handleDocumentDelete}
                onDocumentUpdate={loadChatbotData}
              />
            </div>
          )}

          {/* Embed Code Tab */}
          {activeTab === 'embed' && (
            <div className="space-y-8">
              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold mb-4">Embed Code</h3>
                <p className="text-muted-foreground mb-6">
                  Copy and paste this code into your website's HTML to add the chatbot widget.
                </p>
                
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{chatbot.embedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    onClick={copyEmbedCode}
                    className="absolute top-2 right-2"
                  >
                    {embedCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                {!chatbot.isVerified && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Your chatbot won't work until you verify domain ownership. 
                      Contact support for help with domain verification.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { BotIcon, ArrowLeftIcon, FileTextIcon, UploadIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: 'processing' | 'ready' | 'error'
  uploadedAt: string
  chatbotId: string
}

interface Chatbot {
  id: string
  name: string
  domain: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const chatbotsResponse = await api.getChatbots()
      setChatbots(chatbotsResponse.chatbots || [])
      
      if (chatbotsResponse.chatbots && chatbotsResponse.chatbots.length > 0) {
        const firstChatbot = chatbotsResponse.chatbots[0]
        setSelectedChatbotId(firstChatbot.id)
        await loadDocuments(firstChatbot.id)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load chatbots')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async (chatbotId: string) => {
    try {
      const documentsResponse = await api.getDocuments(chatbotId)
      setDocuments(documentsResponse.documents || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
      setError('Failed to load documents')
    }
  }

  const handleChatbotChange = (chatbotId: string) => {
    setSelectedChatbotId(chatbotId)
    loadDocuments(chatbotId)
  }

  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => [document, ...prev])
  }

  const handleUploadError = (error: string) => {
    setError(error)
  }

  const selectedChatbot = chatbots.find(bot => bot.id === selectedChatbotId)

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
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <FileTextIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Document Manager</h1>
                    <p className="text-sm text-muted-foreground">
                      Upload and manage your AI training documents
                    </p>
                  </div>
                </div>
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
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : chatbots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BotIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Chatbots Found</h2>
              <p className="text-muted-foreground mb-6">
                You need to create a chatbot first before uploading documents.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="btn-hover"
              >
                <BotIcon className="h-4 w-4 mr-2" />
                Create Your First Chatbot
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-destructive text-xs">!</span>
                    </div>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Chatbot Selector */}
              <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Select Chatbot</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <BotIcon className="h-4 w-4" />
                    <span>{chatbots.length} chatbot{chatbots.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <select
                  value={selectedChatbotId}
                  onChange={(e) => handleChatbotChange(e.target.value)}
                  className="form-input"
                >
                  {chatbots.map((chatbot) => (
                    <option key={chatbot.id} value={chatbot.id}>
                      {chatbot.name} ({chatbot.domain})
                    </option>
                  ))}
                </select>
              </div>

              {selectedChatbot && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Document Upload */}
                  <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                    <div className="flex items-center mb-4">
                      <UploadIcon className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-lg font-semibold">Upload Documents</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Upload documents to train your chatbot. Supported formats: PDF, TXT, DOC, DOCX
                    </p>
                    <DocumentUpload
                      chatbotId={selectedChatbotId}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  </div>

                  {/* Document Stats */}
                  <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                    <div className="flex items-center mb-4">
                      <FileTextIcon className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-lg font-semibold">Document Statistics</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {documents.filter(doc => doc.status === 'ready').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Ready</div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {documents.filter(doc => doc.status === 'processing').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Processing</div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">
                          {documents.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Documents</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents List */}
              {selectedChatbot && (
                <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Documents for {selectedChatbot.name}</h2>
                    <div className="text-sm text-muted-foreground">
                      {documents.length} document{documents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <DocumentsList
                    chatbotId={selectedChatbotId}
                    documents={documents}
                    onDocumentDeleted={(docId) => {
                      setDocuments(prev => prev.filter(doc => doc.id !== docId))
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
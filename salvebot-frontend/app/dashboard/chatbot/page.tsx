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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                >
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
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Basic Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Chatbot Name</label>
                    <input
                      type="text"
                      defaultValue={chatbot.name}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter chatbot name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Welcome Message</label>
                    <input
                      type="text"
                      defaultValue={chatbot.welcomeMessage}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Hello! How can I help you today?"
                    />
                  </div>
                </div>
              </div>

              {/* Widget Appearance */}
              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Widget Appearance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="space-y-2">
                      {['light', 'dark', 'auto'].map(theme => (
                        <label key={theme} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value={theme}
                            defaultChecked={chatbot.theme === theme}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="capitalize">{theme}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Position Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Position</label>
                    <div className="space-y-2">
                      {[
                        { value: 'bottom-right', label: 'Bottom Right' },
                        { value: 'bottom-left', label: 'Bottom Left' },
                        { value: 'top-right', label: 'Top Right' },
                        { value: 'top-left', label: 'Top Left' }
                      ].map(position => (
                        <label key={position.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="position"
                            value={position.value}
                            defaultChecked={chatbot.position === position.value}
                            className="w-4 h-4 text-primary"
                          />
                          <span>{position.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Avatar Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Avatar</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'bot', icon: '🤖' },
                        { value: 'assistant', icon: '👨‍💼' },
                        { value: 'support', icon: '💁‍♀️' },
                        { value: 'chat', icon: '💬' },
                        { value: 'help', icon: '🆘' },
                        { value: 'info', icon: 'ℹ️' }
                      ].map(avatar => (
                        <label key={avatar.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="avatar"
                            value={avatar.value}
                            defaultChecked={(chatbot as any).avatar === avatar.value || avatar.value === 'bot'}
                            className="sr-only"
                          />
                          <div className="w-12 h-12 border-2 border-border rounded-lg flex items-center justify-center hover:border-primary text-xl transition-colors">
                            {avatar.icon}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color Customization */}
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-4">Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Color</label>
                      <input
                        type="color"
                        defaultValue="#3b82f6"
                        className="w-full h-10 border border-border rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Text Color</label>
                      <input
                        type="color"
                        defaultValue="#1f2937"
                        className="w-full h-10 border border-border rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Background</label>
                      <input
                        type="color"
                        defaultValue="#ffffff"
                        className="w-full h-10 border border-border rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Accent</label>
                      <input
                        type="color"
                        defaultValue="#f3f4f6"
                        className="w-full h-10 border border-border rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold mb-6">Advanced Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-open widget</h4>
                      <p className="text-sm text-muted-foreground">Automatically open chat after page load</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show typing indicator</h4>
                      <p className="text-sm text-muted-foreground">Display typing animation when AI is responding</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable sound notifications</h4>
                      <p className="text-sm text-muted-foreground">Play sound when new messages arrive</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Auto-open delay (seconds)</label>
                  <input
                    type="number"
                    defaultValue="3"
                    min="0"
                    max="30"
                    className="w-32 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end space-x-3">
                <Button variant="outline">
                  Cancel
                </Button>
                <Button className="btn-hover">
                  Save Changes
                </Button>
              </div>
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
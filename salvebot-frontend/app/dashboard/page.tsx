'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bot, Plus, Settings, FileText, Globe, BarChart3, Sparkles, Zap } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { CreateChatbotModal } from '@/components/chatbots/CreateChatbotModal'
import { api, authUtils } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [chatbots, setChatbots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const [userResponse, chatbotsResponse] = await Promise.all([
        api.me(),
        api.getChatbots().catch(() => ({ chatbots: [] }))
      ])

      if (userResponse.user) {
        setUser(userResponse.user)
      }
      
      setChatbots(chatbotsResponse.chatbots || [])
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    authUtils.removeToken()
    router.push('/')
  }

  const handleChatbotCreate = (newChatbot: any) => {
    setChatbots(prev => [newChatbot, ...prev])
    setShowCreateModal(false)
  }

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-semibold">Salvebot</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="btn-hover">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="btn-hover" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12">
          {/* Welcome Section */}
          <div className="mb-12 animate-fade-in">
            {user?.isNewUser ? (
              <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center px-4 py-2 bg-brand/10 border border-brand/20 rounded-full mb-6">
                  <Sparkles className="h-4 w-4 text-brand mr-2" />
                  <span className="text-sm font-medium text-brand">Welcome to Salvebot</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                  Welcome, {user.name}! 🎉
                </h1>
                <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                  Thanks for joining us! Let's get you started with creating your first intelligent chatbot.
                </p>
                <div className="bg-gradient-to-br from-brand/5 to-primary/5 border border-brand/20 rounded-2xl p-8 text-left max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center mr-3">
                      <Zap className="h-4 w-4 text-brand" />
                    </div>
                    Quick Start Guide
                  </h3>
                  <div className="space-y-3 text-muted-foreground">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-semibold text-brand">1</span>
                      </div>
                      <span>Create your first chatbot below</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-semibold text-brand">2</span>
                      </div>
                      <span>Upload your business documents</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-semibold text-brand">3</span>
                      </div>
                      <span>Verify your domain</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-semibold text-brand">4</span>
                      </div>
                      <span>Get your embed code and go live!</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-xl text-muted-foreground mb-2">
                  {user?.loginCount && user.loginCount > 1 
                    ? `This is your ${user.loginCount}${getOrdinalSuffix(user.loginCount)} visit. Manage your chatbots and monitor their performance.`
                    : 'Manage your chatbots and monitor their performance.'
                  }
                </p>
                {user?.lastLoginAt && (
                  <p className="text-sm text-muted-foreground">
                    Last login: {new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 animate-fade-in">
            <div className="bg-card p-8 rounded-2xl border border-border/50 card-shadow hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">{chatbots.length}</p>
                  <p className="text-sm font-medium text-muted-foreground">Active Bots</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border/50 card-shadow hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand/10 rounded-xl group-hover:bg-brand/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-brand" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">1,234</p>
                  <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border/50 card-shadow hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">45</p>
                  <p className="text-sm font-medium text-muted-foreground">Documents</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border/50 card-shadow hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">3</p>
                  <p className="text-sm font-medium text-muted-foreground">Domains</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chatbots List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Chatbots</h2>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chatbot
                </Button>
              </div>
              
              <div className="space-y-4">
                {chatbots.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No chatbots yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create your first AI chatbot to start helping your customers 24/7.
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Chatbot
                    </Button>
                  </div>
                ) : (
                  chatbots.map((chatbot) => (
                    <div key={chatbot.id} className="bg-card p-6 rounded-2xl border border-border/50 card-shadow hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{chatbot.name}</h3>
                          <p className="text-sm text-muted-foreground">{chatbot.domain}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                                : 'Pending'
                            }
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/chatbot/${chatbot.id}`)}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Conversations</p>
                          <p className="font-medium">{chatbot.stats?.conversationsCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Documents</p>
                          <p className="font-medium">{chatbot.stats?.documentsCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">
                            {new Date(chatbot.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          {/* Quick Actions Sidebar */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Bot
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="h-4 w-4 mr-2" />
                Verify Domain
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>

            {/* Subscription Status */}
            <div className="mt-8 bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Subscription</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pro Plan - Active until Jan 15, 2025
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Conversations used:</span>
                  <span>1,234 / 1,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Chatbots:</span>
                  <span>2 / 5</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Manage Billing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Chatbot Modal */}
      <CreateChatbotModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleChatbotCreate}
      />
    </div>
    </AuthGuard>
  )
}
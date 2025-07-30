'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bot, Plus, Settings, FileText, Globe, BarChart3 } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { api, authUtils } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [chatbots, setChatbots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const [userResponse, chatbotsResponse] = await Promise.all([
        api.me(),
        api.getChatbots().catch(() => ({ chatbots: [] }))
      ])

      if (userResponse.success) {
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Salvebot</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Manage your chatbots and monitor their performance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bots</p>
                <p className="text-2xl font-bold">{chatbots.length}</p>
              </div>
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">45</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Domains</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chatbots List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Chatbots</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Chatbot
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Sample Chatbot Cards */}
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Customer Support Bot</h3>
                    <p className="text-sm text-muted-foreground">example.com</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Conversations</p>
                    <p className="font-medium">856</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Documents</p>
                    <p className="font-medium">12</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Active</p>
                    <p className="font-medium">2 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Product Help Bot</h3>
                    <p className="text-sm text-muted-foreground">shop.example.com</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Conversations</p>
                    <p className="font-medium">378</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Documents</p>
                    <p className="font-medium">33</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Active</p>
                    <p className="font-medium">5 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
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
    </div>
    </AuthGuard>
  )
}
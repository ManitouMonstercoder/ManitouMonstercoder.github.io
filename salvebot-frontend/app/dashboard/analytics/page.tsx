'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BotIcon, ArrowLeftIcon, BarChart3Icon, TrendingUpIcon, MessageSquareIcon, UsersIcon, ClockIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface AnalyticsData {
  overview: {
    totalConversations: number
    totalMessages: number
    activeUsers: number
    averageResponseTime: number
  }
  conversationsByDay: Array<{
    date: string
    conversations: number
    messages: number
  }>
  topQuestions: Array<{
    question: string
    count: number
  }>
  chatbotPerformance: Array<{
    chatbotId: string
    chatbotName: string
    conversations: number
    averageRating: number
  }>
}

interface Chatbot {
  id: string
  name: string
  domain: string
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('all')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedChatbotId) {
      loadAnalytics()
    }
  }, [selectedChatbotId, dateRange])

  const loadData = async () => {
    try {
      const chatbotsResponse = await api.getChatbots()
      setChatbots(chatbotsResponse.chatbots || [])
      
      if (chatbotsResponse.chatbots && chatbotsResponse.chatbots.length > 0) {
        setSelectedChatbotId('all')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load chatbots')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      setError('')
      
      const response = await api.getAnalytics(selectedChatbotId, dateRange)
      
      if (response.analytics) {
        setAnalytics(response.analytics)
      } else {
        // Mock data for demonstration
        setAnalytics({
          overview: {
            totalConversations: 1247,
            totalMessages: 3891,
            activeUsers: 892,
            averageResponseTime: 1.2
          },
          conversationsByDay: [
            { date: '2024-01-15', conversations: 45, messages: 152 },
            { date: '2024-01-16', conversations: 62, messages: 198 },
            { date: '2024-01-17', conversations: 38, messages: 127 },
            { date: '2024-01-18', conversations: 71, messages: 231 },
            { date: '2024-01-19', conversations: 89, messages: 287 },
            { date: '2024-01-20', conversations: 156, messages: 492 },
            { date: '2024-01-21', conversations: 134, messages: 398 }
          ],
          topQuestions: [
            { question: 'How do I reset my password?', count: 89 },
            { question: 'What are your business hours?', count: 67 },
            { question: 'How can I contact support?', count: 54 },
            { question: 'What payment methods do you accept?', count: 43 },
            { question: 'How do I cancel my subscription?', count: 31 }
          ],
          chatbotPerformance: chatbots.map((chatbot, index) => ({
            chatbotId: chatbot.id,
            chatbotName: chatbot.name,
            conversations: Math.floor(Math.random() * 500) + 100,
            averageRating: 4.2 + (Math.random() * 0.6)
          }))
        })
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setError('Failed to load analytics data')
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getMaxValue = (data: Array<{ conversations: number }>) => {
    return Math.max(...data.map(d => d.conversations))
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
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <BarChart3Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                      Monitor your chatbot performance and user engagement
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
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : chatbots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BotIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Chatbots Found</h2>
              <p className="text-muted-foreground mb-6">
                You need to create a chatbot first before viewing analytics.
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

              {/* Filters */}
              <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="chatbot" className="form-label mb-2">Chatbot</label>
                    <select
                      id="chatbot"
                      value={selectedChatbotId}
                      onChange={(e) => setSelectedChatbotId(e.target.value)}
                      className="form-input"
                    >
                      <option value="all">All Chatbots</option>
                      {chatbots.map((chatbot) => (
                        <option key={chatbot.id} value={chatbot.id}>
                          {chatbot.name} ({chatbot.domain})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dateRange" className="form-label mb-2">Date Range</label>
                    <select
                      id="dateRange"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="form-input"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {analytics && (
                <>
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Conversations</p>
                          <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalConversations)}</p>
                        </div>
                        <MessageSquareIcon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Messages</p>
                          <p className="text-2xl font-bold">{formatNumber(analytics.overview.totalMessages)}</p>
                        </div>
                        <TrendingUpIcon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Users</p>
                          <p className="text-2xl font-bold">{formatNumber(analytics.overview.activeUsers)}</p>
                        </div>
                        <UsersIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Response Time</p>
                          <p className="text-2xl font-bold">{analytics.overview.averageResponseTime}s</p>
                        </div>
                        <ClockIcon className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Conversations Chart */}
                  <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                    <h2 className="text-xl font-semibold mb-6">Conversations Over Time</h2>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {analytics.conversationsByDay.map((day, index) => {
                        const maxValue = getMaxValue(analytics.conversationsByDay)
                        const height = (day.conversations / maxValue) * 100
                        
                        return (
                          <div key={day.date} className="flex flex-col items-center flex-1">
                            <div
                              className="w-full bg-primary rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${day.conversations} conversations on ${formatDate(day.date)}`}
                            />
                            <p className="text-xs text-muted-foreground mt-2 transform -rotate-45">
                              {formatDate(day.date)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Questions */}
                    <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                      <h2 className="text-xl font-semibold mb-6">Most Asked Questions</h2>
                      <div className="space-y-4">
                        {analytics.topQuestions.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{item.question}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-sm font-medium">{item.count}</p>
                                <p className="text-xs text-muted-foreground">times</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chatbot Performance */}
                    <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                      <h2 className="text-xl font-semibold mb-6">Chatbot Performance</h2>
                      <div className="space-y-4">
                        {analytics.chatbotPerformance.map((bot) => (
                          <div key={bot.chatbotId} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <BotIcon className="h-6 w-6 text-primary" />
                              <div>
                                <p className="font-medium">{bot.chatbotName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {bot.conversations} conversations
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">★ {bot.averageRating.toFixed(1)}</p>
                              <p className="text-xs text-muted-foreground">rating</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
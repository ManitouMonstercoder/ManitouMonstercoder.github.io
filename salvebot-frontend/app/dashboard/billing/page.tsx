'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BotIcon, ArrowLeftIcon, CreditCardIcon, CheckCircle2Icon, AlertCircleIcon, ClockIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface BillingInfo {
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
  planName: string
  trialEndDate?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  customerId?: string
}

interface Usage {
  conversationsUsed: number
  conversationsLimit: number
  chatbotsUsed: number
  chatbotsLimit: number
  documentsUsed: number
  documentsLimit: number
}

export default function BillingPage() {
  const router = useRouter()
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const [userResponse, usageResponse] = await Promise.all([
        api.me(),
        api.getUsage().catch(() => ({ usage: null }))
      ])

      if (userResponse.user) {
        setBillingInfo({
          subscriptionStatus: (userResponse.user.subscriptionStatus as 'active' | 'inactive' | 'trial' | 'cancelled') || 'trial',
          planName: getPlanName(userResponse.user.subscriptionStatus),
          trialEndDate: userResponse.user.trialEndDate,
          // These would come from Stripe data in a real implementation
          currentPeriodStart: undefined,
          currentPeriodEnd: undefined,
          cancelAtPeriodEnd: false,
          customerId: undefined
        })
      }

      if (usageResponse.usage) {
        setUsage(usageResponse.usage)
      } else {
        // Default usage data
        setUsage({
          conversationsUsed: 0,
          conversationsLimit: 1000,
          chatbotsUsed: 0,
          chatbotsLimit: 5,
          documentsUsed: 0,
          documentsLimit: 100
        })
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
      setError('Failed to load billing information')
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanName = (status: string) => {
    switch (status) {
      case 'active': return 'Pro Plan'
      case 'trial': return 'Free Trial'
      case 'inactive': return 'Free Plan'
      case 'cancelled': return 'Cancelled'
      default: return 'Free Plan'
    }
  }

  const handleUpgradeSubscription = async (planId: string) => {
    try {
      setIsProcessing(true)
      setError('')

      const response = await api.createStripeSession(planId)
      
      if (response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout process')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setIsProcessing(true)
      setError('')

      const response = await api.createStripePortalSession()
      
      if (response.url) {
        // Redirect to Stripe customer portal
        window.location.href = response.url
      } else {
        throw new Error('Failed to access billing portal')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to access billing portal')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2Icon className="h-5 w-5 text-green-600" />
      case 'trial':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
      case 'cancelled':
      case 'inactive':
        return <AlertCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trial':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
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
                    <CreditCardIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Billing & Usage</h1>
                    <p className="text-sm text-muted-foreground">
                      Manage your subscription and monitor usage
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
                <p className="text-muted-foreground">Loading billing information...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl">
                  <div className="flex items-center">
                    <AlertCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl">
                  <div className="flex items-center">
                    <CheckCircle2Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">{successMessage}</span>
                  </div>
                </div>
              )}

              {/* Current Subscription */}
              <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Current Subscription</h2>
                  {billingInfo && (
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${getStatusColor(billingInfo.subscriptionStatus)}`}>
                      {getStatusIcon(billingInfo.subscriptionStatus)}
                      <span className="capitalize">{billingInfo.subscriptionStatus}</span>
                    </div>
                  )}
                </div>

                {billingInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-4">Plan Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium">{billingInfo.planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium capitalize">{billingInfo.subscriptionStatus}</span>
                        </div>
                        {billingInfo.trialEndDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trial Ends:</span>
                            <span className="font-medium">{formatDate(billingInfo.trialEndDate)}</span>
                          </div>
                        )}
                        {billingInfo.currentPeriodEnd && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Billing:</span>
                            <span className="font-medium">{formatDate(billingInfo.currentPeriodEnd)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Actions</h3>
                      <div className="space-y-3">
                        {billingInfo.subscriptionStatus === 'trial' || billingInfo.subscriptionStatus === 'inactive' ? (
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleUpgradeSubscription('pro')}
                              disabled={isProcessing}
                              className="w-full btn-hover"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCardIcon className="h-4 w-4 mr-2" />
                                  Upgrade to Pro
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleUpgradeSubscription('starter')}
                              disabled={isProcessing}
                              variant="outline"
                              className="w-full btn-hover"
                            >
                              Start with Starter Plan
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={handleManageSubscription}
                            disabled={isProcessing}
                            className="w-full btn-hover"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <CreditCardIcon className="h-4 w-4 mr-2" />
                                Manage Subscription
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Usage Statistics */}
              {usage && (
                <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                  <h2 className="text-xl font-semibold mb-6">Usage Statistics</h2>
                  
                  <div className="grid gap-6">
                    {/* Conversations */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Conversations</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.conversationsUsed.toLocaleString()} / {usage.conversationsLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usage.conversationsUsed, usage.conversationsLimit))}`}
                          style={{ width: `${getUsagePercentage(usage.conversationsUsed, usage.conversationsLimit)}%` }}
                        />
                      </div>
                    </div>

                    {/* Chatbots */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Chatbots</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.chatbotsUsed} / {usage.chatbotsLimit}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usage.chatbotsUsed, usage.chatbotsLimit))}`}
                          style={{ width: `${getUsagePercentage(usage.chatbotsUsed, usage.chatbotsLimit)}%` }}
                        />
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Documents</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.documentsUsed} / {usage.documentsLimit}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(usage.documentsUsed, usage.documentsLimit))}`}
                          style={{ width: `${getUsagePercentage(usage.documentsUsed, usage.documentsLimit)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Plans */}
              <div className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Starter Plan */}
                  <div className="border border-border rounded-lg p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Starter</h3>
                      <div className="text-3xl font-bold mt-2">$29<span className="text-sm text-muted-foreground">/month</span></div>
                    </div>
                    <ul className="space-y-2 text-sm mb-6">
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        500 conversations/month
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        2 chatbots
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        50 documents
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        Email support
                      </li>
                    </ul>
                  </div>

                  {/* Pro Plan */}
                  <div className="border-2 border-primary rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Pro</h3>
                      <div className="text-3xl font-bold mt-2">$99<span className="text-sm text-muted-foreground">/month</span></div>
                    </div>
                    <ul className="space-y-2 text-sm mb-6">
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        2,000 conversations/month
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        5 chatbots
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        200 documents
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        Priority support
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600 mr-2" />
                        Advanced analytics
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
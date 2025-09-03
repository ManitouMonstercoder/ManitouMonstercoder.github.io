'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BotIcon, ArrowLeftIcon, GlobeIcon, CheckCircle2Icon, AlertCircleIcon, ClockIcon, CopyIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface DomainVerification {
  id: string
  chatbotId: string
  domain: string
  isVerified: boolean
  verificationToken: string
  verificationMethod: 'dns' | 'file'
  createdAt: string
  verifiedAt?: string
}

interface Chatbot {
  id: string
  name: string
  domain: string
  isVerified: boolean
}

export default function DomainsPage() {
  const router = useRouter()
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [domains, setDomains] = useState<DomainVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const chatbotsResponse = await api.getChatbots()
      setChatbots(chatbotsResponse.chatbots || [])
      
      // Load domain verification data for each chatbot
      if (chatbotsResponse.chatbots) {
        const domainsData = await Promise.all(
          chatbotsResponse.chatbots.map(async (chatbot: Chatbot) => {
            try {
              const domainResponse = await api.getDomainVerification(chatbot.id)
              // Transform backend response to match frontend expectations
              return {
                id: `domain-${chatbot.id}`,
                chatbotId: chatbot.id,
                domain: domainResponse.domain,
                isVerified: domainResponse.isVerified,
                verificationToken: domainResponse.verification?.token || '',
                verificationMethod: domainResponse.verification?.method || 'dns' as const,
                createdAt: domainResponse.verification?.createdAt || new Date().toISOString(),
                verifiedAt: domainResponse.verification?.verifiedAt
              }
            } catch (err) {
              // Return a default structure if no verification exists
              return {
                id: `temp-${chatbot.id}`,
                chatbotId: chatbot.id,
                domain: chatbot.domain,
                isVerified: chatbot.isVerified,
                verificationToken: '',
                verificationMethod: 'dns' as const,
                createdAt: new Date().toISOString()
              }
            }
          })
        )
        setDomains(domainsData.filter(Boolean))
      }
    } catch (error) {
      console.error('Failed to load domains:', error)
      setError('Failed to load domain verification data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartVerification = async (chatbotId: string, method: 'dns' | 'file') => {
    try {
      setIsVerifying(chatbotId)
      setError('')
      
      const response = await api.startDomainVerification(chatbotId, method)
      
      // Update the domains list with the new verification data
      setDomains(prev => prev.map(domain => 
        domain.chatbotId === chatbotId 
          ? { 
              ...domain, 
              verificationToken: response.verification.token,
              verificationMethod: method
            }
          : domain
      ))
      
      setSuccessMessage('Domain verification started! Follow the instructions below.')
    } catch (err: any) {
      setError(err.message || 'Failed to start domain verification')
    } finally {
      setIsVerifying(null)
    }
  }

  const handleVerifyDomain = async (chatbotId: string) => {
    try {
      setIsVerifying(chatbotId)
      setError('')
      
      const response = await api.verifyDomain(chatbotId)
      
      if (response.verified) {
        // Update both domains and chatbots lists
        setDomains(prev => prev.map(domain => 
          domain.chatbotId === chatbotId 
            ? { ...domain, isVerified: true, verifiedAt: new Date().toISOString() }
            : domain
        ))
        
        setChatbots(prev => prev.map(chatbot =>
          chatbot.id === chatbotId
            ? { ...chatbot, isVerified: true }
            : chatbot
        ))
        
        setSuccessMessage('Domain verified successfully! Your chatbot is now active.')
      } else {
        setError('Domain verification failed. Please check your DNS records or verification file.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify domain')
    } finally {
      setIsVerifying(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccessMessage('Copied to clipboard!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const getVerificationInstructions = (domain: DomainVerification) => {
    if (!domain.verificationToken) return null

    if (domain.verificationMethod === 'dns') {
      return (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">DNS Verification Instructions</h4>
          <ol className="space-y-2 text-sm">
            <li>1. Go to your domain's DNS settings</li>
            <li>2. Add a new TXT record:</li>
          </ol>
          <div className="bg-background p-3 rounded border mt-2 font-mono text-sm">
            <div className="flex items-center justify-between">
              <div>
                <strong>Name:</strong> _salvebot-verification<br />
                <strong>Value:</strong> salvebot-verification={domain.verificationToken}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`salvebot-verification=${domain.verificationToken}`)}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            DNS changes may take up to 24 hours to propagate.
          </p>
        </div>
      )
    } else {
      const verificationFile = `salvebot-verification.txt`
      const fileContent = `salvebot-verification=${domain.verificationToken}`
      const fileUrl = `https://${domain.domain}/.well-known/${verificationFile}`
      
      return (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">File Upload Verification Instructions</h4>
          <ol className="space-y-2 text-sm">
            <li>1. Create a file named: <code className="bg-background px-2 py-1 rounded">{verificationFile}</code></li>
            <li>2. Add this content to the file:</li>
          </ol>
          <div className="bg-background p-3 rounded border mt-2 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span>{fileContent}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(fileContent)}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ol start={3} className="space-y-2 text-sm mt-2">
            <li>3. Upload the file to your website's /.well-known/ directory</li>
            <li>4. Make sure it's accessible at: <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{fileUrl}</a></li>
          </ol>
        </div>
      )
    }
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
                    <GlobeIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Domain Verification</h1>
                    <p className="text-sm text-muted-foreground">
                      Verify your domains to activate your chatbots
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
                <p className="text-muted-foreground">Loading domains...</p>
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

              {chatbots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BotIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No Chatbots Found</h2>
                  <p className="text-muted-foreground mb-6">
                    You need to create a chatbot first before verifying domains.
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
                <div className="grid gap-6">
                  {chatbots.map((chatbot) => {
                    const domain = domains.find(d => d.chatbotId === chatbot.id)
                    const isCurrentlyVerifying = isVerifying === chatbot.id

                    return (
                      <div key={chatbot.id} className="bg-card p-6 rounded-xl border border-border/50 card-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <BotIcon className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="text-lg font-semibold">{chatbot.name}</h3>
                              <p className="text-sm text-muted-foreground">{chatbot.domain}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {chatbot.isVerified ? (
                              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                <CheckCircle2Icon className="h-4 w-4" />
                                <span>Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                <ClockIcon className="h-4 w-4" />
                                <span>Pending</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!chatbot.isVerified && (
                          <div className="space-y-4">
                            {!domain?.verificationToken ? (
                              <div>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Choose a verification method to get started:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Button
                                    variant="outline"
                                    disabled={isCurrentlyVerifying}
                                    onClick={() => handleStartVerification(chatbot.id, 'dns')}
                                    className="btn-hover h-auto p-4 text-left"
                                  >
                                    <div>
                                      <div className="font-medium">DNS Verification</div>
                                      <div className="text-sm text-muted-foreground">
                                        Add a TXT record to your DNS settings
                                      </div>
                                    </div>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    disabled={isCurrentlyVerifying}
                                    onClick={() => handleStartVerification(chatbot.id, 'file')}
                                    className="btn-hover h-auto p-4 text-left"
                                  >
                                    <div>
                                      <div className="font-medium">File Upload</div>
                                      <div className="text-sm text-muted-foreground">
                                        Upload a verification file to your website
                                      </div>
                                    </div>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {getVerificationInstructions(domain)}
                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                  <p className="text-sm text-muted-foreground">
                                    Complete the instructions above, then verify your domain.
                                  </p>
                                  <Button
                                    disabled={isCurrentlyVerifying}
                                    onClick={() => handleVerifyDomain(chatbot.id)}
                                    className="btn-hover"
                                  >
                                    {isCurrentlyVerifying ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                        Verifying...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2Icon className="h-4 w-4 mr-2" />
                                        Verify Domain
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {chatbot.isVerified && domain?.verifiedAt && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-800">
                              ✅ Domain verified on {new Date(domain.verifiedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
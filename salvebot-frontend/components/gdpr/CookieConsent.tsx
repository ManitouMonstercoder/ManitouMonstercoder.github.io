'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { XIcon, ShieldIcon } from '@/components/icons'

interface ConsentPreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already made consent choice
    const hasConsent = localStorage.getItem('cookie-consent')
    if (!hasConsent) {
      setIsVisible(true)
    }
  }, [])

  const acceptAll = () => {
    const allPreferences: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    }
    setPreferences(allPreferences)
    saveConsent(allPreferences)
    setIsVisible(false)
  }

  const acceptSelected = () => {
    saveConsent(preferences)
    setIsVisible(false)
  }

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs))
    
    // Here you would typically initialize analytics/marketing scripts based on preferences
    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics)
      console.log('Analytics consent granted')
    }
    
    if (prefs.marketing) {
      // Initialize marketing scripts
      console.log('Marketing consent granted')
    }
  }

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'necessary') return // Necessary cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/40 p-6 animate-in slide-in-from-bottom">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left side - Main content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <ShieldIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Privacy & Cookies</h3>
            </div>
            
            <p className="text-muted-foreground mb-4 max-w-2xl">
              We use cookies and similar technologies to help personalize content, tailor and measure ads, 
              and provide a better experience. By clicking accept all, you agree to our use of cookies.
            </p>
            
            {/* Detailed preferences */}
            {showDetails && (
              <div className="bg-card p-4 rounded-lg border border-border/50 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">Required for the site to function properly</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="h-4 w-4 text-primary rounded border-border"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">Help us understand how visitors interact with our site</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => updatePreference('analytics', e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-border"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Marketing Cookies</h4>
                    <p className="text-sm text-muted-foreground">Used to personalize ads and measure marketing effectiveness</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => updatePreference('marketing', e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showDetails ? 'Hide' : 'Customize'}
              </Button>
              
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptSelected}
                disabled={!showDetails}
                className="btn-hover"
              >
                Accept Selected
              </Button>
              
              <Button
                size="sm"
                onClick={acceptAll}
                className="btn-hover btn-shadow"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <XIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// Add this import at the top
import Link from 'next/link'

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BotIcon } from '@/components/icons'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [showSignupButton, setShowSignupButton] = useState(false)
  const [showContactSupport, setShowContactSupport] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    setShowSignupButton(false)
    setShowContactSupport(false)

    if (!email) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.requestPasswordReset(email)
      setSuccess(response.message || 'Password reset link sent to your email')
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      
      // Check if user needs to sign up
      if (errorMessage.includes('No account found') || errorMessage.includes('Please create a free account')) {
        setShowSignupButton(true)
      }
      
      // Check if user needs to contact support
      if (errorMessage.includes('contact support') || errorMessage.includes('Too many')) {
        setShowContactSupport(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 py-12">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-card p-10 rounded-3xl border border-border/50 card-shadow-lg">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
              <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                <BotIcon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-2xl font-semibold">Salvebot</span>
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Reset your password</h1>
            <p className="text-lg text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>
        
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl mb-8 animate-fade-in">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-destructive text-xs">!</span>
                </div>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-8 animate-fade-in">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-green-800 text-xs">✓</span>
                </div>
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}
        
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email address"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-hover py-4 text-base font-medium shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {showSignupButton && (
            <div className="mt-4">
              <Link href="/signup">
                <Button 
                  className="w-full btn-hover py-4 text-base font-medium bg-green-600 hover:bg-green-700" 
                >
                  Create Free Account
                </Button>
              </Link>
            </div>
          )}

          {showContactSupport && (
            <div className="mt-4">
              <Button 
                onClick={() => window.open('mailto:support@salvebot.com?subject=Password Reset Support Request', '_blank')}
                className="w-full btn-hover py-4 text-base font-medium bg-orange-600 hover:bg-orange-700" 
              >
                Contact Support
              </Button>
            </div>
          )}
          
          <div className="text-center pt-6 border-t border-border/50">
            <p className="text-muted-foreground">
              Remember your password?{' '}
              <Link href="/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
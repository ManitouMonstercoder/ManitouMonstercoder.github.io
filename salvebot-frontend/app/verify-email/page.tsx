'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BotIcon } from '@/components/icons'
import { api, authUtils } from '@/lib/api'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!email || !code) {
      setError('Please enter both email and verification code')
      setIsLoading(false)
      return
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.verifyEmail(email, code)

      if (response.success && response.token) {
        authUtils.saveToken(response.token)
        setSuccess('Email verified successfully! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(response.message || 'Failed to verify email')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    // This would need a resend endpoint, but for now we'll just show a message
    setError('Please contact support to resend verification code')
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
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Verify your email</h1>
            <p className="text-lg text-muted-foreground">
              Enter the 6-digit code we sent to your email address
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
            
            <div className="space-y-2">
              <label htmlFor="code" className="form-label">
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="form-input text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your email
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-hover py-4 text-base font-medium shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
          
          <div className="text-center pt-6 border-t border-border/50 space-y-4">
            <p className="text-muted-foreground">
              Didn't receive the code?{' '}
              <button 
                onClick={handleResendCode}
                className="text-primary hover:underline font-medium"
              >
                Resend code
              </button>
            </p>
            <p className="text-muted-foreground">
              <Link href="/signin" className="text-primary hover:underline font-medium">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
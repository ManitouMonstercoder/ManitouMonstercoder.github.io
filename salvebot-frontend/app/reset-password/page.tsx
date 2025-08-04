'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BotIcon } from '@/components/icons'
import { api } from '@/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Get token from URL parameters on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tokenParam = urlParams.get('token')
      if (tokenParam) {
        setToken(tokenParam)
      } else {
        setError('Invalid reset link. Please request a new password reset.')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid reset token')
      setIsLoading(false)
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.resetPassword(token, newPassword)
      
      if (response.success) {
        setSuccess('Password reset successfully! Redirecting to sign in...')
        setTimeout(() => {
          router.push('/signin')
        }, 2000)
      } else {
        setError(response.message || 'Failed to reset password')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
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
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Set new password</h1>
            <p className="text-lg text-muted-foreground">
              Enter your new password below
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
              <label htmlFor="newPassword" className="form-label">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your new password"
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm your new password"
                minLength={8}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-hover py-4 text-base font-medium shadow-lg" 
              disabled={isLoading || !token}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
          
          <div className="text-center pt-6 border-t border-border/50">
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
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BotIcon } from '@/components/icons'
import { api, authUtils } from '@/lib/api'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await api.signin({
        email: formData.email,
        password: formData.password
      })

      if (response.token) {
        authUtils.saveToken(response.token)
        router.push('/dashboard')
      } else {
        setError(response.message || 'Failed to sign in')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signin')
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
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Welcome back</h1>
            <p className="text-lg text-muted-foreground">
              Or{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                create a new account
              </Link>
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
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-primary focus:ring-primary border-border rounded-md"
                />
                <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>
              
              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-hover py-4 text-base font-medium shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="text-center pt-6 border-t border-border/50">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
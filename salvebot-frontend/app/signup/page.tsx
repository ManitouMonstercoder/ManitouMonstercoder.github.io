'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'
import { api, authUtils } from '@/lib/api'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    terms: false
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

    if (!formData.terms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company || undefined
      })

      if (response.token) {
        authUtils.saveToken(response.token)
        router.push('/dashboard')
      } else {
        setError(response.message || 'Failed to create account')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
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
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <span className="text-2xl font-semibold">Salvebot</span>
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Create your account</h1>
            <p className="text-lg text-muted-foreground">
              Start your free trial today. No credit card required.
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
              <label htmlFor="name" className="form-label">
                Full name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your real first and last name"
                minLength={2}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Please enter your real first and last name as it appears on official documents
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="form-label">
                Business email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your professional email address"
              />
              <p className="text-xs text-muted-foreground">
                Please use a professional email. Temporary/disposable emails are not allowed.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Create a strong password"
                minLength={8}
                maxLength={128}
              />
              <p className="text-xs text-muted-foreground">
                Must contain at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company" className="form-label">
                Company name (optional)
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your company name"
              />
            </div>
          
            <div className="flex items-start space-x-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={formData.terms}
                onChange={handleInputChange}
                className="mt-1 h-5 w-5 text-primary focus:ring-primary border-border rounded-md"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-hover py-4 text-base font-medium shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="text-center pt-6 border-t border-border/50">
            <p className="text-muted-foreground">
              Already have an account?{' '}
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
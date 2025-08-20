'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BotIcon } from '@/components/icons'
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
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noSpaces: false
  })
  const [nameValidation, setNameValidation] = useState({
    isValid: false,
    message: ''
  })

  const validatePassword = (password: string) => {
    setPasswordValidation({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noSpaces: !/\s/.test(password)
    })
  }

  const validateName = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName.length < 3) {
      setNameValidation({
        isValid: false,
        message: 'Full name must be at least 3 characters'
      })
    } else if (!/^[a-zA-Z]+(\s+[a-zA-Z]+)+$/.test(trimmedName)) {
      setNameValidation({
        isValid: false,
        message: 'Please enter your full name (first and last name required)'
      })
    } else {
      setNameValidation({
        isValid: true,
        message: ''
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Real-time validation
    if (name === 'password') {
      validatePassword(value)
    } else if (name === 'name') {
      validateName(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate form before submission
    if (!nameValidation.isValid) {
      setError(nameValidation.message || 'Please enter a valid full name')
      setIsLoading(false)
      return
    }

    const isPasswordValid = Object.values(passwordValidation).every(valid => valid)
    if (!isPasswordValid) {
      setError('Password does not meet security requirements')
      setIsLoading(false)
      return
    }

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

      if (response.success && response.requiresVerification) {
        // Redirect to email verification page
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else if (response.token) {
        // User is already verified or verification not required
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
                <BotIcon className="h-7 w-7 text-primary" />
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
                className={`form-input ${formData.name && !nameValidation.isValid ? 'border-destructive' : formData.name && nameValidation.isValid ? 'border-green-500' : ''}`}
                placeholder="Enter your real first and last name"
                minLength={3}
                maxLength={100}
              />
              {formData.name && !nameValidation.isValid && (
                <p className="text-xs text-destructive">{nameValidation.message}</p>
              )}
              {formData.name && nameValidation.isValid && (
                <p className="text-xs text-green-600">✓ Full name is valid</p>
              )}
              {!formData.name && (
                <p className="text-xs text-muted-foreground">
                  Please enter your real first and last name (e.g., "John Smith")
                </p>
              )}
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
                minLength={12}
                maxLength={128}
              />
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.length ? '✓' : '○'}</span>
                    At least 12 characters
                  </div>
                  <div className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.uppercase ? '✓' : '○'}</span>
                    One uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.lowercase ? '✓' : '○'}</span>
                    One lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.number ? '✓' : '○'}</span>
                    One number (0-9)
                  </div>
                  <div className={`flex items-center ${passwordValidation.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className="mr-2">{passwordValidation.special ? '✓' : '○'}</span>
                    One special character (!@#$%^&*...)
                  </div>
                  <div className={`flex items-center ${passwordValidation.noSpaces ? 'text-green-600' : 'text-destructive'}`}>
                    <span className="mr-2">{passwordValidation.noSpaces ? '✓' : '✗'}</span>
                    No spaces allowed
                  </div>
                </div>
              )}
              {!formData.password && (
                <p className="text-xs text-muted-foreground">
                  Create a strong password with at least 12 characters including uppercase, lowercase, numbers, and special characters
                </p>
              )}
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
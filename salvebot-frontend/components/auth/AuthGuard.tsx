'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authUtils, api } from '@/lib/api'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/signin' }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = authUtils.getToken()
      
      if (!token) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        // Verify token with backend
        const response = await api.me()
        if (response.user || response.token) {
          setIsAuthenticated(true)
        } else {
          authUtils.removeToken()
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        authUtils.removeToken()
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated === false && !isLoading) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
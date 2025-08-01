'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Bot, Globe, Palette, MessageSquare } from 'lucide-react'
import { api } from '@/lib/api'

interface CreateChatbotModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (chatbot: any) => void
}

export function CreateChatbotModal({ isOpen, onClose, onSuccess }: CreateChatbotModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    welcomeMessage: 'Hello! How can I help you today?',
    theme: 'light',
    position: 'bottom-right'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Basic validation
    if (!formData.name.trim()) {
      setError('Chatbot name is required')
      setIsLoading(false)
      return
    }

    if (!formData.domain.trim()) {
      setError('Domain is required')
      setIsLoading(false)
      return
    }

    // Simple domain validation
    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(formData.domain.trim())) {
      setError('Please enter a valid domain (e.g., example.com)')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.createChatbot({
        name: formData.name.trim(),
        domain: formData.domain.trim(),
        welcomeMessage: formData.welcomeMessage.trim(),
        theme: formData.theme,
        position: formData.position
      })

      onSuccess(response.chatbot)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        domain: '',
        welcomeMessage: 'Hello! How can I help you today?',
        theme: 'light',
        position: 'bottom-right'
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create chatbot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card max-w-2xl w-full rounded-3xl border border-border/50 card-shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Create New Chatbot</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl animate-fade-in">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-destructive text-xs">!</span>
                </div>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Bot className="h-5 w-5 mr-2 text-primary" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="form-label">
                  Chatbot Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Customer Support Bot"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="domain" className="form-label">
                  Domain *
                </label>
                <input
                  id="domain"
                  name="domain"
                  type="text"
                  required
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="example.com"
                />
                <p className="text-xs text-muted-foreground">
                  The domain where this chatbot will be deployed
                </p>
              </div>
            </div>
          </div>

          {/* Customization */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Palette className="h-5 w-5 mr-2 text-primary" />
              Customization
            </h3>

            <div className="space-y-2">
              <label htmlFor="welcomeMessage" className="form-label">
                Welcome Message
              </label>
              <textarea
                id="welcomeMessage"
                name="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={handleInputChange}
                className="form-input min-h-[80px] resize-none"
                placeholder="Hello! How can I help you today?"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                The first message users see when they open the chat
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="theme" className="form-label">
                  Theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="position" className="form-label">
                  Position
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-hover"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Create Chatbot
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
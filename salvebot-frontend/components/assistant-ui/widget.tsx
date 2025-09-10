'use client'

import { useState, useEffect } from 'react'
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { Thread } from "./thread"
import { useChatRuntime } from "@assistant-ui/react-ai-sdk"
import { Button } from '@/components/ui/button'
import { XIcon } from '@/components/icons'

interface ChatWidgetProps {
  chatbotId: string
  domain: string
  theme?: 'light' | 'dark'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  welcomeMessage?: string
}

const ChatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6"
  >
    <path
      fillRule="evenodd"
      d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97z"
      clipRule="evenodd"
    />
  </svg>
)

export function ChatWidget({ 
  chatbotId, 
  domain, 
  theme = 'light',
  position = 'bottom-right',
  welcomeMessage = 'Hello! How can I help you today?'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const runtime = useChatRuntime()

  useEffect(() => {
    // Mark widget as loaded once runtime is ready
    if (runtime) {
      setIsLoaded(true)
    }
  }, [runtime])

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  const getChatPosition = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-20 left-0'
      case 'top-right':
        return 'top-20 right-0'
      case 'top-left':
        return 'top-20 left-0'
      default:
        return 'bottom-20 right-0'
    }
  }

  if (!isLoaded || !runtime) {
    return null
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-[9999] font-sans`}>
      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute ${getChatPosition()} w-96 h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : ''}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <ChatIcon />
              </div>
              <div>
                <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  AI Assistant
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Online
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className={`h-8 w-8 p-0 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200'}`}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Interface */}
          <div className="h-[calc(100%-73px)]">
            <AssistantRuntimeProvider runtime={runtime}>
              <Thread />
            </AssistantRuntimeProvider>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        size="sm"
      >
        {isOpen ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <ChatIcon />
        )}
      </Button>
    </div>
  )
}
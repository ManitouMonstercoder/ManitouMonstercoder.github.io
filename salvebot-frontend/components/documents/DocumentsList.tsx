'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileTextIcon, Trash2Icon, DownloadIcon, AlertCircleIcon, CheckCircle2Icon, ClockIcon, MoreVerticalIcon } from '@/components/icons'
import { api } from '@/lib/api'

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: 'processing' | 'ready' | 'error'
  uploadedAt: string
}

interface DocumentsListProps {
  documents: Document[]
  onDocumentDelete?: (documentId: string) => void
  onDocumentUpdate?: () => void
}

export function DocumentsList({ documents, onDocumentDelete, onDocumentUpdate }: DocumentsListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileTypeIcon = (fileType: string) => {
    return <FileTextIcon className="h-5 w-5" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2Icon className="h-4 w-4 text-green-600" />
      case 'processing':
        return <ClockIcon className="h-4 w-4 text-brand" />
      case 'error':
        return <AlertCircleIcon className="h-4 w-4 text-destructive" />
      default:
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready'
      case 'processing':
        return 'Processing'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'status-active'
      case 'processing':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand'
      case 'error':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive'
      default:
        return 'status-inactive'
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setLoadingStates(prev => ({ ...prev, [documentId]: true }))

    try {
      await api.deleteDocument(documentId)
      onDocumentDelete?.(documentId)
      onDocumentUpdate?.()
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(error.message || 'Failed to delete document')
    } finally {
      setLoadingStates(prev => ({ ...prev, [documentId]: false }))
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <FileTextIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Upload your first document to start training your chatbot with your business knowledge.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
      </div>

      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-card p-6 rounded-2xl border border-border/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  {getFileTypeIcon(document.fileType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {document.fileName}
                    </h4>
                    <div className={getStatusColor(document.status)}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{getStatusText(document.status)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>•</span>
                    <span>Uploaded {formatDate(document.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(document.id)}
                  disabled={loadingStates[document.id]}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {loadingStates[document.id] ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2Icon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {document.status === 'error' && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center text-sm text-destructive">
                  <AlertCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Failed to process this document. Please try uploading again.</span>
                </div>
              </div>
            )}

            {document.status === 'processing' && (
              <div className="mt-4 p-3 bg-brand/10 border border-brand/20 rounded-lg">
                <div className="flex items-center text-sm text-brand">
                  <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Processing document and generating embeddings...</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
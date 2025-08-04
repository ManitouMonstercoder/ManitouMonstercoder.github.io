'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { UploadIcon, FileTextIcon, AlertCircleIcon, CheckCircle2Icon, XIcon, Loader2Icon } from '@/components/icons'
import { api } from '@/lib/api'

interface DocumentUploadProps {
  chatbotId: string
  onUploadSuccess?: (document: any) => void
  onUploadError?: (error: string) => void
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  documentId?: string
  error?: string
}

export function DocumentUpload({ chatbotId, onUploadSuccess, onUploadError }: DocumentUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/x-markdown'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      return 'Only PDF, TXT, and MD files are supported'
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }

    return null
  }

  const handleFiles = async (files: File[]) => {
    const validFiles: File[] = []
    
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        onUploadError?.(error)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Add files to uploading state
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Process each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      
      try {
        // Update progress
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { ...uf, progress: 25 } : uf
        ))

        const result = await api.uploadDocument(file, chatbotId)
        
        // Update to processing
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { 
            ...uf, 
            progress: 50, 
            status: 'processing',
            documentId: result.document.id 
          } : uf
        ))

        // Simulate processing time (in real app, you'd poll for status)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Mark as completed
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { 
            ...uf, 
            progress: 100, 
            status: 'completed' 
          } : uf
        ))

        onUploadSuccess?.(result.document)

      } catch (error: any) {
        console.error('Upload error:', error)
        
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { 
            ...uf, 
            status: 'error',
            error: error.message || 'Upload failed'
          } : uf
        ))

        onUploadError?.(error.message || 'Upload failed')
      }
    }
  }

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <UploadIcon className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, TXT, and MD files up to 10MB
            </p>
          </div>

          <Button>
            <UploadIcon className="h-4 w-4 mr-2" />
            Choose Files
          </Button>

          <input
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Processing Files</h4>
          
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="bg-card p-4 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileTextIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{uploadingFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploadingFile.status === 'uploading' && (
                    <Loader2Icon className="h-4 w-4 text-primary animate-spin" />
                  )}
                  {uploadingFile.status === 'processing' && (
                    <Loader2Icon className="h-4 w-4 text-brand animate-spin" />
                  )}
                  {uploadingFile.status === 'completed' && (
                    <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                  )}
                  {uploadingFile.status === 'error' && (
                    <AlertCircleIcon className="h-4 w-4 text-destructive" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(uploadingFile.file)}
                    className="h-8 w-8 p-0"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {uploadingFile.status !== 'error' && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {uploadingFile.status === 'uploading' && 'Uploading...'}
                      {uploadingFile.status === 'processing' && 'Processing...'}
                      {uploadingFile.status === 'completed' && 'Completed'}
                    </span>
                    <span>{uploadingFile.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        uploadingFile.status === 'completed' 
                          ? 'bg-green-600' 
                          : 'bg-primary'
                      }`}
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadingFile.status === 'error' && uploadingFile.error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                  {uploadingFile.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
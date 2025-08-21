'use client'

import * as React from 'react'
import { Upload, X, File, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  accept?: string
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
  file?: File | null
  preview?: string | null
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
  file,
  preview,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    onFileSelect(selectedFile)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onFileRemove?.()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = file?.type.startsWith('image/')

  return (
    <div className={cn('w-full', className)}>
      {!file ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            isDragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50'
              : 'border-gray-300 dark:border-gray-600',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-primary-400 cursor-pointer'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            {/* File preview */}
            <div className="flex-shrink-0">
              {isImage && preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {isImage ? (
                    <Image className="h-8 w-8 text-gray-400" />
                  ) : (
                    <File className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {file.type}
              </p>
            </div>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified version for avatar uploads
interface AvatarUploadProps {
  onFileSelect: (file: File) => void
  currentAvatar?: string | null
  className?: string
  disabled?: boolean
}

export function AvatarUpload({
  onFileSelect,
  currentAvatar,
  className,
  disabled = false,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit for avatars
      alert('Avatar file size must be less than 5MB')
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    onFileSelect(selectedFile)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <button
        type="button"
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          'relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-800">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <Upload className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </button>
    </div>
  )
}

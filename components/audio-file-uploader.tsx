"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, File, X } from "lucide-react"

interface AudioFileUploaderProps {
  onFileSelected: (file: File) => void
  isProcessing?: boolean
}

export function AudioFileUploader({ onFileSelected, isProcessing }: AudioFileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const acceptedFormats = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'video/mp4',
    'video/webm',
  ]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    if (!acceptedFormats.includes(file.type) && !file.name.match(/\.(wav|mp3|mp4|m4a|ogg|webm|flac)$/i)) {
      alert('Please upload a valid audio file (WAV, MP3, MP4, M4A, OGG, WebM, or FLAC)')
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      alert('File size must be less than 100MB')
      return
    }

    setSelectedFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleUploadClick = () => {
    if (selectedFile) {
      onFileSelected(selectedFile)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Upload Area */}
          <div
            className={`w-full rounded-lg border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30'
            } ${selectedFile ? 'p-4' : 'p-12'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              /* Selected File Display */
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <File className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  disabled={isProcessing}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              /* Upload Prompt */
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    Drop your audio file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Supports WAV, MP3, MP4, M4A, OGG, WebM, FLAC (max 100MB)
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <Button
              className="flex-1"
              onClick={handleUploadClick}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Upload & Transcribe'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

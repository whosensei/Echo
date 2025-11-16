"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Download, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"
import { decryptAudioFile, isWebCryptoAvailable, type DecryptionParams } from "@/lib/encryption-service"
import { getGlobalPassword, getEncryptionPassword } from "@/lib/key-storage"
import { toast } from "sonner"

interface EncryptedAudioDownloadButtonProps {
  recordingId: string
  className?: string
}

export function EncryptedAudioDownloadButton({
  recordingId,
  className,
}: EncryptedAudioDownloadButtonProps) {
  const [audioData, setAudioData] = useState<{
    audioUrl: string
    isEncrypted: boolean
    encryptionIV?: string | null
    encryptionSalt?: string | null
    encryptionPassword?: string | null
    filename?: string
  } | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Fetch audio URL and encryption metadata
  useEffect(() => {
    let isCancelled = false

    const fetchAudioData = async () => {
      try {
        setIsFetching(true)
        setFetchError(null)

        const response = await fetch(`/api/recordings/${recordingId}/audio-url`)
        if (!response.ok) {
          throw new Error("Failed to fetch audio URL")
        }

        const data = await response.json()
        if (!isCancelled) {
          // Extract filename from audioUrl if possible, otherwise use default
          let filename = `recording-${recordingId}.wav`
          try {
            const url = new URL(data.audioUrl)
            const pathParts = url.pathname.split('/')
            const lastPart = pathParts[pathParts.length - 1]
            // Remove query parameters if present
            const cleanFilename = lastPart.split('?')[0]
            if (cleanFilename && cleanFilename.length > 0) {
              // Remove 'encrypted_' prefix if present and restore original extension
              filename = cleanFilename.replace(/^encrypted_/, '')
              // Ensure .wav extension if not present
              if (!filename.match(/\.(wav|mp3|m4a|ogg|webm|flac)$/i)) {
                filename = filename.replace(/\.[^.]+$/, '') + '.wav'
              }
            }
          } catch (e) {
            // Use default filename if URL parsing fails
          }

          setAudioData({
            audioUrl: data.audioUrl,
            isEncrypted: data.isEncrypted || false,
            encryptionIV: data.encryptionIV || null,
            encryptionSalt: data.encryptionSalt || null,
            encryptionPassword: data.encryptionPassword || null,
            filename,
          })
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching audio data:", error)
          setFetchError(error instanceof Error ? error.message : "Failed to fetch audio data")
        }
      } finally {
        if (!isCancelled) {
          setIsFetching(false)
        }
      }
    }

    fetchAudioData()

    return () => {
      isCancelled = true
    }
  }, [recordingId])

  const handleDownload = async (password?: string) => {
    if (!audioData) return

    setIsDownloading(true)

    try {
      // If not encrypted, download directly
      if (!audioData.isEncrypted) {
        const link = document.createElement("a")
        link.href = audioData.audioUrl
        link.download = audioData.filename || "recording.wav"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Download started")
        setIsDownloading(false)
        return
      }

      // Check if Web Crypto API is available
      if (!isWebCryptoAvailable()) {
        toast.error("Your browser does not support this feature. Please use a modern browser.")
        setIsDownloading(false)
        return
      }

      // Validate encryption metadata
      if (!audioData.encryptionIV || !audioData.encryptionSalt) {
        toast.error("Unable to download this recording. Please try again later.")
        setIsDownloading(false)
        return
      }

      // Get password - prioritize from API response, then fallback to sessionStorage
      let decryptionPassword = password

      // First try password from API (server-side stored)
      if (!decryptionPassword && audioData.encryptionPassword) {
        decryptionPassword = audioData.encryptionPassword
      }

      // Fallback to sessionStorage (for backward compatibility)
      if (!decryptionPassword && recordingId) {
        decryptionPassword = getEncryptionPassword(recordingId) || undefined
      }

      if (!decryptionPassword) {
        decryptionPassword = getGlobalPassword() || undefined
      }

      if (!decryptionPassword) {
        toast.error("Unable to decrypt file. Encryption password not available.")
        setIsDownloading(false)
        return
      }

      // Download encrypted file
      const response = await fetch(audioData.audioUrl)

      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`)
      }

      const encryptedData = await response.arrayBuffer()

      // Decrypt the audio file (silently)
      const decryptionParams: DecryptionParams = {
        iv: audioData.encryptionIV,
        salt: audioData.encryptionSalt,
      }

      const decryptedData = await decryptAudioFile(
        encryptedData,
        decryptionPassword,
        decryptionParams
      )

      // Create blob and trigger download
      const audioBlob = new Blob([decryptedData], { type: "audio/wav" })
      const blobUrl = URL.createObjectURL(audioBlob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = audioData.filename || `recording-${recordingId}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 100)

      toast.success("Audio downloaded successfully")
    } catch (error) {
      console.error("Download error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to download audio"

      if (errorMessage.includes("Invalid password") || errorMessage.includes("Decryption failed")) {
        toast.error("Decryption failed. The file may be corrupted or the password was lost.")
      } else {
        toast.error(`Download failed: ${errorMessage}`)
      }
    } finally {
      setIsDownloading(false)
    }
  }


  // Show loading state
  if (isFetching) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  // Show error state
  if (fetchError || !audioData) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {fetchError || "Unable to load audio file"}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Button
        onClick={() => handleDownload()}
        disabled={isDownloading}
        className={`${className} border border-border bg-background disabled:bg-background disabled:text-foreground disabled:border-border disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-foreground`}
        variant="outline"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download Audio
          </>
        )}
      </Button>

    </>
  )
}


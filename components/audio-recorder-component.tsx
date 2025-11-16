"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Pause, Play, Upload, Trash2, Lock } from "lucide-react"
import { AudioRecorder } from "@/lib/audio-recorder"
import { useUsageLimits } from "@/hooks/use-usage-limits"
import { UpgradePrompt } from "@/components/billing/UpgradePrompt"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  encryptAudioFile,
  generateRandomPassword,
  isWebCryptoAvailable
} from "@/lib/encryption-service"
import { storeGlobalPassword } from "@/lib/key-storage"
import type { EncryptedFileData } from "@/components/audio-file-uploader"

interface AudioRecorderComponentProps {
  onRecordingComplete: (data: EncryptedFileData) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
}

export function AudioRecorderComponent({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
}: AudioRecorderComponentProps) {
  const { usage, canTranscribe } = useUsageLimits()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; filename: string } | null>(null)
  const [isEncrypting, setIsEncrypting] = useState(false)

  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize audio recorder
    const initializeRecorder = async () => {
      try {
        const recorder = new AudioRecorder({
          sampleRate: 44100,
          channelCount: 2,
          bitDepth: 16,
        })

        await recorder.initialize()
        audioRecorderRef.current = recorder
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        setError(`Failed to initialize audio recorder: ${err}`)
        console.error("Audio recorder initialization error:", err)
      }
    }

    initializeRecorder()

    // Cleanup on unmount
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Update timer when recording
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  const startRecording = async () => {
    if (!audioRecorderRef.current || !isInitialized) {
      setError("Audio recorder not initialized")
      return
    }

    try {
      audioRecorderRef.current.startRecording()
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      setError(null)
      onRecordingStart?.()
    } catch (err) {
      setError(`Failed to start recording: ${err}`)
      console.error("Start recording error:", err)
    }
  }

  const pauseRecording = () => {
    if (!audioRecorderRef.current) return

    try {
      if (isPaused) {
        audioRecorderRef.current.resumeRecording()
        setIsPaused(false)
      } else {
        audioRecorderRef.current.pauseRecording()
        setIsPaused(true)
      }
    } catch (err) {
      setError(`Failed to pause/resume recording: ${err}`)
      console.error("Pause recording error:", err)
    }
  }

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return

    try {
      const audioBlob = audioRecorderRef.current.stopRecording()
      setIsRecording(false)
      setIsPaused(false)

      // Generate temporary filename for processing
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `temp_recording_${timestamp}.wav`

      // Store the recording for later upload
      setRecordedAudio({ blob: audioBlob, filename })
      onRecordingStop?.()

      // Don't reset timer here - keep the recorded time displayed
    } catch (err) {
      setError(`Failed to stop recording: ${err}`)
      console.error("Stop recording error:", err)
    }
  }

  const handleUploadAndTranscribe = async () => {
    if (!recordedAudio) return

    // Check if Web Crypto API is available
    if (!isWebCryptoAvailable()) {
      setError('Your browser does not support encryption. Please use a modern browser.')
      return
    }

    try {
      setIsEncrypting(true)

      // Convert Blob to File for encryption
      const audioFile = new File([recordedAudio.blob], recordedAudio.filename, {
        type: recordedAudio.blob.type
      })

      // Always encrypt with automatically generated random password
      const password = generateRandomPassword()
      console.log('Generated encryption password for recording:', recordedAudio.filename)

      // Encrypt the audio file
      const encrypted = await encryptAudioFile(audioFile, password)

      // Create encrypted file
      const encryptedFile = new File(
        [encrypted.encryptedData],
        `encrypted_${recordedAudio.filename}`,
        { type: 'application/octet-stream' }
      )

      // Store password in session for later use
      storeGlobalPassword(password)

      // Pass encrypted file data to parent
      onRecordingComplete({
        file: encryptedFile,
        isEncrypted: true,
        encryptionIV: encrypted.ivBase64,
        encryptionSalt: encrypted.saltBase64,
        password: password
      })

      setRecordedAudio(null) // Clear the stored recording
      setRecordingTime(0) // Reset timer when uploading
    } catch (error) {
      console.error('Encryption failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to encrypt recording: ${errorMessage}. Please try again.`)
    } finally {
      setIsEncrypting(false)
    }
  }

  const handleDiscardRecording = () => {
    setRecordedAudio(null)
    setRecordingTime(0) // Reset timer when discarding
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getRecordingStatus = () => {
    if (recordedAudio) return "Recording completed - Ready to upload"
    if (!isRecording) return "Ready to record"
    if (isPaused) return "Paused"
    return "Recording..."
  }

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full" />
              <span className="text-sm font-medium text-destructive">{error}</span>
            </div>
          </div>
        )}

        {/* Recording Interface */}
        <div className="text-center space-y-6">
          {/* Timer Display */}
          <div className="space-y-4">
            <div className="text-5xl font-medium tracking-[-1.44px] md:tracking-[-2.16px] text-primary">
              {formatTime(recordingTime)}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center items-center">
            {recordedAudio ? (
              /* Recording completed - show main action button */
              <div className="flex flex-col items-center gap-4">
                {!canTranscribe && usage && (
                  <UpgradePrompt
                    type="transcription"
                    used={usage.transcriptionMinutes.used}
                    limit={usage.transcriptionMinutes.limit}
                    className="mb-2"
                  />
                )}
                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={handleUploadAndTranscribe}
                            disabled={!canTranscribe || isEncrypting}
                            size="lg"
                            className="!h-[56px] rounded-none !text-base gap-2 px-8 min-w-[140px] flex items-center justify-center"
                          >
                            {isEncrypting ? (
                              <>
                                <Lock className="h-5 w-5 animate-pulse" />
                                Encrypting...
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5" />
                                Transcribe
                              </>
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTranscribe && usage && (
                        <TooltipContent>
                          <p>You've reached your transcription limit ({usage.transcriptionMinutes.used.toFixed(1)}/{usage.transcriptionMinutes.limit} min)</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    onClick={handleDiscardRecording}
                    variant="outline"
                    size="lg"
                    className="!h-[56px] rounded-none !text-base gap-2 px-8 min-w-[140px] flex items-center justify-center box-border"
                  >
                    <Trash2 className="h-5 w-5" />
                    Discard
                  </Button>
                </div>
              </div>
            ) : !isRecording ? (
              /* Ready to start recording - show button matching landing page style */
              <div className="flex flex-col items-center gap-4">
                {!canTranscribe && usage && (
                  <UpgradePrompt
                    type="transcription"
                    used={usage.transcriptionMinutes.used}
                    limit={usage.transcriptionMinutes.limit}
                    className="mb-2"
                  />
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          onClick={startRecording}
                          disabled={!isInitialized || !canTranscribe}
                          size="lg"
                          className="!h-14 rounded-none !text-base gap-2 px-8"
                        >
                          <Mic className="h-5 w-5" />
                          Start Recording
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canTranscribe && usage && (
                      <TooltipContent>
                        <p>You've reached your transcription limit ({usage.transcriptionMinutes.used.toFixed(1)}/{usage.transcriptionMinutes.limit} min)</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              /* Currently recording - show control buttons */
              <div className="flex items-center gap-4">
                <Button
                  onClick={pauseRecording}
                  size="lg"
                  variant={isPaused ? "secondary" : "default"}
                  className="!h-[56px] rounded-none !text-base gap-2 px-8 min-w-[140px] flex items-center justify-center"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-5 w-5" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5" />
                      Pause
                    </>
                  )}
                </Button>

                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="!h-[56px] rounded-none !text-base gap-2 px-8 min-w-[140px] flex items-center justify-center"
                >
                  <Square className="h-5 w-5" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Audio Visualization */}
        {isRecording && !isPaused && (
          <div className="flex justify-center items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-6 bg-primary rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

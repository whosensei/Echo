"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  audioUrl: string
  recordingId?: string // Optional: used to fetch presigned URL if direct URL fails
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  className?: string
}

export function AudioPlayer({ audioUrl, recordingId, onPlay, onPause, onTimeUpdate, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actualAudioUrl, setActualAudioUrl] = useState<string>("")
  const isDraggingRef = useRef(false)
  const wasPlayingRef = useRef(false)

  const fetchPresignedAudioUrl = useCallback(
    async (
      signal?: AbortSignal
    ): Promise<{
      url: string | null
      errorMessage: string | null
      attempted: boolean
    }> => {
      if (!recordingId) {
        return { url: null, errorMessage: null, attempted: false }
      }

      if (signal?.aborted) {
        return { url: null, errorMessage: null, attempted: false }
      }

      try {
        const response = await fetch(`/api/recordings/${recordingId}/audio-url`, {
          signal,
        })

        const contentType = response.headers.get("content-type") || ""
        let data: any = null

        if (contentType.includes("application/json")) {
          try {
            data = await response.json()
          } catch (parseError) {
            // Failed to parse JSON response
          }
        }

        if (!response.ok) {
          const message =
            data?.error || data?.message || `Failed to fetch presigned URL (status ${response.status})`
          return { url: null, errorMessage: message, attempted: true }
        }

        const presignedUrl = typeof data?.audioUrl === "string" ? data.audioUrl : null

        if (!presignedUrl) {
          return { url: null, errorMessage: "No audio URL in response", attempted: true }
        }

        return { url: presignedUrl, errorMessage: null, attempted: true }
      } catch (err) {
        if ((err as any)?.name === "AbortError") {
          return { url: null, errorMessage: null, attempted: false }
        }

        const message = err instanceof Error ? err.message : String(err)
        return { url: null, errorMessage: message, attempted: true }
      }
    },
    [recordingId]
  )

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }


  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
      setError(null)
    }

    const handleTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime)
        onTimeUpdate?.(audio.currentTime, audio.duration)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement

      if (recordingId) {
        void (async () => {
          setIsLoading(true)
          const result = await fetchPresignedAudioUrl()

          if (result.url) {
            setActualAudioUrl(result.url)
            setError(null)
            return
          }

          setIsLoading(false)
          setError("Failed to load audio file. Please check if the file exists and is accessible.")
          setIsPlaying(false)
        })()
        return
      }

      setIsLoading(false)
      setError("Failed to load audio file. Please check if the file exists and is accessible.")
      setIsPlaying(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleStalled = () => {
      // Audio stalled
    }

    const handleSuspend = () => {
      // Audio suspended
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("stalled", handleStalled)
    audio.addEventListener("suspend", handleSuspend)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    // Set initial volume to 100%
    audio.volume = 1

    // Try to load immediately
    if (actualAudioUrl) {
      audio.load()
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("stalled", handleStalled)
      audio.removeEventListener("suspend", handleSuspend)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [actualAudioUrl, onTimeUpdate, recordingId, fetchPresignedAudioUrl])

  // Update audio source when actualAudioUrl changes
  useEffect(() => {
    if (!audioRef.current) return

    const audioElement = audioRef.current

    if (actualAudioUrl) {
      audioElement.src = actualAudioUrl
      setIsLoading(true)
      setError(null)
    } else {
      audioElement.pause()
      audioElement.removeAttribute("src")
      // Calling load() after removing the source ensures the element resets its state
      audioElement.load()
    }
  }, [actualAudioUrl])


  // Reset to initial audio URL when prop changes
  useEffect(() => {
    let isCancelled = false

    setError(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    if (!audioUrl) {
      setActualAudioUrl("")
      setIsLoading(false)
      setError("Audio file is unavailable.")
      return
    }

    const isLocalUrl = audioUrl.startsWith("blob:") || audioUrl.startsWith("data:")

    if (!recordingId || isLocalUrl) {
      setActualAudioUrl(audioUrl)
      setIsLoading(true)
      return
    }

    const controller = new AbortController()

    setIsLoading(true)

    ;(async () => {
      const result = await fetchPresignedAudioUrl(controller.signal)

      if (isCancelled || controller.signal.aborted) {
        return
      }

      if (result.url) {
        setActualAudioUrl(result.url)
        return
      }

      setActualAudioUrl(audioUrl)
    })()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [audioUrl, recordingId, fetchPresignedAudioUrl])


  const togglePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        onPause?.()
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        onPlay?.()
      }
    } catch (err) {
      setError("Failed to play audio")
    }
  }

  const skipBackward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    setCurrentTime(audioRef.current.currentTime)
  }

  const skipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(
      duration,
      audioRef.current.currentTime + 10
    )
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value)
    if (Number.isNaN(newTime)) return

    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleProgressPointerDown = () => {
    isDraggingRef.current = true
    if (audioRef.current) {
      wasPlayingRef.current = !audioRef.current.paused
    } else {
      wasPlayingRef.current = false
    }
  }

  const handleProgressPointerUp = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    if (audioRef.current) {
      const audio = audioRef.current
      audio.currentTime = currentTime
      if (wasPlayingRef.current) {
        const playPromise = audio.play()
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {
            setIsPlaying(!audio.paused)
          })
        }
      } else {
        audio.pause()
        setIsPlaying(false)
      }
    }
    wasPlayingRef.current = false
  }

  useEffect(() => {
    const handleGlobalPointerReset = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
    }

    window.addEventListener("pointerup", handleGlobalPointerReset)
    window.addEventListener("pointercancel", handleGlobalPointerReset)

    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerReset)
      window.removeEventListener("pointercancel", handleGlobalPointerReset)
    }
  }, [])

  const progressPercentage = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0

  if (error) {
    return (
      <div className={cn("p-4 bg-destructive/10 border border-destructive/20 rounded-lg", className)}>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full bg-card border border-border rounded-lg p-4 space-y-4", className)}>
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={actualAudioUrl || undefined} preload="metadata" crossOrigin="anonymous" />

      {/* Progress Bar and Time Display */}
      <div className="space-y-3">
        {/* Progress Bar - Modern Design */}
        <div className="relative h-6 flex items-center">
          {/* Background bar */}
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full overflow-hidden bg-muted/30 dark:bg-gray-800 dark:[background-color:rgba(255,255,255,0.03)]">
            {/* Progress fill - matches play button color */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-primary"
              style={{
                width: `${progressPercentage}%`,
                transition: isDraggingRef.current ? "none" : "width 160ms linear",
              }}
            />
          </div>
          
          {/* Invisible range input for interaction */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            onPointerDown={handleProgressPointerDown}
            onPointerUp={handleProgressPointerUp}
            onPointerCancel={handleProgressPointerUp}
            disabled={isLoading || duration === 0}
            className="relative z-10 w-full h-6 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full
              [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:border-none [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-track]:h-full [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent
              [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Audio progress"
            onBlur={handleProgressPointerUp}
          />
        </div>

        {/* Time Display */}
        <div className="flex items-baseline justify-between text-sm text-muted-foreground font-medium">
          <span className="tabular-nums">{formatTime(currentTime)}</span>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Row - Centered */}
      <div className="flex items-center justify-center gap-4">
        {/* Skip Back Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={skipBackward}
          disabled={isLoading || duration === 0}
          className="h-10 w-10 rounded-lg bg-muted hover:bg-muted/80"
          aria-label="Skip back 10 seconds"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          disabled={isLoading || duration === 0}
          className="h-12 w-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="h-5 w-5 aspect-square border-2 border-primary-foreground border-t-transparent rounded-full animate-spin flex-shrink-0 box-border" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="h-6 w-6 fill-current" />
          )}
        </Button>

        {/* Skip Forward Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={skipForward}
          disabled={isLoading || duration === 0}
          className="h-10 w-10 rounded-lg bg-muted hover:bg-muted/80"
          aria-label="Skip forward 10 seconds"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}


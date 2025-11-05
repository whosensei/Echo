"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Menu, Trash2, Plus, Edit2, Check, X, Play, Pause } from "lucide-react"
import { type StoredTranscription } from "@/lib/transcription-types"
import { useToast } from "@/components/ui/toaster"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface TranscriptionSidebarProps {
  onTranscriptionSelect: (transcription: StoredTranscription) => void
  selectedTranscriptionId?: string
  onRefresh?: () => void
  onNewRecording?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  refreshTrigger?: number
}

export function TranscriptionSidebar({
  onTranscriptionSelect,
  selectedTranscriptionId,
  onRefresh,
  onNewRecording,
  isCollapsed,
  onToggleCollapse,
  refreshTrigger,
}: TranscriptionSidebarProps) {
  const [transcriptions, setTranscriptions] = useState<StoredTranscription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const loadTranscriptions = async () => {
    console.log("Loading transcriptions from backend...")
    setIsLoading(true)
    setError(null)

    try {
      // Fetch recordings from backend API
      const response = await fetch("/api/recordings?limit=100")
      
      if (!response.ok) {
        throw new Error("Failed to fetch recordings")
      }

      const data = await response.json()
      
      // Convert recordings to StoredTranscription format
      const recordings = data.recordings || []
      const convertedTranscriptions: StoredTranscription[] = recordings.map((recording: any) => ({
        id: recording.id,
        filename: recording.title,
        createdAt: recording.createdAt || recording.recordedAt,
        status: recording.status === "completed" ? "completed" : 
                recording.status === "processing" ? "processing" : 
                recording.status === "failed" ? "failed" : "pending",
        audioData: recording.audioFileUrl ? `/audio-recordings/${recording.audioFileUrl}` : undefined,
        transcriptionData: recording.transcriptionData || null,
        summaryData: recording.summaryData || null,
        error: recording.status === "failed" ? "Transcription failed" : undefined,
        recordingId: recording.id,
      }))
      
      console.log("Loaded transcriptions from backend:", convertedTranscriptions.length, convertedTranscriptions)
      setTranscriptions(convertedTranscriptions)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load transcriptions: ${errorMessage}`)
      console.error("Error loading transcriptions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTranscription = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering selection

    if (confirm("Are you sure you want to delete this transcription?")) {
      try {
        const response = await fetch(`/api/recordings/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete recording")
        }

        await loadTranscriptions() // Refresh the list
        onRefresh?.() // Notify parent if needed

        toast({
          title: "Deleted successfully",
          description: "The recording has been deleted.",
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete transcription"
        setError(errorMessage)
        toast({
          title: "Delete failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleStartEdit = (e: React.MouseEvent, transcription: StoredTranscription) => {
    e.stopPropagation() // Prevent triggering selection
    setEditingId(transcription.id)
    setEditingName(transcription.filename || `Recording`)
  }

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering selection

    if (editingName.trim()) {
      try {
        const response = await fetch(`/api/recordings/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editingName.trim(),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update recording")
        }

        setEditingId(null)
        setEditingName("")
        await loadTranscriptions() // Refresh the list

        toast({
          title: "Updated successfully",
          description: "The recording title has been updated.",
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update transcription name"
        setError(errorMessage)
        toast({
          title: "Update failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering selection
    setEditingId(null)
    setEditingName("")
  }

  const handlePlayAudio = async (e: React.MouseEvent, transcription: StoredTranscription) => {
    e.stopPropagation() // Prevent triggering selection

    if (!transcription.audioData) {
      toast({
        title: "Audio not available",
        description: "No audio data found for this transcription.",
        variant: "destructive",
      })
      return
    }

    try {
      // If already playing this audio, pause it
      if (playingId === transcription.id && audioRef.current) {
        audioRef.current.pause()
        setPlayingId(null)
        return
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      // Create new audio element
      const audio = new Audio(transcription.audioData)
      audioRef.current = audio
      setPlayingId(transcription.id)

      // Set up event listeners
      audio.onended = () => {
        setPlayingId(null)
        audioRef.current = null
      }

      audio.onerror = () => {
        setPlayingId(null)
        audioRef.current = null
        toast({
          title: "Playback error",
          description: "Failed to play audio file.",
          variant: "destructive",
        })
      }

      // Start playing
      await audio.play()
    } catch (error) {
      console.error("Audio playback error:", error)
      setPlayingId(null)
      audioRef.current = null
      toast({
        title: "Playback error",
        description: "Failed to play audio file.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadTranscriptions()
  }, [])

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Refresh transcriptions when component receives new data
  useEffect(() => {
    const handleStorageChange = () => {
      loadTranscriptions()
    }

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Refresh transcriptions when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log("RefreshTrigger changed:", refreshTrigger, "- loading transcriptions")
      loadTranscriptions()
    }
  }, [refreshTrigger])

  // Expose refresh method to parent
  useEffect(() => {
    const refreshTranscriptions = () => {
      loadTranscriptions()
    }

    if (onRefresh) {
      ;(window as unknown as Record<string, unknown>).refreshTranscriptions = refreshTranscriptions
    }
  }, [onRefresh])

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Unknown date"
    const date = new Date(dateString)
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }

  console.log("TranscriptionSidebar rendering - collapsed:", isCollapsed, "transcriptions:", transcriptions.length)

  return (
    <div className={`h-full flex flex-col bg-card transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
      {isCollapsed ? (
        /* Collapsed state - only hamburger and back button */
        <div className="w-full p-2 flex flex-col gap-3 items-center justify-start">
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-md border border-border hover:bg-accent transition-colors flex items-center justify-center"
          >
            <Menu className="h-4 w-4 text-foreground" />
          </button>
          <a
            href="/dashboard"
            className="w-10 h-10 rounded-md border border-border hover:bg-accent transition-colors flex items-center justify-center"
          >
            <svg className="h-4 w-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
        </div>
      ) : (
        /* Expanded state - full header */
        <>
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-medium text-base text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Transcriptions
              </h2>
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-md border border-border hover:bg-accent transition-colors"
              >
                <Menu className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Back to Dashboard Button */}
            <a
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium text-foreground"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>

            {/* New Recording Button */}
            <Button
              onClick={onNewRecording}
              className="w-full gap-2 h-auto px-4 py-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Recording
            </Button>
          </div>
        </>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
          {error && (
            <div className="mb-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <div>
                    <div className="font-medium text-destructive text-sm">Error loading</div>
                    <div className="text-xs text-destructive/80 mt-1">{error}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && transcriptions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="font-medium text-sidebar-foreground">Loading...</p>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium mb-1">No transcriptions yet</p>
              <p className="text-xs">Start recording to see them here</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {transcriptions.map((transcription, index) => (
                <div key={transcription.id}>
                  {/* Main transcription item */}
                  <div
                    className={`relative group rounded-md px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                      selectedTranscriptionId === transcription.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/70"
                    }`}
                    onClick={() => onTranscriptionSelect(transcription)}
                  >
                    {/* Filename row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {editingId === transcription.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-7 text-sm font-medium w-full"
                          autoFocus
                          maxLength={50}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(e as any, transcription.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit(e as any)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className={`font-medium text-sm truncate flex-1 ${
                          selectedTranscriptionId === transcription.id ? 'text-primary' : 'text-foreground'
                        }`}>
                          {transcription.filename || `Recording ${index + 1}`}
                        </h3>
                      )}
                    </div>
                    
                    {/* Metadata and actions row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">{formatDate(transcription.createdAt)}</span>
                        {transcription.error && (
                          <span className="text-destructive ml-1">• Error</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === transcription.id ? (
                          <>
                            <button
                              className="p-1 rounded hover:bg-primary/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(e as any, transcription.id);
                              }}
                            >
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-muted transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit(e as any);
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="p-1 rounded hover:bg-primary/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(e, transcription);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-destructive/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTranscription(e as any, transcription.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  {index < transcriptions.length - 1 && (
                    <div className="h-px bg-border/50 my-1.5 mx-3" />
                  )}
                </div>
              ))}
              </div>
            )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

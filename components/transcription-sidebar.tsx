"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Clock, Menu, Trash2, Plus, Edit2, Check, X, Play, Pause } from "lucide-react"
import { LocalStorageService, type StoredTranscription } from "@/lib/local-storage"
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

  const loadTranscriptions = () => {
    console.log("Loading transcriptions...")
    setIsLoading(true)
    setError(null)

    try {
      const storedTranscriptions = LocalStorageService.getTranscriptions()
      console.log("Loaded transcriptions:", storedTranscriptions.length, storedTranscriptions)
      setTranscriptions(storedTranscriptions)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load transcriptions: ${errorMessage}`)
      console.error("Error loading transcriptions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTranscription = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering selection

    if (confirm("Are you sure you want to delete this transcription?")) {
      const success = LocalStorageService.deleteTranscription(id)
      if (success) {
        loadTranscriptions() // Refresh the list
        onRefresh?.() // Notify parent if needed
      } else {
        setError("Failed to delete transcription")
      }
    }
  }

  const handleStartEdit = (e: React.MouseEvent, transcription: StoredTranscription) => {
    e.stopPropagation() // Prevent triggering selection
    setEditingId(transcription.id)
    setEditingName(transcription.filename || `Recording`)
  }

  const handleSaveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering selection

    if (editingName.trim()) {
      const success = LocalStorageService.updateTranscription(id, {
        filename: editingName.trim()
      })

      if (success) {
        setEditingId(null)
        setEditingName("")
        loadTranscriptions() // Refresh the list
      } else {
        setError("Failed to update transcription name")
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

  const formatDate = (dateString: string): string => {
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
    <div className={`h-full flex flex-col bg-sidebar transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
      {isCollapsed ? (
        /* Collapsed state - only hamburger */
        <div className="p-3 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md border border-sidebar-border hover:bg-sidebar-accent/10 transition-colors"
          >
            <Menu className="h-4 w-4 text-sidebar-foreground" />
          </button>
        </div>
      ) : (
        /* Expanded state - full header */
        <>
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-semibold text-base text-sidebar-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Transcriptions
              </h2>
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-md border border-sidebar-border hover:bg-sidebar-accent/10 transition-colors"
              >
                <Menu className="h-4 w-4 text-sidebar-foreground" />
              </button>
            </div>

            {/* New Recording Button */}
            <div className="px-0 pr-2">
              <button
                onClick={onNewRecording}
                className="btn-new-recording-glass w-full flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Recording
              </button>
            </div>
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
            <div className="space-y-2 pr-2">
              {transcriptions.map((transcription, index) => (
                <div key={transcription.id} className="relative">
                  {/* Main transcription card */}
                  <div
                    className={`relative rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      selectedTranscriptionId === transcription.id
                        ? "sidebar-item-glass-active shadow-sm"
                        : "bg-card hover:bg-muted/50 border-border"
                    }`}
                    onClick={() => onTranscriptionSelect(transcription)}
                  >
                    <div className="p-4">
                      {/* Header row with filename and buttons */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0 max-w-[180px]">
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
                            />
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <h3 className={`font-medium text-sm break-words leading-tight line-clamp-2 overflow-hidden cursor-default ${
                                  selectedTranscriptionId === transcription.id
                                    ? "text-primary font-semibold"
                                    : "text-foreground"
                                }`}>
                                  {transcription.filename || `Recording ${index + 1}`}
                                </h3>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{transcription.filename || `Recording ${index + 1}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {/* Action buttons - always positioned on the right */}
                        <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                          {editingId === transcription.id ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => handleSaveEdit(e, transcription.id)}
                                    className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center border border-blue-200"
                                  >
                                    <Check className="h-3 w-3 text-blue-600" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Save</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => handleCancelEdit(e)}
                                    className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center border border-blue-200"
                                  >
                                    <X className="h-3 w-3 text-blue-600" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cancel</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              {/* Play/Pause button - only show if audio data exists */}
                              {transcription.audioData && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${
                                        playingId === transcription.id
                                          ? "bg-orange-100 hover:bg-orange-200 border-orange-200"
                                          : "bg-blue-100 hover:bg-blue-200 border-blue-200"
                                      }`}
                                      onClick={(e) => handlePlayAudio(e, transcription)}
                                    >
                                      {playingId === transcription.id ? (
                                        <Pause className="h-3 w-3 text-orange-600" />
                                      ) : (
                                        <Play className="h-3 w-3 text-blue-600" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{playingId === transcription.id ? "Pause audio" : "Play audio"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center shadow-sm border border-blue-200"
                                    onClick={(e) => handleStartEdit(e, transcription)}
                                  >
                                    <Edit2 className="h-3 w-3 text-blue-600" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit name</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center shadow-sm border border-blue-200"
                                    onClick={(e) => handleDeleteTranscription(e, transcription.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-blue-600" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete transcription</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Date row */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{formatDate(transcription.createdAt)}</span>
                      </div>

                      {/* Error state */}
                      {transcription.error && (
                        <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                          <p className="text-xs text-red-700 truncate">
                            Error: {transcription.error}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
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

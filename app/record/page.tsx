"use client"

import { useState } from "react"
import { AudioRecorderComponent } from "@/components/audio-recorder-component"
import { AudioFileUploader } from "@/components/audio-file-uploader"
import { TranscriptionSidebar } from "@/components/transcription-sidebar"
import { TabbedTranscriptDisplay } from "@/components/tabbed-transcript-display"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { LocalStorageService, StoredTranscription } from "@/lib/local-storage"
import { useSession } from "@/lib/auth-client"
import type { GladiaTranscriptionResult } from "@/lib/gladia-service"
import type { MeetingSummary } from "@/lib/gemini-service"

export default function RecordPage() {
  const { data: session } = useSession()
  const [currentTranscription, setCurrentTranscription] = useState<GladiaTranscriptionResult | null>(null)
  const [currentSummary, setCurrentSummary] = useState<MeetingSummary | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | undefined>()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentAudioData, setCurrentAudioData] = useState<string | undefined>()
  const [activeInputTab, setActiveInputTab] = useState<"record" | "upload">("record")

  const createSpeakerLabeledTranscript = (transcriptionResult: GladiaTranscriptionResult) => {
    if (!transcriptionResult?.result?.transcription?.utterances) {
      return {
        labeledTranscript: transcriptionResult?.result?.transcription?.full_transcript || "",
        speakerMapping: {},
        groups: []
      }
    }

    const utterances = transcriptionResult.result.transcription.utterances
    const speakerMapping: { [key: string]: string } = {}
    const uniqueSpeakers = [...new Set(utterances.map((u: any) => u.speaker))].sort()

    uniqueSpeakers.forEach(speaker => {
      speakerMapping[speaker] = `Speaker ${speaker}`
    })

    const groups: any[] = []
    utterances.forEach((utterance: any) => {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.speaker === utterance.speaker) {
        lastGroup.text += " " + utterance.text
        lastGroup.end = utterance.end
      } else {
        groups.push({
          speaker: utterance.speaker,
          text: utterance.text,
          start: utterance.start,
          end: utterance.end,
        })
      }
    })

    const labeledTranscript = groups.map(group => {
      const speakerName = speakerMapping[group.speaker] || `Speaker ${group.speaker}`
      const startTime = Math.floor(group.start / 60) + ":" + String(Math.floor(group.start % 60)).padStart(2, '0')
      return `[${startTime}] ${speakerName}: ${group.text}`
    }).join('\n\n')

    return { labeledTranscript, speakerMapping, groups }
  }

  const handleFileUpload = async (file: File) => {
    // Convert File to Blob and process
    const blob = new Blob([file], { type: file.type })
    await handleRecordingComplete(blob, file.name)
  }

  const handleRecordingComplete = async (audioBlob: Blob, filename: string) => {
    setIsProcessing(true)
    setCurrentTranscription(null)
    setCurrentSummary(null)

    let meetingId: string | null = null

    try {
      toast.info("Uploading audio...", {
        description: "Saving your recording and preparing for transcription."
      })

      const formData = new FormData()
      formData.append("audio", audioBlob, filename)

      const uploadResponse = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio")
      }

      const uploadData = await uploadResponse.json()

      // Create meeting in backend first
      if (session?.user) {
        try {
          const meetingResponse = await fetch("/api/meetings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Recording ${new Date().toLocaleString()}`,
              startTime: new Date().toISOString(),
              audioFileUrl: uploadData.filename,
              status: "processing",
            }),
          })

          if (meetingResponse.ok) {
            const { meeting } = await meetingResponse.json()
            meetingId = meeting.id
            if (meetingId) {
              setSelectedTranscriptionId(meetingId)
            }
          }
        } catch (dbError) {
          console.error("Failed to save to database:", dbError)
          throw new Error("Failed to create meeting record")
        }
      }

      setRefreshTrigger(prev => prev + 1)

      toast.info("Starting transcription...", {
        description: "Processing your audio with Gladia AI."
      })

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: uploadData.filename }),
      })

      if (!transcribeResponse.ok) {
        throw new Error("Failed to start transcription")
      }

      const transcribeData = await transcribeResponse.json()
      const requestId = transcribeData.requestId

      if (!requestId) {
        throw new Error("No requestId received from transcription initiation")
      }

      toast.info("Transcription in progress...", {
        description: "This may take a few minutes."
      })

      let attempts = 0
      const maxAttempts = 60

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000))

        const resultResponse = await fetch(`/api/transcribe?requestId=${requestId}`)
        if (!resultResponse.ok) {
          throw new Error(`Failed to get transcription result`)
        }

        const resultData = await resultResponse.json()
        const result = resultData.result

        if (result.status === "done") {
          setCurrentTranscription(result)
          if (meetingId) {
            setSelectedTranscriptionId(meetingId)
          }

          toast.info("Generating summary...", {
            description: "Creating an AI-powered meeting summary."
          })

          let summaryData: MeetingSummary | undefined

          try {
            const transcriptData = createSpeakerLabeledTranscript(result)

            const summaryResponse = await fetch("/api/summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transcript: transcriptData.labeledTranscript,
                rawTranscript: result.result.transcription.full_transcript,
                speakers: result.result.speakers,
                namedEntities: result.result.named_entities,
                speakerMapping: transcriptData.speakerMapping,
              }),
            })

            if (summaryResponse.ok) {
              const summaryResponse_data = await summaryResponse.json()
              if (summaryResponse_data.success && summaryResponse_data.summary) {
                summaryData = summaryResponse_data.summary
                setCurrentSummary(summaryData || null)
              }
            }
          } catch (summaryError) {
            console.error("Summary generation failed:", summaryError)
          }

          // Update meeting in backend with transcription and summary
          if (session?.user && meetingId) {
            try {
              // Update meeting status
              await fetch(`/api/meetings/${meetingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "completed",
                  endTime: new Date().toISOString(),
                }),
              })

              // Save transcription
              if (result?.result?.transcription) {
                await fetch("/api/transcriptions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    meetingId: meetingId,
                    content: result.result.transcription.full_transcript,
                    language: result.result.transcription.language,
                    speakerCount: result.result.speakers?.length || 0,
                    duration: result.result.transcription.audio_duration,
                    confidence: Math.round((result.result.transcription.confidence || 0) * 100),
                    metadata: {
                      utterances: result.result.transcription.utterances,
                      speakers: result.result.speakers,
                      namedEntities: result.result.named_entities,
                    },
                  }),
                })
              }

              // Save summary
              if (summaryData) {
                await fetch("/api/summaries", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    meetingId: meetingId,
                    summary: summaryData.overview,
                    actionPoints: summaryData.actionItems,
                    keyTopics: summaryData.topics,
                    participants: summaryData.participants,
                    sentiment: summaryData.sentiment,
                  }),
                })
              }
            } catch (dbError) {
              console.error("Failed to save to database:", dbError)
            }
          }

          // Refresh the sidebar with new data
          setRefreshTrigger(prev => prev + 1)

          toast.success("Processing complete!", {
            description: "Your audio has been transcribed and summarized."
          })

          break
        } else if (result.status === "error") {
          // Update meeting status to failed
          if (meetingId && session?.user) {
            try {
              await fetch(`/api/meetings/${meetingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "failed",
                }),
              })
            } catch (err) {
              console.error("Failed to update meeting status:", err)
            }
          }
          throw new Error(`Transcription failed: ${result.error}`)
        }

        attempts++
      }

      if (attempts >= maxAttempts) {
        // Update meeting status to failed
        if (meetingId && session?.user) {
          try {
            await fetch(`/api/meetings/${meetingId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "failed",
              }),
            })
          } catch (err) {
            console.error("Failed to update meeting status:", err)
          }
        }
        throw new Error("Transcription timeout")
      }
    } catch (error) {
      console.error("Processing error:", error)

      // Update meeting status to failed if it was created
      if (meetingId && session?.user) {
        try {
          await fetch(`/api/meetings/${meetingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "failed",
            }),
          })
        } catch (err) {
          console.error("Failed to update meeting status:", err)
        }
      }

      toast.error("Processing failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTranscriptionSelect = async (storedTranscription: StoredTranscription) => {
    if (storedTranscription.status === "processing") {
      toast.error("Transcription in progress", {
        description: "This transcription is still being processed."
      })
      return
    }

    if (storedTranscription.status === "failed") {
      toast.error("Transcription failed", {
        description: storedTranscription.error || "This transcription failed to process."
      })
      return
    }

    // Fetch full meeting details from backend
    try {
      const response = await fetch(`/api/meetings/${storedTranscription.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch meeting details")
      }

      const meetingData = await response.json()
      const meeting = meetingData.meeting

      setSelectedTranscriptionId(storedTranscription.id)
      
      // Set transcription data if available
      if (meeting.transcription) {
        setCurrentTranscription(meeting.transcription.metadata || null)
      } else {
        setCurrentTranscription(null)
      }

      // Set summary data if available
      if (meeting.summary) {
        const durationInSeconds = meeting.endTime && meeting.startTime 
          ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 1000)
          : 0
        
        const summaryData: MeetingSummary = {
          title: meeting.title || "Meeting Summary",
          overview: meeting.summary.summary,
          keyPoints: [], // Will be populated from topics if needed
          actionItems: meeting.summary.actionPoints || [],
          decisions: [], // Will be populated if available
          topics: meeting.summary.keyTopics || [],
          participants: meeting.summary.participants || [],
          sentiment: meeting.summary.sentiment || "neutral",
          duration: `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, '0')}`,
        }
        setCurrentSummary(summaryData)
      } else {
        setCurrentSummary(null)
      }

      // Set audio data if available
      if (meeting.audioFileUrl) {
        setCurrentAudioData(`/audio-recordings/${meeting.audioFileUrl}`)
      } else {
        setCurrentAudioData(undefined)
      }

      if (!meeting.transcription && !meeting.summary) {
        toast.error("No transcription data", {
          description: "This transcription has no data available."
        })
      }
    } catch (error) {
      console.error("Error fetching meeting details:", error)
      toast.error("Failed to load meeting", {
        description: error instanceof Error ? error.message : "Could not load meeting details."
      })
    }
  }

  const handleNewRecording = () => {
    setCurrentTranscription(null)
    setCurrentSummary(null)
    setSelectedTranscriptionId(undefined)
    setIsProcessing(false)

    toast.success("Ready for new recording", {
      description: "You can now start a new recording."
    })
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-card border-r border-border transition-all duration-300 z-50 ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
        <TranscriptionSidebar
          onTranscriptionSelect={handleTranscriptionSelect}
          selectedTranscriptionId={selectedTranscriptionId}
          onNewRecording={handleNewRecording}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
        {(currentTranscription || currentSummary || isProcessing) ? (
          <div className="w-full h-full">
            <TabbedTranscriptDisplay
              transcription={currentTranscription}
              summary={currentSummary}
              isLoading={isProcessing}
              onNewRecording={handleNewRecording}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          </div>
        ) : (
          <div className="h-screen flex flex-col overflow-hidden">
            {/* Top Navigation */}
            <header className="border-b border-border bg-background">
              <div className="flex h-14 items-center justify-between px-8">
                <h2 className="text-base font-semibold">Record</h2>
                <span className="text-sm text-muted-foreground">
                  {session?.user?.name || session?.user?.email}
                </span>
              </div>
            </header>

            {/* Main Content - Single Page */}
            <main className="flex-1 flex items-center justify-center px-8">
              <div className="w-full max-w-4xl">
                <div className="flex flex-col items-center text-center space-y-8">
                  {/* Hero Text */}
                  <div className="space-y-4">
                    <h1 
                      className="text-5xl lg:text-6xl font-thin tracking-tighter text-foreground leading-[1.1] font-[family-name:var(--font-instrument-serif)]"
                    >
                      Effortless audio recording
                      <span className="block text-muted-foreground mt-2">powered by AI</span>
                    </h1>
                    
                    <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
                      Capture conversations with automatic transcription,
                      speaker identification, and intelligent summaries
                    </p>
                  </div>

                  {/* Recorder & Upload Tabs */}
                  <div className="w-full max-w-2xl">
                    <Tabs value={activeInputTab} onValueChange={(v) => setActiveInputTab(v as "record" | "upload")} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="record" className="gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Record Audio
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload File
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="record" className="mt-0">
                        <AudioRecorderComponent
                          onRecordingComplete={handleRecordingComplete}
                          onRecordingStart={() => {
                            setCurrentTranscription(null)
                            setCurrentSummary(null)
                            setSelectedTranscriptionId(undefined)
                          }}
                        />
                      </TabsContent>
                      
                      <TabsContent value="upload" className="mt-0">
                        <AudioFileUploader
                          onFileSelected={handleFileUpload}
                          isProcessing={isProcessing}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Features List */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Lossless Quality</h3>
                        <p className="text-xs text-muted-foreground">High-fidelity WAV</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Speaker Detection</h3>
                        <p className="text-xs text-muted-foreground">Auto identify</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">AI Transcription</h3>
                        <p className="text-xs text-muted-foreground">Real-time text</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Smart Summaries</h3>
                        <p className="text-xs text-muted-foreground">Key insights</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  )
}

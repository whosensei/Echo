"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AudioRecorderComponent } from "@/components/audio-recorder-component"
import { AudioFileUploader } from "@/components/audio-file-uploader"
import { TranscriptionSidebar } from "@/components/transcription-sidebar"
import { TabbedTranscriptDisplay } from "@/components/tabbed-transcript-display"
import { UsageLimits } from "@/components/billing/UsageLimits"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { toast } from "sonner"
import { type StoredTranscription } from "@/lib/transcription-types"
import { useSession } from "@/lib/auth-client"
import type { TranscriptionResult } from "@/lib/assemblyai-service"
import type { MeetingSummary } from "@/lib/openai-summary-service"
import { storeEncryptionPassword } from "@/lib/key-storage"

export default function RecordPage() {
  const { data: session } = useSession()
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null)
  const [currentSummary, setCurrentSummary] = useState<MeetingSummary | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | undefined>()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true) // Default to collapsed
  const [isSidebarPinned, setIsSidebarPinned] = useState(false) // Track if sidebar is pinned
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentAudioData, setCurrentAudioData] = useState<string | undefined>()
  const [activeInputTab, setActiveInputTab] = useState<"record" | "upload">("record")

  // Keyboard shortcut for toggling sidebar pin (Cmd+B / Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarPinned(prev => {
          const newPinned = !prev;
          // If pinning, expand it; if unpinning, collapse it
          setIsSidebarCollapsed(!newPinned);
          return newPinned;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle sidebar hover - only expand/collapse if not pinned
  const handleSidebarMouseEnter = () => {
    if (!isSidebarPinned) {
      setIsSidebarCollapsed(false);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isSidebarPinned) {
      setIsSidebarCollapsed(true);
    }
  };

  const createSpeakerLabeledTranscript = (transcriptionResult: TranscriptionResult) => {
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

  const handleFileUpload = async (data: import('@/components/audio-file-uploader').EncryptedFileData) => {
    // File can be passed directly to FormData, but we'll convert to Blob for consistency
    const fileContent = await data.file.arrayBuffer()
    const blob = new Blob([fileContent], { type: data.file.type })
    await handleRecordingComplete(blob, data.file.name, data)
  }

  // Wrapper for AudioRecorderComponent - it passes EncryptedFileData directly
  const handleRecordingCompleteFromRecorder = async (data: import('@/components/audio-file-uploader').EncryptedFileData) => {
    // Convert File to Blob and process
    const fileContent = await data.file.arrayBuffer()
    const blob = new Blob([fileContent], { type: data.file.type })
    await handleRecordingComplete(blob, data.file.name, data)
  }

  const handleRecordingComplete = async (
    audioBlob: Blob,
    filename: string,
    encryptionData?: import('@/components/audio-file-uploader').EncryptedFileData
  ) => {
    setIsProcessing(true)
    setCurrentTranscription(null)
    setCurrentSummary(null)

    let recordingId: string | null = null

    try {
      toast.info("Uploading audio...", {
        description: encryptionData?.isEncrypted
          ? "Uploading encrypted recording..."
          : "Saving your recording and preparing for transcription."
      })

      const formData = new FormData()
      formData.append("audio", audioBlob, filename)

      // Add encryption metadata if file is encrypted
      if (encryptionData?.isEncrypted) {
        formData.append("isEncrypted", "true")
        formData.append("encryptionIV", encryptionData.encryptionIV!)
        formData.append("encryptionSalt", encryptionData.encryptionSalt!)
        formData.append("encryptionPassword", encryptionData.password!)
      }

      const uploadResponse = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Failed to upload audio"
        console.error("Upload error:", errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const uploadData = await uploadResponse.json()

      const { fileKey, s3Url, filename: uploadedFilename } = uploadData

      // Create recording in backend first
      if (session?.user) {
        try {
          const recordingResponse = await fetch("/api/recordings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Recording ${new Date().toLocaleString()}`,
              recordedAt: new Date().toISOString(),
              audioFileUrl: s3Url || uploadData.filename,
              status: "processing",
              // Add encryption metadata
              isEncrypted: encryptionData?.isEncrypted || false,
              encryptionIV: encryptionData?.encryptionIV || null,
              encryptionSalt: encryptionData?.encryptionSalt || null,
              encryptionPassword: encryptionData?.password || null,
            }),
          })

          if (recordingResponse.ok) {
            const { recording } = await recordingResponse.json()
            recordingId = recording.id
            if (recordingId) {
              setSelectedTranscriptionId(recordingId)
              // Password is now stored server-side, but also cache in sessionStorage for faster access
              if (encryptionData?.isEncrypted && encryptionData?.password) {
                storeEncryptionPassword(recordingId, encryptionData.password)
              }
            }
          }
        } catch (dbError) {
          console.error("Failed to save to database:", dbError)
          throw new Error("Failed to create recording record")
        }
      }

      setRefreshTrigger(prev => prev + 1)

      toast.info("Starting transcription...", {
        description: "Processing your audio with AssemblyAI."
      })

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey,
          s3Url,
          // Add encryption metadata for decryption
          isEncrypted: encryptionData?.isEncrypted || false,
          encryptionPassword: encryptionData?.password || null,
          // Pass recordingId if available for more reliable lookup
          recordingId: recordingId || null,
        }),
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || "Failed to start transcription"
        console.error("Transcribe error:", errorMessage, errorData)
        throw new Error(errorMessage)
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
          if (recordingId) {
            setSelectedTranscriptionId(recordingId)
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

          // Update recording in backend with transcription and summary
          if (session?.user && recordingId) {
            try {
              // Update recording status
              await fetch(`/api/recordings/${recordingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "completed",
                }),
              })

              // Save transcription
              if (result?.result?.transcription) {
                await fetch("/api/transcriptions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    recordingId: recordingId,
                    content: result.result.transcription.full_transcript,
                    language: result.result.transcription.language,
                    speakerCount: result.result.speakers?.length || 0,
                    duration: Math.round(result.result.metadata?.audio_duration ?? 0),
                    confidence: Math.round((result.result.transcription.confidence || 0) * 100),
                    metadata: {
                      // Transcription details
                      utterances: result.result.transcription.utterances,
                      speakers: result.result.speakers,
                      
                      // AssemblyAI-specific fields for Summary tab
                      summary: result.result.summary,
                      iab_categories: result.result.iab_categories,
                      named_entities: result.result.named_entities,
                      sentiment_analysis: result.result.sentiment_analysis,
                      chapters: result.result.chapters,
                      
                      // Metadata
                      number_of_distinct_speakers: result.result.metadata?.number_of_distinct_speakers,
                      audio_duration: result.result.metadata?.audio_duration,
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
                    recordingId: recordingId,
                    summary: summaryData.overview,
                    actionPoints: summaryData.actionItems,
                    keyTopics: summaryData.topics,
                    participants: summaryData.participants,
                    sentiment: summaryData.sentiment,
                    metadata: {
                      title: summaryData.title,
                      keyPoints: summaryData.keyPoints,
                      actionItems: summaryData.actionItems,
                      decisions: summaryData.decisions,
                      topics: summaryData.topics,
                      nextSteps: summaryData.nextSteps,
                      // Enhanced structured data
                      keyMoments: summaryData.keyMoments,
                      structuredDecisions: summaryData.structuredDecisions,
                      structuredTodos: summaryData.structuredTodos,
                    },
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
          // Update recording status to failed
          if (recordingId && session?.user) {
            try {
              await fetch(`/api/recordings/${recordingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "failed",
                }),
              })
            } catch (err) {
              console.error("Failed to update recording status:", err)
            }
          }
          throw new Error(`Transcription failed: ${result.error}`)
        }

        attempts++
      }

      if (attempts >= maxAttempts) {
        // Update recording status to failed
        if (recordingId && session?.user) {
          try {
            await fetch(`/api/recordings/${recordingId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "failed",
              }),
            })
          } catch (err) {
            console.error("Failed to update recording status:", err)
          }
        }
        throw new Error("Transcription timeout")
      }
    } catch (error) {
      console.error("Processing error:", error)

      // Update recording status to failed if it was created
      if (recordingId && session?.user) {
        try {
          await fetch(`/api/recordings/${recordingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "failed",
            }),
          })
        } catch (err) {
          console.error("Failed to update recording status:", err)
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

    // Fetch full recording details from backend
    try {
      const response = await fetch(`/api/recordings/${storedTranscription.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch recording details")
      }

      const recordingData = await response.json()
      const { recording, transcript, summary } = recordingData

      setSelectedTranscriptionId(storedTranscription.id)
      
      const audioDurationSeconds = transcript
        ? Math.round(
            typeof transcript.duration === "number" && transcript.duration > 0
              ? transcript.duration
              : transcript.metadata?.audio_duration ?? 0
          )
        : 0

      // Set transcription data if available
      if (transcript) {
        // Transform transcript data to match TranscriptionResult format
        const transformedTranscript: TranscriptionResult = {
          id: transcript.id,
          request_id: transcript.id,
          status: "done",
          result: {
            transcription: {
              full_transcript: transcript.content,
              utterances: transcript.metadata?.utterances || [],
            },
            speakers: transcript.metadata?.speakers || [],
            // Preserve all AssemblyAI-specific fields
            summary: transcript.metadata?.summary,
            iab_categories: transcript.metadata?.iab_categories,
            named_entities: transcript.metadata?.named_entities,
            sentiment_analysis: transcript.metadata?.sentiment_analysis,
            chapters: transcript.metadata?.chapters,
            metadata: {
              ...transcript.metadata,
              audio_duration: audioDurationSeconds,
              number_of_channels: 1,
              billing_time: audioDurationSeconds,
              number_of_distinct_speakers: transcript.metadata?.number_of_distinct_speakers || 0,
            },
          },
        };
        setCurrentTranscription(transformedTranscript)
      } else {
        setCurrentTranscription(null)
      }

      // Set summary data if available
      if (summary) {
        const metadata = summary.metadata || {}
        const durationInSeconds = audioDurationSeconds
        const summaryData: MeetingSummary = {
          title: metadata.title || recording.title || "Recording Summary",
          overview: summary.summary || "",
          keyPoints: metadata.keyPoints || summary.keyTopics || [],
          actionItems: metadata.actionItems || summary.actionPoints || [],
          decisions: metadata.decisions || [],
          participants: summary.participants || [],
          topics: metadata.topics || [],
          duration: `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, '0')}`,
          sentiment: (summary.sentiment as "positive" | "neutral" | "negative") || null,
          // Enhanced structured data
          keyMoments: metadata.keyMoments || [],
          structuredDecisions: metadata.structuredDecisions || [],
          structuredTodos: metadata.structuredTodos || [],
        }
        setCurrentSummary(summaryData)
      } else {
        setCurrentSummary(null)
      }

      // Set audio data if available
      if (recording.audioFileUrl) {
        setCurrentAudioData(recording.audioFileUrl)
      } else {
        setCurrentAudioData(undefined)
      }

      if (!transcript && !summary) {
        toast.error("No transcription data", {
          description: "This recording has no data available."
        })
      }
    } catch (error) {
      console.error("Error fetching recording details:", error)
      toast.error("Failed to load recording", {
        description: error instanceof Error ? error.message : "Could not load recording details."
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
    <div className="min-h-screen flex bg-background landing-page-dark">
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-card border-r border-border transition-all duration-300 z-[100] ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <TranscriptionSidebar
          onTranscriptionSelect={handleTranscriptionSelect}
          selectedTranscriptionId={selectedTranscriptionId}
          onNewRecording={handleNewRecording}
          isCollapsed={isSidebarCollapsed}
          isPinned={isSidebarPinned}
          onToggleCollapse={() => {
            const newCollapsed = !isSidebarCollapsed;
            setIsSidebarCollapsed(newCollapsed);
            // Pin/unpin based on the new state
            setIsSidebarPinned(!newCollapsed);
          }}
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
              meetingId={selectedTranscriptionId || null}
              audioUrl={currentAudioData}
            />
          </div>
        ) : (
          <div className="min-h-screen flex flex-col">
            {/* Navigation Bar - Matching Landing Page */}
            <nav className="sticky left-0 top-0 z-[110] flex w-full flex-col border-b border-border bg-background">
              <div className="flex h-16 bg-background">
                <div className="container mx-auto flex w-full items-center justify-between px-6">
                  <Link href="/" className="flex items-center ring-offset-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
                        <Mic className="h-5 w-5 text-primary" strokeWidth={2.5} />
                      </div>
                      <span className="text-xl font-medium tracking-tight">Echo</span>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-3">
                    {session?.user ? (
                      <div className="hidden sm:block">
                        <UsageLimits compact />
                      </div>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
                        </Link>
                        <Link href="/signup">
                          <Button size="sm" className="bg-primary hover:bg-primary/90 font-medium">Get Started</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </nav>

            {/* Hero Section - Matching Landing Page */}
            <section className="relative min-h-[calc(630px-64px)] overflow-hidden pb-10">
              {/* Grid decoration */}
              <div className="absolute left-0 top-0 z-0 grid h-full w-full grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)] border-b border-border dark:border-border/50 dark:border-[oklch(0.20_0_0)]">
                <div className="col-span-1 flex h-full items-center justify-center" />
                <div className="col-span-1 flex h-full items-center justify-center border-x border-border dark:border-[oklch(0.30_0_0)]" />
                <div className="col-span-1 flex h-full items-center justify-center" />
              </div>
              
              {/* Gradient blur effects */}
              <figure className="pointer-events-none absolute -bottom-[70%] left-1/2 z-0 block aspect-square w-[720px] -translate-x-1/2 rounded-full bg-primary/30 blur-[300px] dark:bg-primary/30" />
              <figure className="pointer-events-none absolute left-[4vw] top-[64px] z-0 hidden aspect-square w-[40vw] rounded-full bg-white/20 opacity-20 blur-[180px] dark:bg-background dark:opacity-60 md:block" />
              <figure className="pointer-events-none absolute bottom-[-50px] right-[7vw] z-0 hidden aspect-square w-[38vw] rounded-full bg-white/20 opacity-20 blur-[180px] dark:bg-background dark:opacity-60 md:block" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col divide-y divide-border dark:divide-[oklch(0.30_0_0)] pt-[35px]">
                {/* Main hero content */}
                <div>
                  <div className="mx-auto flex min-h-[288px] max-w-[80vw] shrink-0 flex-col items-center justify-center gap-2 px-2 py-4 sm:px-16 lg:px-24">
                    <h1 className="!max-w-screen-lg text-pretty text-center text-[clamp(32px,7vw,64px)] font-medium leading-none tracking-[-1.44px] text-foreground md:tracking-[-2.16px]">
                      Effortless audio recording
                      <span className="block text-muted-foreground mt-2">powered by AI</span>
                    </h1>
                    <h2 className="text-md max-w-2xl text-pretty text-center text-muted-foreground md:text-lg">
                      Capture conversations with automatic transcription,
                      speaker identification, and intelligent summaries
                    </h2>
                  </div>
                </div>
                
                {/* Recording Interface */}
                <div className="flex items-start justify-center px-8 sm:px-24 py-8">
                  <div className="flex w-full max-w-[80vw] flex-col items-center justify-start md:!max-w-[600px]">
                    {/* Recorder & Upload Tabs */}
                    <div className="w-full">
                      <Tabs value={activeInputTab} onValueChange={(v) => setActiveInputTab(v as "record" | "upload")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/30 border border-border">
                          <TabsTrigger value="record" className="gap-2 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Record Audio
                          </TabsTrigger>
                          <TabsTrigger value="upload" className="gap-2 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload File
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="record" className="mt-0">
                          <AudioRecorderComponent
                            onRecordingComplete={handleRecordingCompleteFromRecorder}
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
                  </div>
                </div>
              </div>
            </section>

            {/* Features List */}
            <section className="py-16 md:py-24 border-t border-border">
              <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  <article className="flex flex-col items-center gap-4 rounded-lg border border-border p-6 dark:[box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset] hover:border-primary/30 transition-all duration-300">
                    <figure className="flex size-14 items-center justify-center rounded-lg border border-border bg-muted/50 p-3">
                      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </figure>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h3 className="text-base font-medium">Lossless Quality</h3>
                      <p className="text-sm text-muted-foreground">
                        High-fidelity WAV
                      </p>
                    </div>
                  </article>

                  <article className="flex flex-col items-center gap-4 rounded-lg border border-border p-6 dark:[box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset] hover:border-primary/30 transition-all duration-300">
                    <figure className="flex size-14 items-center justify-center rounded-lg border border-border bg-muted/50 p-3">
                      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </figure>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h3 className="text-base font-medium">Speaker Detection</h3>
                      <p className="text-sm text-muted-foreground">
                        Auto identify
                      </p>
                    </div>
                  </article>

                  <article className="flex flex-col items-center gap-4 rounded-lg border border-border p-6 dark:[box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset] hover:border-primary/30 transition-all duration-300">
                    <figure className="flex size-14 items-center justify-center rounded-lg border border-border bg-muted/50 p-3">
                      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </figure>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h3 className="text-base font-medium">AI Transcription</h3>
                      <p className="text-sm text-muted-foreground">
                        Real-time text
                      </p>
                    </div>
                  </article>

                  <article className="flex flex-col items-center gap-4 rounded-lg border border-border p-6 dark:[box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset] hover:border-primary/30 transition-all duration-300">
                    <figure className="flex size-14 items-center justify-center rounded-lg border border-border bg-muted/50 p-3">
                      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </figure>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h3 className="text-base font-medium">Smart Summaries</h3>
                      <p className="text-sm text-muted-foreground">
                        Key insights
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  )
}

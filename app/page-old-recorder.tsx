// "use client"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { useSession } from "@/lib/auth-client"

// export default function Home() {
//   const { data: session, isPending } = useSession();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isPending) {
//       if (session) {
//         router.replace("/dashboard");
//       } else {
//         router.replace("/login");
//       }
//     }
//   }, [session, isPending, router]);

//   // Show loading while checking auth
//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
//         <p className="mt-4 text-muted-foreground">Loading...</p>
//       </div>
//     </div>
//   );
// }

// // Old implementation removed - redirecting to dashboard now
// /*
// export default function OldHome() {
//   const { data: session } = useSession();
//   const [currentTranscription, setCurrentTranscription] = useState<GladiaTranscriptionResult | null>(null)
//   const [currentSummary, setCurrentSummary] = useState<MeetingSummary | null>(null)
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | undefined>()
//   const [hideRecorder, setHideRecorder] = useState(false)
//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
//   const [refreshTrigger, setRefreshTrigger] = useState(0)
//   const [currentAudioData, setCurrentAudioData] = useState<string | undefined>()
//   const { toast } = useToast()

//   // Function to create speaker-labeled transcript with name mapping
//   const createSpeakerLabeledTranscript = (transcriptionResult: GladiaTranscriptionResult) => {
//     if (!transcriptionResult?.result?.transcription?.utterances) {
//       return {
//         labeledTranscript: transcriptionResult?.result?.transcription?.full_transcript || "",
//         speakerMapping: {},
//         groups: []
//       }
//     }

//     const utterances = transcriptionResult.result.transcription.utterances
//     const namedEntities = transcriptionResult.result.named_entities || []
//     const fullTranscript = transcriptionResult.result.transcription.full_transcript || ""

//     // Extract potential speaker names from named entities (people)
//     const personNames = namedEntities
//       .filter(entity => entity.type?.toLowerCase() === 'person' || entity.type?.toLowerCase() === 'per')
//       .map(entity => entity.entity)
//       .filter(name => name && name.length > 1)

//     // Also try to extract names from common introductory phrases
//     const namePatterns = [
//       /(?:I'm|I am|My name is|This is|I'm called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
//       /(?:Hi|Hello),?\s+(?:I'm|I am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
//       /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:speaking|here|talking)/gi
//     ]

//     const extractedNames = new Set<string>()
//     namePatterns.forEach(pattern => {
//       let match
//       while ((match = pattern.exec(fullTranscript)) !== null) {
//         const name = match[1].trim()
//         if (name.length > 1 && !name.match(/^(Speaker|Um|Uh|Oh|Yeah|Yes|No|Okay|Alright)$/i)) {
//           extractedNames.add(name)
//         }
//       }
//     })

//     // Combine extracted names with named entities
//     const allPotentialNames = [...new Set([...personNames, ...Array.from(extractedNames)])]

//     // Create speaker mapping
//     const speakerMapping: { [key: string]: string } = {}
//     const uniqueSpeakers = [...new Set(utterances.map((u: any) => u.speaker))].sort()

//     // Try to map speakers to names if we have enough names
//     if (allPotentialNames.length > 0) {
//       uniqueSpeakers.forEach((speaker, index) => {
//         if (index < allPotentialNames.length) {
//           speakerMapping[speaker] = allPotentialNames[index]
//         } else {
//           speakerMapping[speaker] = `Speaker ${speaker}`
//         }
//       })
//     } else {
//       // Default mapping
//       uniqueSpeakers.forEach(speaker => {
//         speakerMapping[speaker] = `Speaker ${speaker}`
//       })
//     }

//     // Group consecutive utterances by the same speaker
//     const groups: any[] = []
//     utterances.forEach((utterance: any) => {
//       const lastGroup = groups[groups.length - 1]
//       if (lastGroup && lastGroup.speaker === utterance.speaker) {
//         lastGroup.text += " " + utterance.text
//         lastGroup.end = utterance.end
//       } else {
//         groups.push({
//           speaker: utterance.speaker,
//           text: utterance.text,
//           start: utterance.start,
//           end: utterance.end,
//         })
//       }
//     })

//     // Format the transcript with speaker labels
//     const labeledTranscript = groups.map(group => {
//       const speakerName = speakerMapping[group.speaker] || `Speaker ${group.speaker}`
//       const startTime = Math.floor(group.start / 60) + ":" + String(Math.floor(group.start % 60)).padStart(2, '0')
//       return `[${startTime}] ${speakerName}: ${group.text}`
//     }).join('\n\n')

//     return {
//       labeledTranscript,
//       speakerMapping,
//       groups
//     }
//   }

//   const handleRecordingComplete = async (audioBlob: Blob, filename: string) => {
//     setIsProcessing(true)
//     setCurrentTranscription(null)
//     setCurrentSummary(null)
//     setHideRecorder(true) // Hide the recorder after upload and transcribe is clicked

//     // Generate ID for tracking, but don't save to storage yet
//     const transcriptionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

//     try {
//       // Step 1: Upload audio file
//       toast({
//         title: "Uploading audio...",
//         description: "Saving your recording and preparing for transcription.",
//       })

//       const formData = new FormData()
//       formData.append("audio", audioBlob, filename)

//       const uploadResponse = await fetch("/api/upload-audio", {
//         method: "POST",
//         body: formData,
//       })

//       if (!uploadResponse.ok) {
//         throw new Error("Failed to upload audio")
//       }

//       const uploadData = await uploadResponse.json()

//       // Convert audio blob to base64 for storage right after upload
//       const audioBase64 = await new Promise<string>((resolve) => {
//         const reader = new FileReader()
//         reader.onloadend = () => resolve(reader.result as string)
//         reader.readAsDataURL(audioBlob)
//       })

//       // Generate the filename and save transcription immediately with audio data
//       const currentCount = LocalStorageService.getTranscriptionCount()
//       const nextNumber = currentCount + 1
//       const finalFilename = `Audio-${nextNumber}.wav`

//       // Save new transcription with audio data from the start
//       LocalStorageService.saveNewTranscription(transcriptionId, finalFilename)
//       LocalStorageService.updateTranscription(transcriptionId, { audioData: audioBase64 })

//       // If user is logged in, also save to database
//       if (session?.user) {
//         try {
//           const meetingResponse = await fetch("/api/meetings", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               title: `Recording ${finalFilename}`,
//               startTime: new Date().toISOString(),
//               audioFileUrl: uploadData.filename,
//               status: "processing",
//             }),
//           });

//           if (meetingResponse.ok) {
//             const { meeting } = await meetingResponse.json();
//             // Store meeting ID in local storage for later reference
//             LocalStorageService.updateTranscription(transcriptionId, { meetingId: meeting.id });
//           }
//         } catch (dbError) {
//           console.error("Failed to save to database:", dbError);
//           // Continue processing even if database save fails
//         }
//       }

//       // Trigger sidebar refresh to show the new item
//       setRefreshTrigger(prev => prev + 1)

//       // Step 2: Start transcription
//       toast({
//         title: "Starting transcription...",
//         description: "Processing your audio with Gladia AI for transcription and speaker diarization.",
//       })

//       const transcribeResponse = await fetch("/api/transcribe", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ filename: uploadData.filename }),
//       })

//       if (!transcribeResponse.ok) {
//         throw new Error("Failed to start transcription")
//       }

//       const transcribeData = await transcribeResponse.json()
//       const requestId = transcribeData.requestId

//       console.log("Transcribe response data:", transcribeData)
//       console.log("Extracted requestId:", requestId)

//       if (!requestId) {
//         throw new Error("No requestId received from transcription initiation")
//       }

//       // Step 3: Poll for transcription completion
//       toast({
//         title: "Transcription in progress...",
//         description: "This may take a few minutes depending on audio length.",
//       })

//       let attempts = 0
//       const maxAttempts = 60 // 5 minutes max

//       while (attempts < maxAttempts) {
//         await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds

//         console.log(`Attempt ${attempts + 1}: Polling for transcription result`)
//         console.log("Using requestId:", requestId)
//         console.log("Full URL:", `/api/transcribe?requestId=${requestId}`)

//         const resultResponse = await fetch(`/api/transcribe?requestId=${requestId}`)
//         if (!resultResponse.ok) {
//           const errorText = await resultResponse.text()
//           console.error("Failed response:", resultResponse.status, errorText)
//           throw new Error(`Failed to get transcription result: ${resultResponse.status} ${errorText}`)
//         }

//         const resultData = await resultResponse.json()
//         const result = resultData.result

//         if (result.status === "done") {
//           setCurrentTranscription(result)
//           setSelectedTranscriptionId(transcriptionId)

//           // Step 4: Generate summary in parallel
//           toast({
//             title: "Generating summary...",
//             description: "Creating an AI-powered meeting summary with Gemini.",
//           })

//           // Generate summary - show clear error if it fails
//           let summaryData: MeetingSummary | undefined

//           try {
//             // Create speaker-labeled transcript with name mapping
//             const transcriptData = createSpeakerLabeledTranscript(result)

//             const summaryResponse = await fetch("/api/summarize", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 transcript: transcriptData.labeledTranscript,
//                 rawTranscript: result.result.transcription.full_transcript,
//                 speakers: result.result.speakers,
//                 namedEntities: result.result.named_entities,
//                 speakerMapping: transcriptData.speakerMapping,
//               }),
//             })

//             if (!summaryResponse.ok) {
//               const errorData = await summaryResponse.json()
//               throw new Error(`Summary generation failed: ${errorData.error || "Unknown API error"}`)
//             }

//             const summaryResponse_data = await summaryResponse.json()
//             if (!summaryResponse_data.success || !summaryResponse_data.summary) {
//               throw new Error("Summary API returned invalid response format")
//             }

//             summaryData = summaryResponse_data.summary
//             setCurrentSummary(summaryData || null)
//           } catch (summaryError) {
//             console.error("Summary generation failed:", summaryError)
//             // Continue without summary - don't fail the whole process
//           }

//           // Complete transcription with results
//           LocalStorageService.completeTranscription(transcriptionId, result, summaryData)

//           // If user is logged in, save transcript and summary to database
//           if (session?.user) {
//             try {
//               const stored = LocalStorageService.getTranscription(transcriptionId);
//               if (stored?.meetingId) {
//                 // Update meeting status
//                 await fetch(`/api/meetings/${stored.meetingId}`, {
//                   method: "PUT",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({
//                     status: "completed",
//                     endTime: new Date().toISOString(),
//                   }),
//                 });

//                 // Save transcript to database
//                 if (result?.result?.transcription) {
//                   await fetch("/api/transcriptions", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                       meetingId: stored.meetingId,
//                       content: result.result.transcription.full_transcript,
//                       language: result.result.transcription.language,
//                       speakerCount: result.result.speakers?.length || 0,
//                       duration: result.result.transcription.audio_duration,
//                       confidence: Math.round((result.result.transcription.confidence || 0) * 100),
//                       metadata: {
//                         utterances: result.result.transcription.utterances,
//                         speakers: result.result.speakers,
//                         namedEntities: result.result.named_entities,
//                       },
//                     }),
//                   });
//                 }

//                 // Save summary to database
//                 if (summaryData) {
//                   await fetch("/api/summaries", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                       meetingId: stored.meetingId,
//                       summary: summaryData.overview,
//                       actionPoints: summaryData.actionItems,
//                       keyTopics: summaryData.topics,
//                       participants: summaryData.participants,
//                       sentiment: summaryData.sentiment,
//                     }),
//                   });
//                 }
//               }
//             } catch (dbError) {
//               console.error("Failed to save to database:", dbError);
//               // Continue even if database save fails
//             }
//           }

//           // Set current audio data for display
//           setCurrentAudioData(audioBase64)

//           toast({
//             title: "Processing complete!",
//             description: "Your audio has been transcribed and summarized successfully.",
//           })

//           break
//         } else if (result.status === "error") {
//           throw new Error(`Transcription failed: ${result.error}`)
//         }

//         attempts++
//       }

//       if (attempts >= maxAttempts) {
//         throw new Error("Transcription timeout - took too long to complete")
//       }
//     } catch (error) {
//       console.error("Processing error:", error)

//       // Don't save failed transcriptions to avoid incrementing counter
//       // Just show error message to user

//       toast({
//         title: "Processing failed",
//         description: error instanceof Error ? error.message : "An unexpected error occurred.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleTranscriptionSelect = async (storedTranscription: StoredTranscription) => {
//     if (storedTranscription.status === "processing") {
//       toast({
//         title: "Transcription in progress",
//         description: "This transcription is still being processed.",
//         variant: "destructive",
//       })
//       return
//     }

//     if (storedTranscription.status === "failed") {
//       toast({
//         title: "Transcription failed",
//         description: storedTranscription.error || "This transcription failed to process.",
//         variant: "destructive",
//       })
//       return
//     }

//     if (!storedTranscription.transcriptionData) {
//       toast({
//         title: "No transcription data",
//         description: "This transcription has no data available.",
//         variant: "destructive",
//       })
//       return
//     }

//     setSelectedTranscriptionId(storedTranscription.id)
//     setCurrentTranscription(storedTranscription.transcriptionData)
//     setCurrentSummary(storedTranscription.summaryData || null)
//     setCurrentAudioData(storedTranscription.audioData)
//     setHideRecorder(true) // Hide recorder when viewing existing transcriptions

//     // If no summary exists and transcription is complete, try to generate one
//     if (!storedTranscription.summaryData && storedTranscription.transcriptionData) {
//       setIsProcessing(true)

//       try {
//         // Create speaker-labeled transcript with name mapping
//         const transcriptData = createSpeakerLabeledTranscript(storedTranscription.transcriptionData)

//         const summaryResponse = await fetch("/api/summarize", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             transcript: transcriptData.labeledTranscript,
//             rawTranscript: storedTranscription.transcriptionData.result.transcription.full_transcript,
//             speakers: storedTranscription.transcriptionData.result.speakers,
//             namedEntities: storedTranscription.transcriptionData.result.named_entities,
//             speakerMapping: transcriptData.speakerMapping,
//           }),
//         })

//         if (summaryResponse.ok) {
//           const summaryData = await summaryResponse.json()
//           if (summaryData.success && summaryData.summary) {
//             setCurrentSummary(summaryData.summary)

//             // Update local storage with the new summary
//             LocalStorageService.updateTranscription(storedTranscription.id, {
//               summaryData: summaryData.summary,
//             })
//           }
//         }
//       } catch (error) {
//         console.error("Error generating summary:", error)
//         // Don't show error toast for optional summary generation
//       } finally {
//         setIsProcessing(false)
//       }
//     }
//   }

//   const handleNewRecording = () => {
//     // Clear all current data to focus on new recording
//     setCurrentTranscription(null)
//     setCurrentSummary(null)
//     setSelectedTranscriptionId(undefined)
//     setIsProcessing(false)
//     setHideRecorder(false) // Show the recorder again for new recording

//     // Show success toast to indicate new recording mode
//     toast({
//       title: "Ready for new recording",
//       description: "Previous data cleared. You can now start a new recording.",
//     })
//   }

//   return (
//     <div className="min-h-screen flex bg-background">
//       {/* Fixed Sidebar }*/
//       <div className={`fixed top-0 left-0 h-full bg-sidebar border-r border-border transition-all duration-300 z-50 ${isSidebarCollapsed ? 'w-12' : 'w-80'}`}>
//         <TranscriptionSidebar
//           onTranscriptionSelect={handleTranscriptionSelect}
//           selectedTranscriptionId={selectedTranscriptionId}
//           onNewRecording={handleNewRecording}
//           isCollapsed={isSidebarCollapsed}
//           onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
//           refreshTrigger={refreshTrigger}
//         />
//       </div>

//       {/* Main Content with left margin */}
//       <div className={`flex-1 flex flex-col bg-background transition-all duration-300 ${isSidebarCollapsed ? 'ml-12' : 'ml-80'}`}>
//         {(currentTranscription || currentSummary || isProcessing) ? (
//           /* Show transcript tabs when available - no hero section */
//           <div className="w-full h-full">
//             <TabbedTranscriptDisplay
//               transcription={currentTranscription}
//               summary={currentSummary}
//               isLoading={isProcessing}
//               onNewRecording={handleNewRecording}
//               isSidebarCollapsed={isSidebarCollapsed}
//             />
//           </div>
//         ) : (
//           /* Show hero section + recording interface for new recordings */
//           <>
//             {/* Hero Section - only on new recording page */}
//             <div className="pt-16 pb-4 px-8">
//               <div className="max-w-4xl mx-auto text-center">
//                 <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tighter" style={{fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'}}>
//                   Record anything, remember everything
//                 </h1>
//                 <p className="text-lg text-muted-foreground">
//                   AI-powered transcription with speaker identification and smart summaries
//                 </p>
//               </div>
//             </div>

//             {/* Recording Interface */}
//             <div className="flex-1 flex items-start justify-center pt-2">
//               <div className="w-full max-w-5xl mx-auto">
//                 <AudioRecorderComponent
//                   onRecordingComplete={handleRecordingComplete}
//                   onRecordingStart={() => {
//                     setCurrentTranscription(null)
//                     setCurrentSummary(null)
//                     setSelectedTranscriptionId(undefined)
//                   }}
//                 />
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       <Toaster />
//     </div>
//   )
// }

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, MessageSquare, Plus, Loader2, Zap, CheckCircle2, ListTodo } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toaster"
import { useSession } from "@/lib/auth-client"
import { UsageLimits } from "@/components/billing/UsageLimits"
import { EncryptedAudioDownloadButton } from "@/components/encrypted-audio-download-button"
import type { TranscriptionResult } from "@/lib/assemblyai-service"
import type { MeetingSummary } from "@/lib/openai-summary-service"

interface TabbedTranscriptDisplayProps {
  transcription: TranscriptionResult | null
  summary?: MeetingSummary | null  // Made optional since we're using AssemblyAI summary
  isLoading?: boolean
  onNewRecording?: () => void
  isSidebarCollapsed?: boolean
  meetingId?: string | null // This is actually the recordingId
  audioUrl?: string
  hideUsageLimits?: boolean // Option to hide usage limits
}

export function TabbedTranscriptDisplay({ transcription, summary, isLoading, onNewRecording, isSidebarCollapsed, meetingId, audioUrl, hideUsageLimits = false }: TabbedTranscriptDisplayProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [showTranscriptEmailDialog, setShowTranscriptEmailDialog] = useState(false);
  const [showSummaryEmailDialog, setShowSummaryEmailDialog] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'fulltext' | 'summary'>('transcript');
  
  // Navigation items
  const navItems = [
    { id: 'transcript', label: 'Transcript', icon: User },
    { id: 'fulltext', label: 'Full Text', icon: MessageSquare },
  { id: 'summary', label: 'Summary', icon: Clock },
  ] as const

  const formatTime = (milliseconds: number): string => {
    if (typeof milliseconds !== 'number' || isNaN(milliseconds)) {
      return "00:00"
    }
    const totalSeconds = Math.floor(milliseconds / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSpeakerColor = (speaker: string): string => {
    const colors = [
      "bg-chart-3/10 text-chart-3",
      "bg-primary/10 text-primary",
      "bg-chart-1/10 text-chart-1",
      "bg-chart-4/10 text-chart-4",
      "bg-chart-2/10 text-chart-2",
      "bg-chart-5/10 text-chart-5",
    ]

    let hash = 0
    for (let i = 0; i < speaker.length; i++) {
      hash = speaker.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Group consecutive utterances by the same speaker
  const groupUtterancesBySpeaker = () => {
    if (!transcription?.result?.transcription?.utterances) {
      return []
    }

    const utterances = transcription.result.transcription.utterances
    const groups: any[] = []

    utterances.forEach((utterance: any) => {
      const lastGroup = groups[groups.length - 1]

      if (lastGroup && lastGroup.speaker === utterance.speaker) {
        // Merge with the previous group
        lastGroup.text += " " + utterance.transcription
        lastGroup.end = utterance.time_end
      } else {
        // Create a new group
        groups.push({
          speaker: utterance.speaker,
          text: utterance.transcription,
          start: utterance.time_begin,
          end: utterance.time_end,
        })
      }
    })

    return groups
  }

  const handleSendTranscript = async () => {
    if (!emailRecipients.trim() || !meetingId) return;

    setIsSendingEmail(true);
    try {
      const recipients = emailRecipients.split(',').map(e => e.trim()).filter(e => e);
      
      const response = await fetch("/api/gmail/send-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          recipients,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send transcript email");
      }

      toast({
        title: "Transcript sent!",
        description: `Email sent to ${recipients.length} recipient(s)`,
      });

      setShowTranscriptEmailDialog(false);
      setEmailRecipients("");
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendSummary = async () => {
    if (!emailRecipients.trim() || !meetingId) return;

    setIsSendingEmail(true);
    try {
      const recipients = emailRecipients.split(',').map(e => e.trim()).filter(e => e);
      
      const response = await fetch("/api/gmail/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          recipients,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send summary email");
      }

      toast({
        title: "Summary sent!",
        description: `Email sent to ${recipients.length} recipient(s)`,
      });

      setShowSummaryEmailDialog(false);
      setEmailRecipients("");
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">Processing transcription...</h3>
            <p className="text-muted-foreground text-sm">This may take a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  if (!transcription && !summary) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <MessageSquare className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <div className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">No transcription yet</h3>
            <p className="text-muted-foreground">
              Record audio and complete transcription to view your results here
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header - Modern SaaS Style */}
      <div className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Top row: Nav items with Download button - Pill style navigation */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full">
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md transition-all h-8 sm:h-9 px-2 sm:px-4 flex-shrink-0 ${
                        isActive 
                          ? 'bg-background shadow-sm font-semibold' 
                          : 'hover:bg-background/50 font-medium'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Button>
                  )
                })}
              </div>
              {/* Download button right next to tabs */}
              {meetingId && (
                <EncryptedAudioDownloadButton recordingId={meetingId} className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0" />
              )}
            </div>
            {/* Bottom row: Usage Limits and New Recording Button */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {!hideUsageLimits && (
                <div className="bg-card border border-border rounded-lg px-2 sm:px-3 shadow-sm h-8 sm:h-9 flex items-center">
                  <UsageLimits compact />
                </div>
              )}
              {onNewRecording && (
                <Button
                  onClick={onNewRecording}
                  className="flex items-center gap-1.5 sm:gap-2 shadow-sm h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">New Recording</span>
                  <span className="sm:hidden">New</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Spacious and clean */}
      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12">
          {/* Transcript Section - Conversation Style */}
          {activeTab === 'transcript' && transcription && (
            <section id="transcript" className="space-y-6">
              {/* Section Header */}
              <div className="space-y-1">
                <h2 className="text-3xl font-medium text-foreground tracking-tight">Conversation</h2>
                <p className="text-sm text-muted-foreground">Natural flow of the discussion</p>
              </div>
              
              {/* Conversation Thread - Inline badge style like the image */}
              <div className="space-y-6 py-4">
                {groupUtterancesBySpeaker().map((segment, index) => {
                  const speakerColor = getSpeakerColor(`Speaker ${segment.speaker}`)
                  
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <Badge className={`${speakerColor} px-2.5 py-0.5 font-medium text-xs uppercase tracking-wide flex-shrink-0`}>
                          SPEAKER: {segment.speaker}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTime(segment.start)}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed text-[15px] pl-0">
                        {segment.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Full Text Section - Clean and readable */}
          {activeTab === 'fulltext' && transcription?.result?.transcription?.full_transcript && (
            <section id="fulltext" className="space-y-8">
              {/* Section Header */}
              <div className="space-y-1">
                <h2 className="text-3xl font-medium text-foreground tracking-tight">Full Transcript</h2>
                <p className="text-sm text-muted-foreground">Complete conversation in continuous format</p>
              </div>
              
              {/* Full Text Card */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-8">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                    {transcription.result.transcription.full_transcript}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Summary Section - Executive style */}
          {activeTab === 'summary' && transcription && (
            <section id="summary" className="space-y-8">
              {/* Section Header */}
              <div className="space-y-1">
                <h2 className="text-3xl font-medium text-foreground tracking-tight">AI-Powered Insights</h2>
                <p className="text-sm text-muted-foreground">Summary, topics, and key entities from your conversation</p>
              </div>

              <div className="space-y-8">
                {/* AI Summary Card */}
                {transcription.result.summary && (
                  <Card className="border border-border/40 dark:border-2 dark:border-border dark:shadow-md bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="text-2xl font-medium text-foreground tracking-tight">Summary</h3>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {transcription.result.summary.split('\n').map((line, index) => (
                          <p key={index} className="text-muted-foreground leading-relaxed text-base mb-2">
                            {line}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Moments of Meeting Section */}
                {summary?.keyMoments && summary.keyMoments.length > 0 && (
                  <Card className="border border-border/40 dark:border-2 dark:border-border dark:shadow-md">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-2 mb-6">
                        <Zap className="h-5 w-5 text-primary" />
                        <h3 className="text-2xl font-medium text-foreground tracking-tight">Moments of Meeting</h3>
                      </div>
                      <ul className="space-y-3">
                        {summary.keyMoments.map((moment, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="text-primary font-medium flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{moment.description}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Points Section */}
                {summary?.structuredDecisions && summary.structuredDecisions.length > 0 && (
                  <Card className="border border-border/40 dark:border-2 dark:border-border dark:shadow-md">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-2 mb-6">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <h3 className="text-2xl font-medium text-foreground tracking-tight">Action Points</h3>
                      </div>
                      <ul className="space-y-3">
                        {summary.structuredDecisions.map((decision, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="text-primary font-medium flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{decision.description}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* To-Dos Section */}
                {summary?.structuredTodos && summary.structuredTodos.length > 0 && (
                  <Card className="border border-border/40 dark:border-2 dark:border-border dark:shadow-md">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-2 mb-6">
                        <ListTodo className="h-5 w-5 text-primary" />
                        <h3 className="text-2xl font-medium text-foreground tracking-tight">To-Dos</h3>
                      </div>
                      <ul className="space-y-3">
                        {summary.structuredTodos.map((todo, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="text-primary font-medium flex-shrink-0">•</span>
                            <p className="text-foreground leading-relaxed">{todo.task}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Stats Pills */}
                <div className="flex flex-wrap gap-3">
                  <div className="px-5 py-3 bg-muted/50 rounded-xl border border-border dark:shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {transcription.result.metadata.audio_duration 
                          ? `${Math.floor(transcription.result.metadata.audio_duration / 60)}:${Math.floor(transcription.result.metadata.audio_duration % 60).toString().padStart(2, '0')}`
                          : '0:00'}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-muted/50 rounded-xl border border-border dark:shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {transcription.result.metadata.number_of_distinct_speakers} speakers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Grid - IAB Categories and Entities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* IAB Categories (Topics) */}
                  {transcription.result.iab_categories?.summary && 
                   Object.keys(transcription.result.iab_categories.summary).length > 0 && (
                    <Card className="border border-border/40 dark:border-2 dark:border-border dark:shadow-md">
                      <CardContent className="p-8">
                        <h4 className="text-xl font-medium text-foreground mb-6 tracking-tight flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          Topics Discussed
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(transcription.result.iab_categories.summary)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 8)
                            .map(([category, relevance], index) => (
                              <div key={index} className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {category.split('>').pop()}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {category.split('>').slice(0, -1).join(' > ')}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="flex-shrink-0">
                                  {((relevance as number) * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Entity Highlights */}
                  {transcription.result.named_entities && transcription.result.named_entities.length > 0 && (
                    <Card className="border border-border/40 dark:border-2 dark:border-border dark:shadow-md">
                      <CardContent className="p-8">
                        <h4 className="text-xl font-medium text-foreground mb-6 tracking-tight flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Key Entities
                        </h4>
                        <div className="space-y-6">
                          {/* People */}
                          {transcription.result.named_entities.filter(e => 
                            e.type === 'person_name' || e.type === 'person_age'
                          ).length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">People</p>
                              <div className="flex flex-wrap gap-2.5">
                                {transcription.result.named_entities
                                  .filter(e => e.type === 'person_name' || e.type === 'person_age')
                                  .slice(0, 6)
                                  .map((entity, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/40 hover:bg-blue-500/25 dark:hover:bg-blue-500/35 transition-colors px-3 py-1.5 text-sm font-medium"
                                    >
                                      {entity.entity}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Organizations */}
                          {transcription.result.named_entities.filter(e => 
                            e.type === 'organization'
                          ).length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organizations</p>
                              <div className="flex flex-wrap gap-2.5">
                                {transcription.result.named_entities
                                  .filter(e => e.type === 'organization')
                                  .slice(0, 6)
                                  .map((entity, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 dark:border-purple-500/40 hover:bg-purple-500/25 dark:hover:bg-purple-500/35 transition-colors px-3 py-1.5 text-sm font-medium"
                                    >
                                      {entity.entity}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Locations */}
                          {transcription.result.named_entities.filter(e => 
                            e.type === 'location'
                          ).length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locations</p>
                              <div className="flex flex-wrap gap-2.5">
                                {transcription.result.named_entities
                                  .filter(e => e.type === 'location')
                                  .slice(0, 6)
                                  .map((entity, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40 hover:bg-emerald-500/25 dark:hover:bg-emerald-500/35 transition-colors px-3 py-1.5 text-sm font-medium"
                                    >
                                      {entity.entity}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Dates */}
                          {transcription.result.named_entities.filter(e => 
                            e.type === 'date' || e.type === 'date_interval'
                          ).length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dates</p>
                              <div className="flex flex-wrap gap-2.5">
                                {transcription.result.named_entities
                                  .filter(e => e.type === 'date' || e.type === 'date_interval')
                                  .slice(0, 6)
                                  .map((entity, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40 hover:bg-amber-500/25 dark:hover:bg-amber-500/35 transition-colors px-3 py-1.5 text-sm font-medium"
                                    >
                                      {entity.entity}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Other entities */}
                          {transcription.result.named_entities.filter(e => 
                            !['person_name', 'person_age', 'organization', 'location', 'date', 'date_interval'].includes(e.type)
                          ).length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other</p>
                              <div className="flex flex-wrap gap-2.5">
                                {transcription.result.named_entities
                                  .filter(e => !['person_name', 'person_age', 'organization', 'location', 'date', 'date_interval'].includes(e.type))
                                  .slice(0, 6)
                                  .map((entity, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="bg-slate-500/15 dark:bg-slate-500/25 text-slate-700 dark:text-slate-300 border border-slate-500/30 dark:border-slate-500/40 hover:bg-slate-500/25 dark:hover:bg-slate-500/35 transition-colors px-3 py-1.5 text-sm font-medium"
                                    >
                                      {entity.entity}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </section>
          )}

        </div>
      </ScrollArea>

      {/* Email Dialogs */}
      <Dialog open={showTranscriptEmailDialog} onOpenChange={setShowTranscriptEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Transcript via Email</DialogTitle>
            <DialogDescription>
              Enter recipient email addresses separated by commas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transcript-emails">Recipients</Label>
              <Input
                id="transcript-emails"
                placeholder="email1@example.com, email2@example.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTranscriptEmailDialog(false)}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTranscript}
              disabled={!emailRecipients.trim() || isSendingEmail}
            >
              {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSummaryEmailDialog} onOpenChange={setShowSummaryEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Summary via Email</DialogTitle>
            <DialogDescription>
              Enter recipient email addresses separated by commas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="summary-emails">Recipients</Label>
              <Input
                id="summary-emails"
                placeholder="email1@example.com, email2@example.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSummaryEmailDialog(false)}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendSummary}
              disabled={!emailRecipients.trim() || isSendingEmail}
            >
              {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, MessageSquare, Plus, Mail, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toaster"
import { useSession } from "@/lib/auth-client"
import type { GladiaTranscriptionResult } from "@/lib/gladia-service"
import type { MeetingSummary } from "@/lib/gemini-service"

interface TabbedTranscriptDisplayProps {
  transcription: GladiaTranscriptionResult | null
  summary: MeetingSummary | null
  isLoading?: boolean
  onNewRecording?: () => void
  isSidebarCollapsed?: boolean
  meetingId?: string | null
}

export function TabbedTranscriptDisplay({ transcription, summary, isLoading, onNewRecording, isSidebarCollapsed, meetingId }: TabbedTranscriptDisplayProps) {
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

  const formatTime = (seconds: number): string => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return "00:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
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
        lastGroup.text += " " + utterance.text
        lastGroup.end = utterance.end
      } else {
        // Create a new group
        groups.push({
          speaker: utterance.speaker,
          text: utterance.text,
          start: utterance.start,
          end: utterance.end,
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
            <h3 className="text-lg font-semibold text-foreground">Processing transcription...</h3>
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
            <h3 className="text-xl font-semibold text-foreground">No transcription yet</h3>
            <p className="text-muted-foreground">
              Record audio and complete transcription to view your results here
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Navigation Header - Modern SaaS Style */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
          <div className="flex items-center justify-between">
            {/* Nav items - Pill style navigation with active state */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 text-sm rounded-md transition-all ${
                      isActive 
                        ? 'bg-background shadow-sm font-semibold' 
                        : 'hover:bg-background/50 font-medium'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </div>
            {/* New Recording Button - Prominent CTA */}
            {onNewRecording && (
              <Button
                onClick={onNewRecording}
                size="sm"
                className="flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>New Recording</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Spacious and clean */}
      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          {/* Transcript Section - Conversation Style */}
          {activeTab === 'transcript' && transcription && (
            <section id="transcript" className="space-y-6">
              {/* Section Header */}
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Conversation</h2>
                <p className="text-sm text-muted-foreground">Natural flow of the discussion</p>
              </div>
              
              {/* Conversation Thread - Clean text format */}
              <div className="space-y-3 py-4">
                {groupUtterancesBySpeaker().map((segment, index) => {
                  const speakerColor = getSpeakerColor(`Speaker ${segment.speaker}`)
                  
                  return (
                    <div key={index} className="flex gap-4 items-start group hover:bg-muted/30 -mx-4 px-4 py-2 rounded-lg transition-colors">
                      {/* Speaker Badge */}
                      <Badge className={`${speakerColor} px-3 py-1 font-semibold rounded-full flex-shrink-0 mt-0.5`}>
                        Speaker {segment.speaker}
                      </Badge>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatTime(segment.start)}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed text-[15px]">
                          {segment.text}
                        </p>
                      </div>
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
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Full Transcript</h2>
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
          {activeTab === 'summary' && summary && (
            <section id="summary" className="space-y-8">
              {/* Section Header */}
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Meeting Summary</h2>
                <p className="text-sm text-muted-foreground">AI-generated insights and key takeaways</p>
              </div>

              <div className="space-y-8">
                {/* Overview Card - Hero style */}
                <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card/50">
                  <CardContent className="p-8 space-y-4">
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{summary.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{summary.overview}</p>
                  </CardContent>
                </Card>

                {/* Stats - Modern pills */}
                <div className="flex flex-wrap gap-3">
                  <div className="px-5 py-3 bg-muted/50 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{summary.duration}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-muted/50 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{summary.participants.length} participants</span>
                    </div>
                  </div>
                  {summary.sentiment && (
                    <div className="px-5 py-3 bg-muted/50 rounded-xl border border-border/50 shadow-sm">
                      <div className={`flex items-center gap-2 text-sm font-medium ${
                        summary.sentiment === "positive"
                          ? "text-chart-1"
                          : summary.sentiment === "negative"
                            ? "text-destructive"
                            : "text-chart-4"
                      }`}>
                        <span className="capitalize">{summary.sentiment} sentiment</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Grid - Spacious cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Points */}
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-8">
                      <h4 className="text-xl font-bold text-foreground mb-6 tracking-tight">Key Points</h4>
                      <div className="space-y-4">
                        {summary.keyPoints.map((point, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                              <span className="text-primary-foreground text-xs font-bold">{index + 1}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground flex-1">{point}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-8">
                      <h4 className="text-xl font-bold text-foreground mb-6 tracking-tight">Action Items</h4>
                      <div className="space-y-4">
                        {summary.actionItems.map((item, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-chart-1 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground flex-1">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Decisions - Full width */}
                {summary.decisions.length > 0 && (
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-8">
                      <h4 className="text-xl font-bold text-foreground mb-6 tracking-tight">Decisions Made</h4>
                      <div className="space-y-4">
                        {summary.decisions.map((decision, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-chart-4 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground flex-1">{decision}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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

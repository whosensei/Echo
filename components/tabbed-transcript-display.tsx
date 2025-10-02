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
  // Navigation items
  const navItems = [
    { id: 'transcript', label: 'Transcript', icon: User },
    { id: 'fulltext', label: 'Full Text', icon: MessageSquare },
    { id: 'summary', label: 'Summary', icon: Clock },
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
      "bg-purple-100 text-purple-800",
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
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
      {/* Navigation Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="py-4 pl-4 pr-0 relative">
          <div className="flex items-center justify-center">
            {/* Nav items centered */}
            <div className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
            {/* New Recording Button - Absolutely positioned to right edge */}
            {onNewRecording && isSidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onNewRecording}
                    size="sm"
                    className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Recording</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-8 p-6">
          {/* Transcript Section */}
          {transcription && (
            <section id="transcript" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Transcript
                </h2>
                {session?.user && meetingId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranscriptEmailDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send via Email
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {groupUtterancesBySpeaker().map((segment, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <Badge className={`${getSpeakerColor(`Speaker ${segment.speaker}`)} font-medium`}>
                            Speaker {segment.speaker}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(segment.start)}
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed flex-1">
                          {segment.text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Full Text Section */}
          {transcription?.result?.transcription?.full_transcript && (
            <section id="fulltext" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Full Text
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {transcription.result.transcription.full_transcript}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Summary Section */}
          {summary && (
            <section id="summary" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  Summary
                </h2>
                {session?.user && meetingId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSummaryEmailDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send via Email
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Header */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-foreground">{summary.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{summary.overview}</p>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-muted rounded-lg border">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{summary.duration}</span>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-lg border">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{summary.participants.length} participants</span>
                    </div>
                  </div>
                  {summary.sentiment && (
                    <div className="px-4 py-2 bg-muted rounded-lg border">
                      <div className={`flex items-center gap-2 text-sm ${
                        summary.sentiment === "positive"
                          ? "text-green-600"
                          : summary.sentiment === "negative"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}>
                        <span className="font-medium capitalize">{summary.sentiment} sentiment</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Points */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Key Points</h4>
                      <div className="space-y-3">
                        {summary.keyPoints.map((point, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-primary-foreground text-xs font-bold">{index + 1}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{point}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Action Items</h4>
                      <div className="space-y-3">
                        {summary.actionItems.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">•</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Decisions */}
                {summary.decisions.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Decisions Made</h4>
                      <div className="space-y-3">
                        {summary.decisions.map((decision, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{decision}</p>
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

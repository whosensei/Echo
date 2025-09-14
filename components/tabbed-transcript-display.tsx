"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, MessageSquare } from "lucide-react"
import type { GladiaTranscriptionResult } from "@/lib/gladia-service"
import type { MeetingSummary } from "@/lib/gemini-service"

interface TabbedTranscriptDisplayProps {
  transcription: GladiaTranscriptionResult | null
  summary: MeetingSummary | null
  isLoading?: boolean
}

export function TabbedTranscriptDisplay({ transcription, summary, isLoading }: TabbedTranscriptDisplayProps) {
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
        <div className="p-4">
          <div className="flex justify-center gap-2">
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
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-8 p-6">
          {/* Transcript Section */}
          {transcription && (
            <section id="transcript" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <User className="h-6 w-6" />
                Transcript
              </h2>
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
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Summary
              </h2>

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
    </div>
  )
}

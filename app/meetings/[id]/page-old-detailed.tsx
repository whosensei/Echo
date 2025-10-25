"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TabbedTranscriptDisplay } from "@/components/tabbed-transcript-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { GladiaTranscriptionResult } from "@/lib/assemblyai-service";
import type { MeetingSummary } from "@/lib/gemini-service";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  audioFileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Transcript {
  id: string;
  content: string;
  language: string | null;
  speakerCount: number | null;
  duration: number | null;
  confidence: number | null;
  metadata: any;
  createdAt: string;
}

interface Summary {
  id: string;
  summary: string;
  actionPoints: any[] | null;
  keyTopics: any[] | null;
  participants: any[] | null;
  sentiment: string | null;
  metadata: any;
  createdAt: string;
}

interface MeetingDetails {
  meeting: Meeting;
  transcript: Transcript | null;
  summary: Summary | null;
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const meetingId = params.id as string;

  const [data, setData] = useState<MeetingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailType, setEmailType] = useState<"transcript" | "summary">("transcript");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meeting details");
      }
      const meetingData = await response.json();
      setData(meetingData);
    } catch (error) {
      toast({
        title: "Error loading meeting",
        description: error instanceof Error ? error.message : "Failed to load meeting details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete meeting");
      }

      toast({
        title: "Meeting deleted",
        description: "The meeting has been permanently deleted.",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete meeting",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) return;

    setIsSendingEmail(true);
    try {
      const recipients = emailRecipients.split(",").map((e) => e.trim()).filter((e) => e);
      const endpoint = emailType === "transcript" 
        ? "/api/gmail/send-transcript" 
        : "/api/gmail/send-summary";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          recipients,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send ${emailType}`);
      }

      toast({
        title: `${emailType === "transcript" ? "Transcript" : "Summary"} sent!`,
        description: `Email sent to ${recipients.length} recipient(s)`,
      });

      setShowEmailDialog(false);
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

  const handleExportPDF = (type: "transcript" | "summary") => {
    if (!data) return;

    try {
      const pdfData = {
        title: meeting.title,
        startTime: meeting.startTime,
        duration: formatDuration(transcript?.duration || null),
        speakerCount: transcript?.speakerCount || null,
        confidence: transcript?.confidence || null,
        content: transcript?.content || "",
        summary: summary?.summary,
        actionPoints: summary?.actionPoints || undefined,
        keyTopics: summary?.keyTopics || undefined,
        participants: summary?.participants || undefined,
        sentiment: summary?.sentiment || undefined,
      };

      const filename = exportMeetingToPDF(pdfData, type);

      toast({
        title: "PDF exported successfully",
        description: `Downloaded as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20 border";
      case "processing":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20 border";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20 border";
      case "pending":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20 border";
      default:
        return "bg-muted/10 text-muted-foreground border-border border";
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-slate-400" />
              <p className="mt-4 text-slate-600">Loading meeting details...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!data) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Meeting not found</h2>
              <p className="text-slate-600 mb-4">This meeting doesn't exist or you don't have access to it.</p>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const { meeting, transcript, summary } = data;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-3xl font-semibold text-foreground">{meeting.title}</h1>
              </div>
              <div className="flex items-center gap-2 ml-12">
                <Badge className={getStatusColor(meeting.status)}>
                  {meeting.status}
                </Badge>
                <span className="text-sm text-slate-500">
                  Created {formatDate(meeting.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this meeting, including its transcript and summary.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Meeting Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    Start Time
                  </div>
                  <p className="text-sm font-medium">{formatDate(meeting.startTime)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                  <p className="text-sm font-medium">
                    {transcript?.duration 
                      ? formatDuration(transcript.duration)
                      : transcript?.metadata?.audio_duration 
                        ? formatDuration(transcript.metadata.audio_duration)
                        : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    Speakers
                  </div>
                  <p className="text-sm font-medium">
                    {transcript?.speakerCount 
                      || transcript?.metadata?.number_of_distinct_speakers
                      || (transcript?.metadata?.speakers?.length)
                      || (transcript?.metadata?.utterances 
                          ? new Set(transcript.metadata.utterances.map((u: any) => u.speaker)).size
                          : "N/A")}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MessageSquare className="h-4 w-4" />
                    Language
                  </div>
                  <p className="text-sm font-medium">
                    {transcript?.language 
                      || transcript?.metadata?.language
                      || "N/A"}
                  </p>
                </div>
              </div>

              {meeting.description && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Description</p>
                    <p className="text-sm text-slate-600">{meeting.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Transcript and Summary */}
          <Tabs defaultValue="speakers" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
              <TabsTrigger value="speakers">Speakers</TabsTrigger>
              <TabsTrigger value="transcript">Raw Transcript</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="speakers" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Speaker Transcript</CardTitle>
                    <CardDescription>Conversation with speaker labels and timestamps</CardDescription>
                  </div>
                  {transcript && transcript.metadata && transcript.metadata.utterances && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailType("transcript");
                          setShowEmailDialog(true);
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send via Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF("transcript")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {transcript && transcript.metadata && transcript.metadata.utterances && transcript.metadata.utterances.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        // Group consecutive utterances by the same speaker
                        const utterances = transcript.metadata.utterances;
                        const groups: any[] = [];

                        utterances.forEach((utterance: any) => {
                          const lastGroup = groups[groups.length - 1];

                          if (lastGroup && lastGroup.speaker === utterance.speaker) {
                            // Merge with the previous group
                            lastGroup.text += " " + (utterance.transcription || utterance.text);
                            lastGroup.end = utterance.time_end;
                          } else {
                            // Create a new group
                            groups.push({
                              speaker: utterance.speaker,
                              text: utterance.transcription || utterance.text,
                              start: utterance.time_begin,
                              end: utterance.time_end,
                            });
                          }
                        });

                        const getSpeakerColor = (speaker: string): string => {
                          const colors = [
                            "bg-chart-3/10 text-chart-3",
                            "bg-primary/10 text-primary",
                            "bg-chart-1/10 text-chart-1",
                            "bg-chart-4/10 text-chart-4",
                            "bg-chart-2/10 text-chart-2",
                            "bg-chart-5/10 text-chart-5",
                          ];

                          let hash = 0;
                          for (let i = 0; i < speaker.length; i++) {
                            hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
                          }
                          return colors[Math.abs(hash) % colors.length];
                        };

                        const formatTime = (seconds: number): string => {
                          if (typeof seconds !== "number" || isNaN(seconds)) {
                            return "00:00";
                          }
                          const mins = Math.floor(seconds / 60);
                          const secs = Math.floor(seconds % 60);
                          return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                        };

                        return groups.map((segment, index) => (
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
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No speaker data available for this meeting</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Raw Transcript</CardTitle>
                    <CardDescription>Plain text transcription without speaker labels</CardDescription>
                  </div>
                  {transcript && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailType("transcript");
                          setShowEmailDialog(true);
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send via Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF("transcript")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {transcript ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {transcript.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No transcript available for this meeting</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>AI-generated meeting summary and action points</CardDescription>
                  </div>
                  {summary && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailType("summary");
                          setShowEmailDialog(true);
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send via Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF("summary")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {summary ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Overview</h3>
                        <p className="text-sm text-slate-700 leading-relaxed">{summary.summary}</p>
                      </div>

                      {summary.actionPoints && summary.actionPoints.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Action Points</h3>
                            <ul className="space-y-2">
                              {summary.actionPoints.map((point: any, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-primary-foreground text-xs font-bold">{index + 1}</span>
                                  </div>
                                  <p className="text-sm text-foreground/80">{typeof point === 'string' ? point : point.text || JSON.stringify(point)}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {summary.keyTopics && summary.keyTopics.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Key Topics</h3>
                            <div className="flex flex-wrap gap-2">
                              {summary.keyTopics.map((topic: any, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {typeof topic === 'string' ? topic : topic.name || JSON.stringify(topic)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {summary.participants && summary.participants.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Participants</h3>
                            <div className="flex flex-wrap gap-2">
                              {summary.participants.map((participant: any, index: number) => (
                                <Badge key={index} variant="outline">
                                  <Users className="h-3 w-3 mr-1" />
                                  {typeof participant === 'string' ? participant : participant.name || JSON.stringify(participant)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {summary.sentiment && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Sentiment</h3>
                            <Badge
                              className={
                                summary.sentiment === "positive"
                                  ? "bg-chart-1 text-primary-foreground"
                                  : summary.sentiment === "negative"
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {summary.sentiment}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No summary available for this meeting</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send {emailType === "transcript" ? "Transcript" : "Summary"} via Email</DialogTitle>
              <DialogDescription>
                Enter recipient email addresses separated by commas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-recipients">Recipients</Label>
                <Input
                  id="email-recipients"
                  placeholder="email1@example.com, email2@example.com"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={isSendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!emailRecipients.trim() || isSendingEmail}
              >
                {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

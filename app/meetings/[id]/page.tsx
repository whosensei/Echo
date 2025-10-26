"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TabbedTranscriptDisplay } from "@/components/tabbed-transcript-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Mail,
  Download,
  MessageSquare,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { TranscriptionResult } from "@/lib/assemblyai-service";
import type { MeetingSummary } from "@/lib/gemini-service";
import { exportMeetingToPDF } from "@/lib/pdf-export";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  recordedAt: string;
  status: string;
  audioFileUrl: string;
  createdAt: string;
  updatedAt: string;
  meetingId?: string | null;
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

interface RecordingDetails {
  recording: Recording;
  transcript: Transcript | null;
  summary: Summary | null;
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const meetingId = params.id as string;

  const [data, setData] = useState<RecordingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<MeetingSummary | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await fetch(`/api/recordings/${meetingId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch recording");
      }

      const recordingData = await response.json() as RecordingDetails;
      setData(recordingData);

      // Transform transcript data to match TranscriptionResult format
      if (recordingData.transcript) {
        const transformedTranscript: TranscriptionResult = {
          id: recordingData.transcript.id,
          request_id: recordingData.transcript.id,
          status: "done",
          result: {
            transcription: {
              full_transcript: recordingData.transcript.content,
              utterances: recordingData.transcript.metadata?.utterances || [],
            },
            speakers: recordingData.transcript.metadata?.speakers || [],
            // Preserve all AssemblyAI-specific fields
            summary: recordingData.transcript.metadata?.summary,
            iab_categories: recordingData.transcript.metadata?.iab_categories,
            named_entities: recordingData.transcript.metadata?.named_entities,
            sentiment_analysis: recordingData.transcript.metadata?.sentiment_analysis,
            chapters: recordingData.transcript.metadata?.chapters,
            metadata: {
              ...recordingData.transcript.metadata,
              audio_duration: recordingData.transcript.duration || 0,
              number_of_channels: 1,
              billing_time: recordingData.transcript.duration || 0,
              number_of_distinct_speakers: recordingData.transcript.metadata?.number_of_distinct_speakers || 0,
            },
          },
        };
        setTranscriptionResult(transformedTranscript);
      }

      // Transform summary data to match MeetingSummary format
      if (recordingData.summary) {
        const metadata = recordingData.summary.metadata || {};
        const transformedSummary: MeetingSummary = {
          title: metadata.title || recordingData.recording.title || "Recording Summary",
          overview: recordingData.summary.summary || "",
          keyPoints: metadata.keyPoints || recordingData.summary.keyTopics || [],
          actionItems: metadata.actionItems || recordingData.summary.actionPoints || [],
          decisions: metadata.decisions || [],
          participants: recordingData.summary.participants || [],
          topics: metadata.topics || [],
          duration: formatDuration(recordingData.transcript?.duration),
          sentiment: (recordingData.summary.sentiment as "positive" | "neutral" | "negative") || null,
        };
        setSummaryResult(transformedSummary);
      }
    } catch (error) {
      console.error("Error fetching recording:", error);
      toast({
        title: "Error loading recording",
        description: error instanceof Error ? error.message : "Failed to load recording details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recordings/${meetingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recording");
      }

      toast({
        title: "Recording deleted",
        description: "The recording has been permanently deleted.",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete recording",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) {
      toast({
        title: "Email required",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    if (!data) return;

    setIsSendingEmail(true);
    try {
      const recipientList = emailRecipients
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);

      // Generate PDF data
      const pdfData = {
        title: data.recording.title,
        startTime: data.recording.recordedAt,
        duration: formatDuration(data.transcript?.duration || null),
        speakerCount: data.transcript?.speakerCount || null,
        confidence: data.transcript?.confidence || null,
        content: data.transcript?.content || "",
        summary: data.summary?.summary,
        actionPoints: data.summary?.actionPoints || undefined,
        keyTopics: data.summary?.keyTopics || undefined,
        participants: data.summary?.participants || undefined,
        sentiment: data.summary?.sentiment || undefined,
      };

      // Generate PDF as base64
      const pdfBase64 = exportMeetingToPDF(pdfData, "full", true);
      const filename = `${data.recording.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

      // Send email with PDF
      const response = await fetch("/api/gmail/send-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingId: meetingId,
          recipients: recipientList,
          subject: emailSubject || `Meeting Transcript: ${data.recording.title}`,
          message: emailMessage || `Please find attached the transcript and summary for: ${data.recording.title}`,
          pdfBase64,
          filename,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast({
        title: "Email sent!",
        description: `PDF sent to ${recipientList.length} recipient(s)`,
      });

      // Reset form and close dialog
      setEmailRecipients("");
      setEmailSubject("");
      setEmailMessage("");
      setIsEmailDialogOpen(false);
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

  const handleExportPDF = () => {
    if (!data) return;

    try {
      const pdfData = {
        title: data.recording.title,
        startTime: data.recording.recordedAt,
        duration: formatDuration(data.transcript?.duration || null),
        speakerCount: data.transcript?.speakerCount || null,
        confidence: data.transcript?.confidence || null,
        content: data.transcript?.content || "",
        summary: data.summary?.summary,
        actionPoints: data.summary?.actionPoints || undefined,
        keyTopics: data.summary?.keyTopics || undefined,
        participants: data.summary?.participants || undefined,
        sentiment: data.summary?.sentiment || undefined,
      };

      const filename = exportMeetingToPDF(pdfData, "full");

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

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading meeting details...</p>
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
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Meeting not found</h2>
              <p className="text-muted-foreground">This meeting doesn't exist or you don't have access to it.</p>
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

  const { recording } = data;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{recording.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(recording.recordedAt || recording.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(recording.status)}>
                {recording.status}
              </Badge>
              
              {/* Chat with Transcript Button */}
              <Button
                variant="default"
                size="sm"
                disabled={!transcriptionResult}
                onClick={() => router.push(`/chat?recordingId=${recording.id}`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat with Transcript
              </Button>
              
              {/* Action Buttons */}
              <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!transcriptionResult}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send via Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Send Meeting PDF via Email</DialogTitle>
                    <DialogDescription>
                      Send the meeting transcript and summary as a PDF attachment
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="recipients">
                        Recipients <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="recipients"
                        placeholder="email@example.com, another@example.com"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        disabled={isSendingEmail}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple emails with commas
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject (Optional)</Label>
                      <Input
                        id="subject"
                        placeholder={`Meeting Transcript: ${recording.title}`}
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        disabled={isSendingEmail}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Add a custom message to include in the email..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        disabled={isSendingEmail}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEmailDialogOpen(false)}
                      disabled={isSendingEmail}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={!transcriptionResult && !summaryResult}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this meeting? This action cannot be undone and will
                      permanently delete the meeting, transcript, and summary.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Tabbed Transcript Display - Same as /record */}
          <div className="min-h-[600px]">
            <TabbedTranscriptDisplay
              transcription={transcriptionResult}
              summary={summaryResult}
              isLoading={false}
              isSidebarCollapsed={true}
              meetingId={meetingId}
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

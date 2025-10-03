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
  Mail,
  Download,
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
import type { GladiaTranscriptionResult } from "@/lib/gladia-service";
import type { MeetingSummary } from "@/lib/gemini-service";
import { exportMeetingToPDF } from "@/lib/pdf-export";

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
  const [transcriptionResult, setTranscriptionResult] = useState<GladiaTranscriptionResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<MeetingSummary | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch meeting");
      }

      const meetingData = await response.json() as MeetingDetails;
      setData(meetingData);

      // Transform transcript data to match GladiaTranscriptionResult format
      if (meetingData.transcript) {
        const transformedTranscript: GladiaTranscriptionResult = {
          id: meetingData.transcript.id,
          request_id: meetingData.transcript.id,
          status: "done",
          result: {
            transcription: {
              full_transcript: meetingData.transcript.content,
              utterances: meetingData.transcript.metadata?.utterances || [],
            },
            speakers: meetingData.transcript.metadata?.speakers || [],
            metadata: {
              ...meetingData.transcript.metadata,
              audio_duration: meetingData.transcript.duration || 0,
              number_of_channels: 1,
              billing_time: meetingData.transcript.duration || 0,
            },
          },
        };
        setTranscriptionResult(transformedTranscript);
      }

      // Transform summary data to match MeetingSummary format
      if (meetingData.summary) {
        const metadata = meetingData.summary.metadata || {};
        const transformedSummary: MeetingSummary = {
          title: metadata.title || meetingData.meeting.title || "Meeting Summary",
          overview: meetingData.summary.summary || "",
          keyPoints: metadata.keyPoints || meetingData.summary.keyTopics || [],
          actionItems: metadata.actionItems || meetingData.summary.actionPoints || [],
          decisions: metadata.decisions || [],
          participants: meetingData.summary.participants || [],
          topics: metadata.topics || [],
          duration: formatDuration(meetingData.transcript?.duration),
          sentiment: (meetingData.summary.sentiment as "positive" | "neutral" | "negative") || null,
        };
        setSummaryResult(transformedSummary);
      }
    } catch (error) {
      console.error("Error fetching meeting:", error);
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
    const recipients = prompt("Enter recipient email addresses (comma-separated):");
    if (!recipients) return;

    setIsSendingEmail(true);
    try {
      const recipientList = recipients.split(",").map((e) => e.trim()).filter((e) => e);
      
      const response = await fetch("/api/gmail/send-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          recipients: recipientList,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast({
        title: "Email sent!",
        description: `Transcript sent to ${recipientList.length} recipient(s)`,
      });
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
        title: data.meeting.title,
        startTime: data.meeting.startTime,
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

  const { meeting } = data;

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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{meeting.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(meeting.createdAt).toLocaleDateString("en-US", {
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
              <Badge className={getStatusColor(meeting.status)}>
                {meeting.status}
              </Badge>
              
              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !transcriptionResult}
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send via Email
              </Button>
              
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

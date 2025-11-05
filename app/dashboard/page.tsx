"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Mail, 
  Mic, 
  Plus, 
  TrendingUp, 
  RefreshCw, 
  Loader2,
  ArrowUpRight,
  Zap,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toaster";

interface Recording {
  id: string;
  title: string;
  recordedAt: string;
  status: string;
  createdAt: string;
  meetingId?: string | null;
}

interface Meeting {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  calendarEventId?: string | null;
}

// Matches shape returned by /api/calendar/sync (from getUpcomingMeetings)
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: any[];
  location?: string;
  conferenceData?: any;
  hangoutLink?: string;
  htmlLink?: string;
  status?: string;
}

interface DashboardStats {
  totalMeetings: number;
  thisWeekMeetings: number;
  emailsSent: number;
  upcomingEvents: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalMeetings: 0,
    thisWeekMeetings: 0,
    emailsSent: 0,
    upcomingEvents: 0,
  });
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [upcomingCalendar, setUpcomingCalendar] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Auto-sync calendar meetings in the background when dashboard loads
    autoSyncCalendarMeetings();
  }, []);

  const autoSyncCalendarMeetings = async () => {
    try {
      // Silently sync new calendar meetings in the background
      const response = await fetch("/api/calendar/auto-sync", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.count > 0) {
          console.log(`[Dashboard] Auto-synced ${data.count} new meeting(s) to database`);
        }
      } else if (response.status === 401) {
        // Calendar not connected - this is fine, just log it
        console.log("[Dashboard] Google Calendar not connected, skipping auto-sync");
      }
    } catch (error) {
      // Fail silently for background auto-sync
      console.error("[Dashboard] Auto-sync failed:", error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all recordings from database for stats
      const recordingsRes = await fetch("/api/recordings?limit=1000");
      if (recordingsRes.ok) {
        const recordingsData = await recordingsRes.json();
        const allRecordings = recordingsData.recordings || [];
        
        // Set recent recordings (limit to 5)
        setRecentRecordings(allRecordings.slice(0, 5));
        
        // Calculate stats based on recordings
        const total = allRecordings.length;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = allRecordings.filter((r: Recording) => 
          new Date(r.createdAt) > weekAgo
        ).length;
        
        setStats(prev => ({ ...prev, totalMeetings: total, thisWeekMeetings: thisWeek }));
      }

      // Fetch upcoming calendar events DIRECTLY from Google Calendar (not from database)
      // This keeps calendar events completely separate from recordings
      const calendarRes = await fetch("/api/calendar/sync");
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        const calendarEvents: CalendarEvent[] = calendarData.meetings || [];
        // Debug log to verify structure
        console.log("[Dashboard] Calendar events received (GET):", calendarEvents.map(e => ({ id: e.id, summary: e.summary, start: e.start })));
        setUpcomingCalendar(calendarEvents);
        setStats(prev => ({ ...prev, upcomingEvents: calendarEvents.length }));
      } else if (calendarRes.status === 401) {
        // Calendar not connected - this is OK, just skip it
        console.log("Google Calendar not connected");
        setUpcomingCalendar([]);
        setStats(prev => ({ ...prev, upcomingEvents: 0 }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      });

      if (response.status === 401) {
        const data = await response.json();
        toast({
          title: "Google Calendar not connected",
          description: data.error || "Please connect your Google account in Settings.",
          variant: "destructive",
        });
        setIsSyncing(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to sync calendar");
      }

      const data = await response.json();
      
      toast({
        title: "Calendar synced!",
        description: `${data.count || 0} calendar events synced to the database.`,
      });

      // IMPORTANT: Only refresh calendar events, NOT recordings
      // This prevents calendar sync from messing up the recordings list
      const calendarRes = await fetch("/api/calendar/sync");
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        const calendarEvents: CalendarEvent[] = calendarData.meetings || [];
        console.log("[Dashboard] Calendar events received (POST refresh):", calendarEvents.map(e => ({ id: e.id, summary: e.summary, start: e.start })));
        setUpcomingCalendar(calendarEvents);
        setStats(prev => ({ ...prev, upcomingEvents: calendarEvents.length }));
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync calendar",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateInput: string | { dateTime?: string; date?: string }) => {
    const dateString = typeof dateInput === 'string'
      ? dateInput
      : (dateInput.dateTime || dateInput.date || "");
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "processing":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      case "pending":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 pb-8">
          {/* Page header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-8">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    <h1 className="text-4xl font-medium tracking-tight text-foreground">Dashboard</h1>
                  </div>
                  <p className="text-muted-foreground text-lg max-w-2xl">
                    Welcome back! Your AI-powered meeting insights at a glance.
                  </p>
                </div>
                <Link href="/record">
                  <Button size="lg" className="shadow-lg">
                    <Plus className="mr-2 h-5 w-5" />
                    New Recording
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Recordings
                </CardTitle>
                <Mic className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {isLoading ? <Skeleton className="h-9 w-16" /> : stats.totalMeetings}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  All time audio recordings
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {isLoading ? <Skeleton className="h-9 w-16" /> : stats.thisWeekMeetings}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Recordings this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Emails Sent
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {isLoading ? <Skeleton className="h-9 w-16" /> : stats.emailsSent}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Transcripts & summaries
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {isLoading ? <Skeleton className="h-9 w-16" /> : stats.upcomingEvents}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Calendar events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity and upcoming meetings */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Upcoming Calendar Events */}
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    Upcoming Events
                  </CardTitle>
                  <CardDescription className="mt-1.5 text-xs">
                    Your next 5 meetings from Google Calendar
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncCalendar}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <Skeleton className="h-4 w-4 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingCalendar.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Calendar className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium">No upcoming meetings</p>
                        <p className="text-xs text-muted-foreground mt-1">Your calendar is clear for now</p>
                      </div>
                    </div>
                  ) : (
                    upcomingCalendar.map((event) => {
                      const when = formatDate(event.start)
                      return (
                        <div key={event.id} className="rounded-xl border border-border/50 p-3.5 hover:bg-accent/50 hover:border-primary/20 transition-all group">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground mb-1 line-clamp-1">
                                {event.summary}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {when}
                                </span>
                                {(event.hangoutLink || event.conferenceData) && (
                                  <Badge variant="secondary" className="text-[10px] h-5 px-2">
                                    ONLINE
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Recordings */}
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  Recent Recordings
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs">
                  Your latest audio recordings with transcripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <Skeleton className="h-4 w-4 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentRecordings.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Mic className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium">No recordings yet</p>
                        <Link href="/record">
                          <Button variant="link" className="mt-2 text-primary">
                            Create your first recording →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    recentRecordings.map((recording) => {
                      const when = recording.recordedAt ? formatDate(recording.recordedAt) : ''
                      return (
                        <Link key={recording.id} href={`/meetings/${recording.id}`} className="block">
                          <div className="rounded-xl border border-border/50 p-3.5 hover:bg-accent/50 hover:border-primary/20 transition-all group cursor-pointer">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Mic className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                  {recording.title}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {when}
                                  </span>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-[10px] h-5 px-2 ${getStatusStyles(recording.status)}`}
                                  >
                                    {recording.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

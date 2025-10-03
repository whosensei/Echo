"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FileText, Mail, Mic, Plus, TrendingUp, RefreshCw, Loader2, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toaster";

interface Meeting {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees?: any[];
  location?: string;
  conferenceData?: any;
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
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [upcomingCalendar, setUpcomingCalendar] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch recent meetings for display (limited to 5)
      const recentMeetingsRes = await fetch("/api/meetings?limit=5");
      if (recentMeetingsRes.ok) {
        const recentMeetingsData = await recentMeetingsRes.json();
        setRecentMeetings(recentMeetingsData.meetings || []);
      }

      // Fetch all meetings for accurate stats
      const allMeetingsRes = await fetch("/api/meetings?limit=100");
      if (allMeetingsRes.ok) {
        const allMeetingsData = await allMeetingsRes.json();
        const allMeetings = allMeetingsData.meetings || [];
        
        // Calculate stats
        const total = allMeetings.length;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = allMeetings.filter((m: Meeting) => 
          new Date(m.createdAt) > weekAgo
        ).length;
        
        setStats(prev => ({ ...prev, totalMeetings: total, thisWeekMeetings: thisWeek }));
      }

      // Fetch upcoming calendar events
      const calendarRes = await fetch("/api/calendar/sync");
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        setUpcomingCalendar(calendarData.meetings || []);
        setStats(prev => ({ ...prev, upcomingEvents: calendarData.meetings?.length || 0 }));
      } else if (calendarRes.status === 401) {
        // Calendar not connected - this is OK, just skip it
        console.log("Google Calendar not connected");
        setUpcomingCalendar([]);
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

      toast({
        title: "Calendar synced!",
        description: "Your meetings have been synced to the database.",
      });

      // Refresh data
      await fetchDashboardData();
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

  const formatDate = (dateString: string) => {
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
        <div className="space-y-8">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-slate-600 mt-1">
                Welcome back! Here's an overview of your meetings.
              </p>
            </div>
            <Link href="/record">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Recording
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Meetings
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalMeetings}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time recordings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  This Week
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.thisWeekMeetings}
                </div>
                <p className="text-xs text-muted-foreground">
                  Meetings recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Emails Sent
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.emailsSent}
                </div>
                <p className="text-xs text-muted-foreground">
                  Transcripts & summaries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats.upcomingEvents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Calendar events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity and upcoming meetings */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Meetings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Meetings</CardTitle>
                  <CardDescription>
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
                <div className="space-y-4">
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
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm">No upcoming meetings</p>
                        <Link href="/settings">
                          <Button variant="link" className="mt-2">
                            Connect Google Calendar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    upcomingCalendar.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                        <div className="mt-0.5">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {event.summary}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {formatDate(event.start)}
                            </p>
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {event.attendees.length} attendees
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Recordings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Recordings</CardTitle>
                <CardDescription>
                  Your latest meeting transcripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                  ) : recentMeetings.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <Mic className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm">No recordings yet</p>
                        <Link href="/">
                          <Button variant="link" className="mt-2">
                            Create your first recording
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    recentMeetings.map((meeting) => (
                      <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                        <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                          <div className="mt-0.5">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {meeting.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusStyles(meeting.status)}`}>
                                {meeting.status}
                              </span>
                              {meeting.startTime && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(meeting.startTime)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/record">
                  <Button variant="outline" className="w-full h-auto py-6 flex-col">
                    <Mic className="h-8 w-8 mb-2" />
                    <span>Record Meeting</span>
                  </Button>
                </Link>
                <Link href="/calendar">
                  <Button variant="outline" className="w-full h-auto py-6 flex-col">
                    <Calendar className="h-8 w-8 mb-2" />
                    <span>Sync Calendar</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full h-auto py-6 flex-col">
                    <Mail className="h-8 w-8 mb-2" />
                    <span>Email Settings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

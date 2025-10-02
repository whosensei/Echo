"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      // Fetch meetings
      const meetingsRes = await fetch("/api/meetings?limit=5");
      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setRecentMeetings(meetingsData.meetings || []);
        
        // Calculate stats
        const total = meetingsData.meetings?.length || 0;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = meetingsData.meetings?.filter((m: Meeting) => 
          new Date(m.createdAt) > weekAgo
        ).length || 0;
        
        setStats(prev => ({ ...prev, totalMeetings: total, thisWeekMeetings: thisWeek }));
      }

      // Fetch upcoming calendar events
      const calendarRes = await fetch("/api/calendar/sync");
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        setUpcomingCalendar(calendarData.meetings || []);
        setStats(prev => ({ ...prev, upcomingEvents: calendarData.meetings?.length || 0 }));
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
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
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalMeetings}
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
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.thisWeekMeetings}
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
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.emailsSent}
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
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.upcomingEvents}
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
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  ) : upcomingCalendar.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-slate-500">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-2 text-slate-400" />
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
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="mt-0.5">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {event.summary}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <p className="text-xs text-slate-500">
                              {formatDate(event.start)}
                            </p>
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-500">
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
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  ) : recentMeetings.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-slate-500">
                      <div className="text-center">
                        <Mic className="h-12 w-12 mx-auto mb-2 text-slate-400" />
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
                        <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="mt-0.5">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {meeting.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {meeting.status}
                              </Badge>
                              {meeting.startTime && (
                                <p className="text-xs text-slate-500">
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

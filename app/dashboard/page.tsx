"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Plus, TrendingUp, RefreshCw, Clock, Mail, Users } from "lucide-react";
import Link from "next/link";
import { useMeetings, useCalendarSync } from "@/hooks/use-queries";
import { DashboardSkeleton } from "@/components/ui/loading-skeletons";
import { useMemo } from "react";

export default function DashboardPage() {
  const { data: meetings, isLoading: isLoadingMeetings, error: meetingsError } = useMeetings(5);
  const { data: calendarEvents, isLoading: isLoadingCalendar, refetch: refetchCalendar, isFetching: isSyncing } = useCalendarSync();

  // Calculate stats from meetings data
  const stats = useMemo(() => {
    if (!meetings) return {
      totalMeetings: 0,
      thisWeekMeetings: 0,
      upcomingEvents: calendarEvents?.length || 0,
    };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = meetings.filter(m => new Date(m.createdAt) > weekAgo).length;

    return {
      totalMeetings: meetings.length,
      thisWeekMeetings: thisWeek,
      upcomingEvents: calendarEvents?.length || 0,
    };
  }, [meetings, calendarEvents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoadingMeetings && isLoadingCalendar) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <DashboardSkeleton />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
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
                <div className="text-2xl font-bold">{stats.totalMeetings}</div>
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
                <div className="text-2xl font-bold">{stats.thisWeekMeetings}</div>
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Transcripts shared
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">
                  From your calendar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Meetings and Upcoming Calendar */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Meetings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Meetings</CardTitle>
                  <Link href="/meetings">
                    <Button variant="ghost" size="sm">
                      View all
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Your latest recorded meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meetingsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Failed to load meetings
                    </p>
                  </div>
                ) : !meetings || meetings.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No meetings yet
                    </p>
                    <Link href="/record">
                      <Button className="mt-4" size="sm">
                        Record your first meeting
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meetings.map((meeting) => (
                      <Link
                        key={meeting.id}
                        href={`/meetings/${meeting.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {meeting.title || "Untitled Meeting"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(meeting.createdAt)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Calendar Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Meetings</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchCalendar()}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <CardDescription>
                  From your Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!calendarEvents || calendarEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No upcoming events
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connect your calendar in Settings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {calendarEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <p className="text-sm font-medium leading-none">
                          {event.summary}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(event.start.dateTime)}
                          </span>
                          {event.attendees && event.attendees.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.attendees.length} attendees
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

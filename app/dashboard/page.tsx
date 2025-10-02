"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Mail, Mic, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
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
                <div className="text-2xl font-bold">0</div>
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
                <div className="text-2xl font-bold">0</div>
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
                <div className="text-2xl font-bold">0</div>
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
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>
                  Your next 5 meetings from Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                  <div className="flex items-center justify-center py-8 text-slate-500">
                    <div className="text-center">
                      <Mic className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">No recordings yet</p>
                      <Link href="/record">
                        <Button variant="link" className="mt-2">
                          Create your first recording
                        </Button>
                      </Link>
                    </div>
                  </div>
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

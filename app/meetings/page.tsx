"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { Search, Filter, Calendar, FileText, Loader2, Plus } from "lucide-react";
import Link from "next/link";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  createdAt: string;
}

export default function MeetingsPage() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    filterAndSortMeetings();
  }, [meetings, searchQuery, statusFilter, sortBy]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/meetings?limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      toast({
        title: "Error loading meetings",
        description: error instanceof Error ? error.message : "Failed to load meetings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortMeetings = () => {
    let filtered = [...meetings];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (meeting.description && meeting.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((meeting) => meeting.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredMeetings(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-chart-1";
      case "processing":
        return "bg-chart-4";
      case "failed":
        return "bg-destructive";
      case "pending":
        return "bg-primary";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">All Meetings</h1>
              <p className="text-slate-600 mt-1">
                View and manage all your meeting recordings
              </p>
            </div>
            <Link href="/">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Recording
              </Button>
            </Link>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search meetings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredMeetings.length} of {meetings.length} meetings
              </div>
            </CardContent>
          </Card>

          {/* Meetings List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-slate-400" />
                    <p className="mt-4 text-slate-600">Loading meetings...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredMeetings.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-slate-400 mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchQuery || statusFilter !== "all" ? "No meetings found" : "No meetings yet"}
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {searchQuery || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Start by recording your first meeting"}
                    </p>
                    {!searchQuery && statusFilter === "all" && (
                      <Link href="/">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Recording
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMeetings.map((meeting) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {meeting.title}
                            </h3>
                            <Badge className={getStatusColor(meeting.status)}>
                              {meeting.status}
                            </Badge>
                          </div>

                          {meeting.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                              {meeting.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {meeting.startTime
                                  ? formatDate(meeting.startTime)
                                  : `Created ${formatDate(meeting.createdAt)}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

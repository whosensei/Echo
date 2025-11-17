"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { Search, Calendar, Loader2, Plus, Mic, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  recordedAt: string;
  status: string;
  createdAt: string;
  audioFileUrl: string;
  meetingId?: string | null;
}

export default function MeetingsPage() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    filterAndSortRecordings();
  }, [recordings, searchQuery, statusFilter, sortBy]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recordings?limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch recordings");
      }
      const data = await response.json();
      setRecordings(data.recordings || []);
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

  const filterAndSortRecordings = () => {
    let filtered = [...recordings];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (recording) =>
          recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (recording.description && recording.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((recording) => recording.status === statusFilter);
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

    setFilteredRecordings(filtered);
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-4 sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-foreground tracking-tight">All Recordings</h1>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl">
                    Your meeting archive. Search, filter, and access transcriptions instantly.
                  </p>
                </div>
                <Link href="/record" className="w-full sm:w-auto">
                  <Button className="shadow-lg !h-12 px-6 w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    New Recording
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                placeholder="Search recordings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base bg-card border-border/50"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 !h-11 sm:!h-12 bg-card border-border/50 text-sm sm:text-base">
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
          <div className="flex items-center gap-2 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredRecordings.length}</span> of{" "}
              <span className="font-medium text-foreground">{recordings.length}</span> recordings
            </span>
          </div>

          {/* Recordings Grid */}
          <div className="grid gap-4">
            {isLoading ? (
              <Card className="border-border/50">
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading recordings...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredRecordings.length === 0 ? (
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4 max-w-md">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
                      <Mic className="relative h-16 w-16 mx-auto text-muted-foreground/50" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-foreground">
                        {searchQuery || statusFilter !== "all" ? "No recordings found" : "No recordings yet"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Start capturing and transcribing your meetings with AI"}
                      </p>
                    </div>
                    {!searchQuery && statusFilter === "all" && (
                      <Link href="/record">
                        <Button size="lg" className="mt-4">
                          <Plus className="mr-2 h-5 w-5" />
                          Create Recording
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRecordings.map((recording) => (
                <Link key={recording.id} href={`/meetings/${recording.id}`}>
                  <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                          {/* Title and Status */}
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="mt-1 p-1.5 sm:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                              <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {recording.title}
                              </h3>
                              <Badge className={`${getStatusColor(recording.status)} mt-1 text-xs`}>
                                {recording.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Description */}
                          {recording.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 ml-8 sm:ml-12">
                              {recording.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground ml-8 sm:ml-12">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>
                                {recording.recordedAt
                                  ? formatDate(recording.recordedAt)
                                  : formatDate(recording.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>{formatDate(recording.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
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

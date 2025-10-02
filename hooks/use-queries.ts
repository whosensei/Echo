import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  hasTranscription: boolean;
  hasSummary: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: Array<{ email: string }>;
}

interface AnalyticsData {
  overview: {
    totalMeetings: number;
    avgTranscriptionDuration: number;
    totalTranscriptions: number;
    avgConfidence: number;
  };
  meetingsByStatus: Array<{ status: string; count: number }>;
  meetingsOverTime: Array<{ date: string; count: number }>;
  recentActivity: Array<Meeting>;
  sentimentDistribution: Array<{ sentiment: string; count: number }>;
}

// Query Keys
export const queryKeys = {
  meetings: {
    all: ["meetings"] as const,
    list: (limit?: number) => ["meetings", "list", limit] as const,
    detail: (id: string) => ["meetings", "detail", id] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    sync: () => ["calendar", "sync"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    byPeriod: (period: string) => ["analytics", period] as const,
  },
};

// Meetings Hooks
export function useMeetings(limit = 100) {
  return useQuery({
    queryKey: queryKeys.meetings.list(limit),
    queryFn: async () => {
      const response = await fetch(`/api/meetings?limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }
      return response.json() as Promise<Meeting[]>;
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: queryKeys.meetings.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/meetings/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meeting");
      }
      return response.json() as Promise<Meeting>;
    },
    enabled: !!id,
  });
}

// Calendar Hooks
export function useCalendarSync() {
  return useQuery({
    queryKey: queryKeys.calendar.sync(),
    queryFn: async () => {
      const response = await fetch("/api/calendar/sync");
      if (!response.ok) {
        throw new Error("Failed to sync calendar");
      }
      return response.json() as Promise<CalendarEvent[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Analytics Hooks
export function useAnalytics(period = "30") {
  return useQuery({
    queryKey: queryKeys.analytics.byPeriod(period),
    queryFn: async () => {
      const response = await fetch(`/api/analytics?period=${period}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json() as Promise<AnalyticsData>;
    },
  });
}

// Mutation Hooks
export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meeting: Partial<Meeting>) => {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meeting),
      });
      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Meeting> & { id: string }) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update meeting");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meetings.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete meeting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

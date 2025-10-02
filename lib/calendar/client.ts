import { google } from "googleapis";
import { db } from "../db";
import { account, meeting } from "../db/schema";
import { eq } from "drizzle-orm";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string; // needsAction, accepted, declined, tentative
    organizer?: boolean;
    self?: boolean;
    optional?: boolean;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  creator?: {
    email: string;
    displayName?: string;
  };
  location?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: {
      name?: string; // Google Meet, Zoom, etc.
    };
    entryPoints?: Array<{
      entryPointType?: string; // video, phone
      uri?: string;
      label?: string;
    }>;
  };
  hangoutLink?: string;
  htmlLink?: string;
  status?: string; // confirmed, tentative, cancelled
  visibility?: string; // default, public, private
  created?: string;
  updated?: string;
  recurringEventId?: string;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method?: string;
      minutes?: number;
    }>;
  };
}

/**
 * Get Google Calendar client for a user
 */
export async function getCalendarClient(userId: string) {
  // Get user's Google OAuth tokens from the database
  const userAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))
    .limit(1);

  if (!userAccount.length || !userAccount[0].accessToken) {
    throw new Error("Google account not connected or no access token found");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: userAccount[0].accessToken,
    refresh_token: userAccount[0].refreshToken,
    expiry_date: userAccount[0].accessTokenExpiresAt?.getTime(),
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      await db
        .update(account)
        .set({
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          accessTokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        })
        .where(eq(account.userId, userId));
    } else if (tokens.access_token) {
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          accessTokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        })
        .where(eq(account.userId, userId));
    }
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return calendar;
}

/**
 * Get upcoming meetings from Google Calendar
 */
export async function getUpcomingMeetings(
  userId: string,
  maxResults: number = 5
): Promise<CalendarEvent[]> {
  try {
    const calendar = await getCalendarClient(userId);

    const now = new Date();
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    return events.map((event) => ({
      id: event.id!,
      summary: event.summary || "No Title",
      description: event.description || undefined,
      start: {
        dateTime: event.start?.dateTime || undefined,
        date: event.start?.date || undefined,
        timeZone: event.start?.timeZone || undefined,
      },
      end: {
        dateTime: event.end?.dateTime || undefined,
        date: event.end?.date || undefined,
        timeZone: event.end?.timeZone || undefined,
      },
      attendees: event.attendees?.map((attendee) => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus || undefined,
        organizer: attendee.organizer || undefined,
        self: attendee.self || undefined,
        optional: attendee.optional || undefined,
      })),
      organizer: event.organizer
        ? {
            email: event.organizer.email || "",
            displayName: event.organizer.displayName || undefined,
            self: event.organizer.self || undefined,
          }
        : undefined,
      creator: event.creator
        ? {
            email: event.creator.email || "",
            displayName: event.creator.displayName || undefined,
          }
        : undefined,
      location: event.location || undefined,
      conferenceData: event.conferenceData
        ? {
            conferenceId: event.conferenceData.conferenceId || undefined,
            conferenceSolution: event.conferenceData.conferenceSolution
              ? {
                  name: event.conferenceData.conferenceSolution.name || undefined,
                }
              : undefined,
            entryPoints: event.conferenceData.entryPoints?.map((ep) => ({
              entryPointType: ep.entryPointType || undefined,
              uri: ep.uri || undefined,
              label: ep.label || undefined,
            })),
          }
        : undefined,
      hangoutLink: event.hangoutLink || undefined,
      htmlLink: event.htmlLink || undefined,
      status: event.status || undefined,
      visibility: event.visibility || undefined,
      created: event.created || undefined,
      updated: event.updated || undefined,
      recurringEventId: event.recurringEventId || undefined,
      reminders: event.reminders
        ? {
            useDefault: event.reminders.useDefault || undefined,
            overrides: event.reminders.overrides?.map((reminder) => ({
              method: reminder.method || undefined,
              minutes: reminder.minutes || undefined,
            })),
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching upcoming meetings:", error);
    throw error;
  }
}

/**
 * Get a specific meeting by Calendar Event ID
 */
export async function getMeetingById(
  userId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  try {
    const calendar = await getCalendarClient(userId);

    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    const event = response.data;

    return {
      id: event.id!,
      summary: event.summary || "No Title",
      description: event.description || undefined,
      start: {
        dateTime: event.start?.dateTime || undefined,
        date: event.start?.date || undefined,
        timeZone: event.start?.timeZone || undefined,
      },
      end: {
        dateTime: event.end?.dateTime || undefined,
        date: event.end?.date || undefined,
        timeZone: event.end?.timeZone || undefined,
      },
      attendees: event.attendees?.map((attendee) => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus || undefined,
        organizer: attendee.organizer || undefined,
        self: attendee.self || undefined,
        optional: attendee.optional || undefined,
      })),
      organizer: event.organizer
        ? {
            email: event.organizer.email || "",
            displayName: event.organizer.displayName || undefined,
            self: event.organizer.self || undefined,
          }
        : undefined,
      creator: event.creator
        ? {
            email: event.creator.email || "",
            displayName: event.creator.displayName || undefined,
          }
        : undefined,
      location: event.location || undefined,
      conferenceData: event.conferenceData
        ? {
            conferenceId: event.conferenceData.conferenceId || undefined,
            conferenceSolution: event.conferenceData.conferenceSolution
              ? {
                  name: event.conferenceData.conferenceSolution.name || undefined,
                }
              : undefined,
            entryPoints: event.conferenceData.entryPoints?.map((ep) => ({
              entryPointType: ep.entryPointType || undefined,
              uri: ep.uri || undefined,
              label: ep.label || undefined,
            })),
          }
        : undefined,
      hangoutLink: event.hangoutLink || undefined,
      htmlLink: event.htmlLink || undefined,
      status: event.status || undefined,
      visibility: event.visibility || undefined,
      created: event.created || undefined,
      updated: event.updated || undefined,
      recurringEventId: event.recurringEventId || undefined,
      reminders: event.reminders
        ? {
            useDefault: event.reminders.useDefault || undefined,
            overrides: event.reminders.overrides?.map((reminder) => ({
              method: reminder.method || undefined,
              minutes: reminder.minutes || undefined,
            })),
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching meeting by ID:", error);
    return null;
  }
}

/**
 * Sync a calendar event to the database
 */
export async function syncMeetingToDatabase(
  userId: string,
  eventId: string
): Promise<string> {
  try {
    const event = await getMeetingById(userId, eventId);

    if (!event) {
      throw new Error("Calendar event not found");
    }

    // Check if meeting already exists
    const existingMeeting = await db
      .select()
      .from(meeting)
      .where(eq(meeting.calendarEventId, eventId))
      .limit(1);

    if (existingMeeting.length > 0) {
      // Update existing meeting
      await db
        .update(meeting)
        .set({
          title: event.summary,
          description: event.description,
          startTime: event.start.dateTime
            ? new Date(event.start.dateTime)
            : undefined,
          endTime: event.end.dateTime ? new Date(event.end.dateTime) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(meeting.id, existingMeeting[0].id));

      return existingMeeting[0].id;
    } else {
      // Create new meeting
      const newMeeting = await db
        .insert(meeting)
        .values({
          userId,
          title: event.summary,
          description: event.description,
          startTime: event.start.dateTime
            ? new Date(event.start.dateTime)
            : undefined,
          endTime: event.end.dateTime ? new Date(event.end.dateTime) : undefined,
          calendarEventId: eventId,
          status: "pending",
        })
        .returning();

      return newMeeting[0].id;
    }
  } catch (error) {
    console.error("Error syncing meeting to database:", error);
    throw error;
  }
}

/**
 * Sync all upcoming meetings to database
 */
export async function syncAllUpcomingMeetings(userId: string): Promise<number> {
  try {
    const events = await getUpcomingMeetings(userId, 10);
    let syncedCount = 0;

    for (const event of events) {
      try {
        await syncMeetingToDatabase(userId, event.id);
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing event ${event.id}:`, error);
      }
    }

    return syncedCount;
  } catch (error) {
    console.error("Error syncing all upcoming meetings:", error);
    throw error;
  }
}

/**
 * Check if user has Calendar connected
 */
export async function isCalendarConnected(userId: string): Promise<boolean> {
  const userAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))
    .limit(1);

  return userAccount.length > 0 && !!userAccount[0].accessToken;
}

/**
 * Extract formatted participant information from calendar event
 */
export function formatParticipants(event: CalendarEvent) {
  const participants = {
    organizer: event.organizer
      ? {
          email: event.organizer.email,
          name: event.organizer.displayName || event.organizer.email,
          isYou: event.organizer.self || false,
        }
      : null,
    attendees: event.attendees?.map((attendee) => ({
      email: attendee.email,
      name: attendee.displayName || attendee.email,
      status: attendee.responseStatus || "needsAction", // needsAction, accepted, declined, tentative
      isOrganizer: attendee.organizer || false,
      isYou: attendee.self || false,
      isOptional: attendee.optional || false,
    })) || [],
    total: (event.attendees?.length || 0) + 1, // +1 for organizer
  };

  // Separate by response status
  const accepted = participants.attendees.filter((a) => a.status === "accepted");
  const declined = participants.attendees.filter((a) => a.status === "declined");
  const tentative = participants.attendees.filter((a) => a.status === "tentative");
  const pending = participants.attendees.filter((a) => a.status === "needsAction");

  return {
    ...participants,
    summary: {
      accepted: accepted.length,
      declined: declined.length,
      tentative: tentative.length,
      pending: pending.length,
    },
  };
}

/**
 * Extract formatted timing information from calendar event
 */
export function formatMeetingTiming(event: CalendarEvent) {
  const startTime = event.start.dateTime
    ? new Date(event.start.dateTime)
    : event.start.date
    ? new Date(event.start.date)
    : null;

  const endTime = event.end.dateTime
    ? new Date(event.end.dateTime)
    : event.end.date
    ? new Date(event.end.date)
    : null;

  if (!startTime || !endTime) {
    return null;
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return {
    start: startTime,
    end: endTime,
    startISO: startTime.toISOString(),
    endISO: endTime.toISOString(),
    timeZone: event.start.timeZone || event.end.timeZone || "UTC",
    duration: {
      milliseconds: durationMs,
      minutes: durationMinutes,
      formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    },
    isAllDay: !!event.start.date && !event.start.dateTime,
    isPast: endTime < new Date(),
    isUpcoming: startTime > new Date(),
    isOngoing: startTime <= new Date() && endTime >= new Date(),
  };
}

/**
 * Get meeting details with formatted participants and timing
 */
export async function getMeetingDetails(userId: string, eventId: string) {
  const event = await getMeetingById(userId, eventId);

  if (!event) {
    return null;
  }

  return {
    event,
    participants: formatParticipants(event),
    timing: formatMeetingTiming(event),
    conferenceInfo: event.conferenceData
      ? {
          provider: event.conferenceData.conferenceSolution?.name || "Unknown",
          joinUrl:
            event.conferenceData.entryPoints?.find(
              (ep) => ep.entryPointType === "video"
            )?.uri ||
            event.hangoutLink ||
            null,
          phoneNumbers:
            event.conferenceData.entryPoints
              ?.filter((ep) => ep.entryPointType === "phone")
              .map((ep) => ({
                number: ep.label || ep.uri || "",
                uri: ep.uri || "",
              })) || [],
        }
      : null,
  };
}

/**
 * Get past meetings from Google Calendar
 */
export async function getPastMeetings(
  userId: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  try {
    const calendar = await getCalendarClient(userId);

    const now = new Date();
    const past30Days = new Date();
    past30Days.setDate(past30Days.getDate() - 30);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: past30Days.toISOString(),
      timeMax: now.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    return events.map((event) => ({
      id: event.id!,
      summary: event.summary || "No Title",
      description: event.description || undefined,
      start: {
        dateTime: event.start?.dateTime || undefined,
        date: event.start?.date || undefined,
      },
      end: {
        dateTime: event.end?.dateTime || undefined,
        date: event.end?.date || undefined,
      },
      attendees: event.attendees?.map((attendee) => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
      })),
      hangoutLink: event.hangoutLink || undefined,
      htmlLink: event.htmlLink || undefined,
    }));
  } catch (error) {
    console.error("Error fetching past meetings:", error);
    throw error;
  }
}

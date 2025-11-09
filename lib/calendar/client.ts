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

  if (!userAccount.length) {
    throw new Error("Google account not connected. Please sign in with Google.");
  }

  const accountData = userAccount[0];

  if (!accountData.refreshToken) {
    throw new Error("No refresh token available. Please reconnect your Google account in Settings.");
  }

  let accessToken = accountData.accessToken;
  let expiresAt = accountData.accessTokenExpiresAt;

  // Check if token is expired or about to expire (5 min buffer)
  const isExpired = !accessToken || (expiresAt && new Date(expiresAt).getTime() < Date.now() + 5 * 60 * 1000);

  if (isExpired) {
    try {
      console.log("Access token expired or missing, refreshing...");
      
      // Refresh the access token
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: accountData.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Token refresh failed:", error);
        throw new Error("Failed to refresh access token. Please reconnect your Google account in Settings.");
      }

      const tokens = await response.json();
      
      // Update database with new token
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(account.id, accountData.id));

      // Use the new token
      accessToken = tokens.access_token;
      console.log("Access token refreshed successfully");
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Session expired. Please reconnect your Google account in Settings.");
    }
  }

  // Initialize OAuth2 client with valid token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: accountData.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return calendar;
}

/**
 * Get upcoming meetings from Google Calendar
 * Broader logic: include timed events that are not cancelled.
 * Keep attendee requirement optional: allow if any of these is true:
 *  - has attendees
 *  - has conferenceData / hangoutLink / location
 *  - organizer.self is true (user created it)
 * Still exclude all-day events (date-only) and cancelled events.
 * Adds console diagnostics to help debug empty lists.
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
      maxResults: maxResults * 5, // fetch more to allow filtering leniency
      singleEvents: true,
      orderBy: "startTime",
      // eventTypes param may not be supported in all accounts; remove to avoid empty results
      // If needed later, we can reintroduce conditionally.
    });

    const events = response.data.items || [];
    console.log("[Calendar] Raw events fetched:", events.length);

    let excludedAllDay = 0;
    let excludedCancelled = 0;
    let excludedNoSignal = 0; // no attendees + no location/conference + not self authored

    const meetings = events.filter((event) => {
      const isCancelled = event.status === "cancelled";
      if (isCancelled) {
        excludedCancelled++;
        return false;
      }

      const hasSpecificTime = !!event.start?.dateTime;
      if (!hasSpecificTime) {
        excludedAllDay++;
        return false;
      }

      const hasAttendees = (event.attendees?.length || 0) > 0;
      const hasConference = !!event.conferenceData || !!event.hangoutLink;
      const hasLocation = !!event.location;
      const isSelf = !!event.organizer?.self;

      const keep = hasAttendees || hasConference || hasLocation || isSelf;
      if (!keep) excludedNoSignal++;
      return keep;
    });

    console.log("[Calendar] After filtering - kept:", meetings.length, {
      excludedAllDay,
      excludedCancelled,
      excludedNoSignal,
    });

    const limited = meetings.slice(0, maxResults);
    console.log("[Calendar] Returning meetings:", limited.map(e => ({ id: e.id, summary: e.summary, when: e.start?.dateTime })));

    return limited.map((event) => ({
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
 * Only syncs actual meetings (with attendees), not personal events or all-day events
 */
export async function syncAllUpcomingMeetings(userId: string): Promise<number> {
  try {
    // Fetch more meetings to ensure we get enough after filtering
    const events = await getUpcomingMeetings(userId, 20);
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
 * Auto-sync upcoming meetings to database (only new ones)
 * This is optimized for background syncing without duplicating existing meetings
 */
export async function autoSyncNewMeetings(userId: string): Promise<number> {
  try {
    // Fetch upcoming meetings from Google Calendar
    const events = await getUpcomingMeetings(userId, 20);
    let syncedCount = 0;

    // Get all existing calendar event IDs from database
    const existingMeetings = await db
      .select({ calendarEventId: meeting.calendarEventId })
      .from(meeting)
      .where(eq(meeting.userId, userId));
    
    const existingEventIds = new Set(
      existingMeetings
        .map(m => m.calendarEventId)
        .filter((id): id is string => id !== null)
    );

    // Only sync events that are not already in the database
    for (const event of events) {
      try {
        if (!existingEventIds.has(event.id)) {
          await syncMeetingToDatabase(userId, event.id);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error auto-syncing event ${event.id}:`, error);
        // Continue with other events even if one fails
      }
    }

    return syncedCount;
  } catch (error) {
    console.error("Error auto-syncing new meetings:", error);
    // Don't throw - we want background sync to fail silently
    return 0;
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

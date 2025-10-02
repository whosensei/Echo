import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUpcomingMeetings, syncAllUpcomingMeetings } from "@/lib/calendar/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get upcoming meetings from Google Calendar
    const meetings = await getUpcomingMeetings(session.user.id, 5);

    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error("Error fetching calendar meetings:", error);
    
    // Handle specific OAuth errors
    if (error.message?.includes("refresh token") || error.message?.includes("not connected")) {
      return NextResponse.json(
        { error: "Google Calendar not connected. Please reconnect in Settings." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch calendar meetings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync all upcoming meetings to database
    const syncedCount = await syncAllUpcomingMeetings(session.user.id);

    return NextResponse.json({
      message: `Successfully synced ${syncedCount} meetings`,
      count: syncedCount,
    });
  } catch (error: any) {
    console.error("Error syncing calendar meetings:", error);
    
    // Handle specific OAuth errors
    if (error.message?.includes("refresh token") || error.message?.includes("not connected")) {
      return NextResponse.json(
        { error: "Google Calendar not connected. Please reconnect in Settings." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to sync calendar meetings" },
      { status: 500 }
    );
  }
}

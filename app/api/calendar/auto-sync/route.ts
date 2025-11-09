import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { autoSyncNewMeetings } from "@/lib/calendar/client";

/**
 * POST /api/calendar/auto-sync
 * Automatically syncs new calendar meetings to database (only ones not already stored)
 * Designed to run in the background when dashboard loads
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-sync only new meetings to database
    const syncedCount = await autoSyncNewMeetings(session.user.id);

    return NextResponse.json({
      message: `Successfully auto-synced ${syncedCount} new meeting(s)`,
      count: syncedCount,
      success: true,
    });
  } catch (error: any) {
    console.error("Error auto-syncing calendar meetings:", error);
    
    // Handle specific OAuth errors
    if (error.message?.includes("refresh token") || error.message?.includes("not connected")) {
      return NextResponse.json(
        { 
          error: "Google Calendar not connected",
          count: 0,
          success: false,
        },
        { status: 401 }
      );
    }
    
    // For auto-sync, we return success: false but still 200 status
    // This prevents error popups in the UI for background operations
    return NextResponse.json(
      { 
        error: "Failed to auto-sync calendar meetings",
        count: 0,
        success: false,
      },
      { status: 200 } // Still 200 to avoid error toasts
    );
  }
}

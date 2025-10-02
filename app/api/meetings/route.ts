import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { meeting } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/meetings - List all meetings for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch meetings for the user
    const meetings = await db
      .select()
      .from(meeting)
      .where(eq(meeting.userId, session.user.id))
      .orderBy(desc(meeting.startTime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      meetings,
      count: meetings.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

// POST /api/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      calendarEventId,
      audioFileUrl,
      status = "pending",
    } = body;

    // Validate required fields
    if (!title || !startTime) {
      return NextResponse.json(
        { error: "Title and start time are required" },
        { status: 400 }
      );
    }

    // Create the meeting
    const [newMeeting] = await db
      .insert(meeting)
      .values({
        userId: session.user.id,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        calendarEventId: calendarEventId || null,
        audioFileUrl: audioFileUrl || null,
        status,
      })
      .returning();

    return NextResponse.json(
      { meeting: newMeeting, message: "Meeting created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}

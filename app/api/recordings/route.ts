import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recording } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/recordings - List all recordings for the authenticated user
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
    const meetingId = searchParams.get("meetingId");

    // Fetch recordings for the user
    let recordings;
    
    if (meetingId) {
      recordings = await db
        .select()
        .from(recording)
        .where(
          eq(recording.userId, session.user.id) && eq(recording.meetingId, meetingId)
        )
        .orderBy(desc(recording.recordedAt))
        .limit(limit)
        .offset(offset);
    } else {
      recordings = await db
        .select()
        .from(recording)
        .where(eq(recording.userId, session.user.id))
        .orderBy(desc(recording.recordedAt))
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json({
      recordings,
      count: recordings.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { error: "Failed to fetch recordings" },
      { status: 500 }
    );
  }
}

// POST /api/recordings - Create a new recording
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
      audioFileUrl,
      meetingId,
      recordedAt,
      status = "pending",
    } = body;

    // Validate required fields
    if (!title || !audioFileUrl) {
      return NextResponse.json(
        { error: "Title and audio file URL are required" },
        { status: 400 }
      );
    }

    // Create the recording
    const [newRecording] = await db
      .insert(recording)
      .values({
        userId: session.user.id,
        title,
        description: description || null,
        audioFileUrl,
        meetingId: meetingId || null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        status,
      })
      .returning();

    return NextResponse.json(
      { recording: newRecording, message: "Recording created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating recording:", error);
    return NextResponse.json(
      { error: "Failed to create recording" },
      { status: 500 }
    );
  }
}

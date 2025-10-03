import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { meeting, recording, transcript, summary } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/meetings/[id] - Get a specific meeting with its recordings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meetingId = params.id;

    // Fetch the meeting
    const [meetingData] = await db
      .select()
      .from(meeting)
      .where(
        and(eq(meeting.id, meetingId), eq(meeting.userId, session.user.id))
      );

    if (!meetingData) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Fetch related recordings
    const recordings = await db
      .select()
      .from(recording)
      .where(eq(recording.meetingId, meetingId));

    // For each recording, fetch transcript and summary
    const recordingsWithDetails = await Promise.all(
      recordings.map(async (rec) => {
        const [transcriptData] = await db
          .select()
          .from(transcript)
          .where(eq(transcript.recordingId, rec.id));

        const [summaryData] = await db
          .select()
          .from(summary)
          .where(eq(summary.recordingId, rec.id));

        return {
          ...rec,
          transcript: transcriptData || null,
          summary: summaryData || null,
        };
      })
    );

    return NextResponse.json({
      meeting: meetingData,
      recordings: recordingsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

// PUT /api/meetings/[id] - Update a meeting
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meetingId = params.id;
    const body = await request.json();

    const {
      title,
      description,
      startTime,
      endTime,
      calendarEventId,
    } = body;

    // Verify the meeting belongs to the user
    const [existingMeeting] = await db
      .select()
      .from(meeting)
      .where(
        and(eq(meeting.id, meetingId), eq(meeting.userId, session.user.id))
      );

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Update the meeting
    const [updatedMeeting] = await db
      .update(meeting)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && {
          endTime: endTime ? new Date(endTime) : null,
        }),
        ...(calendarEventId !== undefined && { calendarEventId }),
        updatedAt: new Date(),
      })
      .where(eq(meeting.id, meetingId))
      .returning();

    return NextResponse.json({
      meeting: updatedMeeting,
      message: "Meeting updated successfully",
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/[id] - Delete a meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meetingId = params.id;

    // Verify the meeting belongs to the user
    const [existingMeeting] = await db
      .select()
      .from(meeting)
      .where(
        and(eq(meeting.id, meetingId), eq(meeting.userId, session.user.id))
      );

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Delete the meeting (recordings will have meetingId set to null due to "set null" cascade)
    await db.delete(meeting).where(eq(meeting.id, meetingId));

    return NextResponse.json({
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recording, transcript, summary } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/recordings/[id] - Get a specific recording with its transcript and summary
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

    const recordingId = params.id;

    // Fetch the recording
    const [recordingData] = await db
      .select()
      .from(recording)
      .where(
        and(eq(recording.id, recordingId), eq(recording.userId, session.user.id))
      );

    if (!recordingData) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Fetch related transcript
    const [transcriptData] = await db
      .select()
      .from(transcript)
      .where(eq(transcript.recordingId, recordingId));

    // Fetch related summary
    const [summaryData] = await db
      .select()
      .from(summary)
      .where(eq(summary.recordingId, recordingId));

    return NextResponse.json({
      recording: recordingData,
      transcript: transcriptData || null,
      summary: summaryData || null,
    });
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json(
      { error: "Failed to fetch recording" },
      { status: 500 }
    );
  }
}

// PUT /api/recordings/[id] - Update a recording
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

    const recordingId = params.id;
    const body = await request.json();

    const {
      title,
      description,
      audioFileUrl,
      meetingId,
      recordedAt,
      status,
    } = body;

    // Verify the recording belongs to the user
    const [existingRecording] = await db
      .select()
      .from(recording)
      .where(
        and(eq(recording.id, recordingId), eq(recording.userId, session.user.id))
      );

    if (!existingRecording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Update the recording
    const [updatedRecording] = await db
      .update(recording)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(audioFileUrl && { audioFileUrl }),
        ...(meetingId !== undefined && { meetingId }),
        ...(recordedAt && { recordedAt: new Date(recordedAt) }),
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(eq(recording.id, recordingId))
      .returning();

    return NextResponse.json({
      recording: updatedRecording,
      message: "Recording updated successfully",
    });
  } catch (error) {
    console.error("Error updating recording:", error);
    return NextResponse.json(
      { error: "Failed to update recording" },
      { status: 500 }
    );
  }
}

// DELETE /api/recordings/[id] - Delete a recording
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

    const recordingId = params.id;

    // Verify the recording belongs to the user
    const [existingRecording] = await db
      .select()
      .from(recording)
      .where(
        and(eq(recording.id, recordingId), eq(recording.userId, session.user.id))
      );

    if (!existingRecording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Delete the recording (cascades to transcript and summary)
    await db.delete(recording).where(eq(recording.id, recordingId));

    return NextResponse.json({
      message: "Recording deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json(
      { error: "Failed to delete recording" },
      { status: 500 }
    );
  }
}

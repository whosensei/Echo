import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTranscriptEmail } from "@/lib/gmail/client";
import { db } from "@/lib/db";
import { meeting, transcript } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// POST /api/gmail/send-transcript - Send transcript via email
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { meetingId, recipients } = body;

    if (!meetingId || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: "Meeting ID and recipients array are required" },
        { status: 400 }
      );
    }

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

    // Fetch the transcript
    const [transcriptData] = await db
      .select()
      .from(transcript)
      .where(eq(transcript.meetingId, meetingId));

    if (!transcriptData) {
      return NextResponse.json(
        { error: "Transcript not found for this meeting" },
        { status: 404 }
      );
    }

    // Send emails to all recipients
    const results = [];
    for (const recipient of recipients) {
      try {
        await sendTranscriptEmail(
          session.user.id,
          meetingId,
          recipient,
          meetingData.title,
          transcriptData.content
        );
        results.push({ recipient, status: "sent" });
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error);
        results.push({
          recipient,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "sent").length;

    return NextResponse.json({
      message: `Transcript email sent to ${successCount} of ${recipients.length} recipients`,
      results,
    });
  } catch (error) {
    console.error("Error sending transcript email:", error);
    return NextResponse.json(
      { error: "Failed to send transcript email" },
      { status: 500 }
    );
  }
}

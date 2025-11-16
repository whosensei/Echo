import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTranscriptEmail } from "@/lib/gmail/client";
import { db } from "@/lib/db";
import { recording, transcript } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { rateLimit, RATE_LIMITS, formatResetTime } from "@/lib/redis-rate-limit";

// POST /api/gmail/send-transcript - Send transcript via email
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting (100 email sends per 15 minutes per user)
    // This prevents abuse of the email sending feature
    const rateLimitResult = await rateLimit(
      `email:${session.user.id}`,
      RATE_LIMITS.API_DEFAULT
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many email requests. Please try again after ${formatResetTime(rateLimitResult.resetTime)}`,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.API_DEFAULT.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { recordingId, recipients } = body;

    if (!recordingId || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: "Recording ID and recipients array are required" },
        { status: 400 }
      );
    }

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

    // Fetch the transcript
    const [transcriptData] = await db
      .select()
      .from(transcript)
      .where(eq(transcript.recordingId, recordingId));

    if (!transcriptData) {
      return NextResponse.json(
        { error: "Transcript not found for this recording" },
        { status: 404 }
      );
    }

    // Send emails to all recipients
    const results = [];
    for (const recipient of recipients) {
      try {
        await sendTranscriptEmail(
          session.user.id,
          recordingId,
          recipient,
          recordingData.title,
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

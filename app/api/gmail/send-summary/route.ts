import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendSummaryEmail } from "@/lib/gmail/client";
import { db } from "@/lib/db";
import { recording, summary } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// POST /api/gmail/send-summary - Send summary via email
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Fetch the summary
    const [summaryData] = await db
      .select()
      .from(summary)
      .where(eq(summary.recordingId, recordingId));

    if (!summaryData) {
      return NextResponse.json(
        { error: "Summary not found for this recording" },
        { status: 404 }
      );
    }

    // Send emails to all recipients
    const results = [];
    for (const recipient of recipients) {
      try {
        await sendSummaryEmail(
          session.user.id,
          recordingId,
          recipient,
          recordingData.title,
          summaryData.summary,
          summaryData.actionPoints as any[] | undefined
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
      message: `Summary email sent to ${successCount} of ${recipients.length} recipients`,
      results,
    });
  } catch (error) {
    console.error("Error sending summary email:", error);
    return NextResponse.json(
      { error: "Failed to send summary email" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendPDFEmail } from "@/lib/gmail/client";
import { db } from "@/lib/db";
import { recording } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// POST /api/gmail/send-pdf - Send meeting PDF via email
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recordingId, recipients, subject, message, pdfBase64, filename } = body;

    if (!recordingId || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: "Recording ID and recipients array are required" },
        { status: 400 }
      );
    }

    if (!pdfBase64 || !filename) {
      return NextResponse.json(
        { error: "PDF base64 and filename are required" },
        { status: 400 }
      );
    }

    // Fetch the recording to verify ownership
    const [recordingData] = await db
      .select()
      .from(recording)
      .where(
        and(eq(recording.id, recordingId), eq(recording.userId, session.user.id))
      );

    if (!recordingData) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Send emails to all recipients
    const results = [];
    for (const recipient of recipients) {
      try {
        await sendPDFEmail(
          session.user.id,
          recordingId,
          recipient,
          subject || `Meeting Transcript: ${recordingData.title}`,
          message || `Please find attached the transcript and summary for: ${recordingData.title}`,
          pdfBase64,
          filename
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
      message: `PDF email sent to ${successCount} of ${recipients.length} recipients`,
      results,
    });
  } catch (error) {
    console.error("Error sending PDF email:", error);
    return NextResponse.json(
      { error: "Failed to send PDF email" },
      { status: 500 }
    );
  }
}

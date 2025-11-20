//For saving summaries to database.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { summary } from "@/lib/db/schema";
import { headers } from "next/headers";
import { safeEncryptChatContent } from '@/lib/chat-encryption';

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
      recordingId,
      summary: summaryText,
      actionPoints,
      keyTopics,
      participants,
      sentiment,
      metadata,
    } = body;

    if (!recordingId || !summaryText) {
      return NextResponse.json(
        { error: "Recording ID and summary are required" },
        { status: 400 }
      );
    }

    const encryptedSummary = safeEncryptChatContent(summaryText);
    if (!encryptedSummary) {
      return NextResponse.json(
        { error: "Failed to encrypt summary content" },
        { status: 500 }
      );
    }

    const [newSummary] = await db
      .insert(summary)
      .values({
        recordingId,
        summary: encryptedSummary,
        actionPoints: actionPoints || null,
        keyTopics: keyTopics || null,
        participants: participants || null,
        sentiment: sentiment || null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json(
      { summary: newSummary, message: "Summary created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating summary:", error);
    return NextResponse.json(
      { error: "Failed to create summary" },
      { status: 500 }
    );
  }
}

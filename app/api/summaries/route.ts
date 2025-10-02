import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { summary } from "@/lib/db/schema";
import { headers } from "next/headers";

// POST /api/summaries - Create a new summary
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
      meetingId,
      summary: summaryText,
      actionPoints,
      keyTopics,
      participants,
      sentiment,
      metadata,
    } = body;

    // Validate required fields
    if (!meetingId || !summaryText) {
      return NextResponse.json(
        { error: "Meeting ID and summary are required" },
        { status: 400 }
      );
    }

    // Create the summary
    const [newSummary] = await db
      .insert(summary)
      .values({
        meetingId,
        summary: summaryText,
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

/**
 * API Route: Transcriptions
 * Handles listing transcriptions from Gladia API and creating transcripts in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { GladiaService } from '@/lib/gladia-service';
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transcript } from "@/lib/db/schema";
import { headers } from "next/headers";

export async function GET() {
  try {
    // Initialize Gladia service
    const gladiaService = new GladiaService();

    // Get list of transcriptions
    const transcriptions = await gladiaService.listTranscriptions();
    
    return NextResponse.json({
      success: true,
      transcriptions,
    });

  } catch (error) {
    console.error('Error listing transcriptions:', error);
    return NextResponse.json(
      { error: `Failed to list transcriptions: ${error}` },
      { status: 500 }
    );
  }
}

// POST /api/transcriptions - Create a new transcript in database
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
      content,
      language,
      speakerCount,
      duration,
      confidence,
      metadata,
    } = body;

    // Validate required fields
    if (!recordingId || !content) {
      return NextResponse.json(
        { error: "Recording ID and content are required" },
        { status: 400 }
      );
    }

    // Create the transcript
    const [newTranscript] = await db
      .insert(transcript)
      .values({
        recordingId,
        content,
        language: language || null,
        speakerCount: speakerCount || null,
        duration: duration || null,
        confidence: confidence || null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json(
      { transcript: newTranscript, message: "Transcript created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating transcript:", error);
    return NextResponse.json(
      { error: "Failed to create transcript" },
      { status: 500 }
    );
  }
}

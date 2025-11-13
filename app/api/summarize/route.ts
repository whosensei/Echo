/**
 * API Route: Generate Summary
 * Handles meeting summary generation using OpenAI API
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAISummaryService } from '@/lib/openai-summary-service';

export async function POST(request: NextRequest) {
  try {
    const { transcript, rawTranscript, speakers, namedEntities, speakerMapping, meetingContext } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI service
    const openAIService = new OpenAISummaryService();

    // Generate meeting summary
    console.log('Generating meeting summary...');
    const summary = await openAIService.generateMeetingSummary({
      transcript,
      rawTranscript,
      speakers,
      namedEntities,
      speakerMapping,
      meetingContext,
    });

    return NextResponse.json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to generate summary: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Quick summary endpoint for real-time updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transcript = searchParams.get('transcript');

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI service
    const openAIService = new OpenAISummaryService();

    // Generate quick summary
    const quickSummary = await openAIService.generateQuickSummary(transcript);

    return NextResponse.json({
      success: true,
      quickSummary,
    });

  } catch (error) {
    console.error('Error generating quick summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to generate quick summary: ${errorMessage}` },
      { status: 500 }
    );
  }
}

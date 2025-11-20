//Handles meeting summary generation using OpenAI API
 
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

    const openAIService = new OpenAISummaryService();

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
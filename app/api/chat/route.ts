/**
 * Chat API Route - Handles AI chat with streaming responses
 * Supports multiple models and transcript context
 */

import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getModel } from '@/lib/ai-models';
import { db } from '@/lib/db';
import { chatMessage, chatAttachment, recording, transcript as transcriptTable, summary } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const maxDuration = 30; // Allow up to 30 seconds for streaming

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], sessionId, model = 'gemini-1.5-flash', attachedRecordingIds = [] } = body;

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build context from attached transcripts
    let contextMessage = '';
    
    if (attachedRecordingIds.length > 0) {
      try {
        // Fetch recordings with their transcripts and summaries
        const recordings = await db
          .select({
            recording: recording,
            transcript: transcriptTable,
            summary: summary,
          })
          .from(recording)
          .leftJoin(transcriptTable, eq(recording.id, transcriptTable.recordingId))
          .leftJoin(summary, eq(recording.id, summary.recordingId))
          .where(inArray(recording.id, attachedRecordingIds));

        if (recordings.length > 0) {
          contextMessage = buildContextFromRecordings(recordings);
        }
      } catch (error) {
        console.error('Error fetching attached recordings:', error);
        // Continue without context if there's an error
      }
    }

    // Prepare messages with context
    const allMessages = [];
    
    if (contextMessage) {
      allMessages.push({
        role: 'system' as const,
        content: contextMessage,
      });
    }

    // Add user messages - they're already in the correct format
    allMessages.push(...messages);

    // Get the model instance
    const modelInstance = getModel(model);

    // Stream the response
    const result = await streamText({
      model: modelInstance,
      messages: allMessages,
      temperature: 0.7,
      async onFinish({ text, finishReason, usage }) {
        // Save assistant message to database if sessionId is provided
        if (sessionId && text) {
          try {
            await db.insert(chatMessage).values({
              sessionId,
              role: 'assistant',
              content: text,
              metadata: {
                model,
                finishReason,
                usage,
              },
            });
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: errorMessage,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Build context message from attached recordings
 */
function buildContextFromRecordings(
  recordings: Array<{
    recording: any;
    transcript: any;
    summary: any;
  }>
): string {
  let context = `You are an AI assistant analyzing meeting transcripts. The user has attached the following meeting recordings for context:\n\n`;

  recordings.forEach((item, index) => {
    const { recording: rec, transcript: trans, summary: sum } = item;
    
    context += `--- Meeting ${index + 1}: ${rec.title} ---\n`;
    context += `Recorded: ${new Date(rec.recordedAt).toLocaleString()}\n`;
    
    if (rec.description) {
      context += `Description: ${rec.description}\n`;
    }
    
    if (sum) {
      context += `\nSummary:\n${sum.summary}\n`;
      
      if (sum.keyTopics && Array.isArray(sum.keyTopics)) {
        context += `\nKey Topics: ${sum.keyTopics.join(', ')}\n`;
      }
      
      if (sum.actionPoints && Array.isArray(sum.actionPoints)) {
        context += `\nAction Items:\n${sum.actionPoints.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}\n`;
      }
      
      if (sum.participants && Array.isArray(sum.participants)) {
        context += `\nParticipants: ${sum.participants.join(', ')}\n`;
      }
    }
    
    if (trans && trans.content) {
      context += `\nFull Transcript:\n${trans.content}\n`;
    }
    
    context += `\n`;
  });

  context += `\nPlease use the above meeting information to answer the user's questions accurately. Reference specific parts of the transcripts when relevant.\n`;
  
  return context;
}

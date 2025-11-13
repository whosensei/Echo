/**
 * Chat API Route - Handles AI chat with streaming responses
 * Supports multiple models and transcript context
 */

import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getModel } from '@/lib/ai-models';
import { db } from '@/lib/db';
import { chatMessage, chatAttachment, recording, transcript as transcriptTable, summary } from '@/lib/db/schema';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ingestChatTokens, checkTokenLimit } from '@/lib/billing/usage';

export const maxDuration = 30; // Allow up to 30 seconds for streaming

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user for usage checks
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { messages = [], sessionId, model = 'gemini-2.5-flash', attachedRecordingIds = [] } = body;

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

    // Estimate token usage for limit check (rough estimate: ~4 chars per token)
    // We'll do a more accurate check after getting the actual usage
    const estimatedTokens = Math.ceil(
      messages.reduce((acc: number, msg: any) => acc + (msg.content?.length || 0), 0) / 4
    ) + 1000; // Add buffer for response tokens
    const limitCheck = await checkTokenLimit(session.user.id, estimatedTokens);
    
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Token limit exceeded',
          message: `You have used ${limitCheck.used.toLocaleString()} of ${limitCheck.limit.toLocaleString()} AI tokens. Please upgrade your plan to continue.`,
          used: limitCheck.used,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build context from attached transcripts
    let contextMessage = '';
    
    if (attachedRecordingIds.length > 0) {
      try {
        // Fetch recordings with their transcripts and summaries using Drizzle's query API
        const recRows = await db.query.recording.findMany({
          where: (rec, { inArray }) => inArray(rec.id, attachedRecordingIds),
          with: {
            transcript: true,
            summary: true,
          },
        });

        // Normalize to existing shape expected by buildContextFromRecordings
        const recordings = recRows.map((rec) => ({
          recording: rec,
          transcript: rec.transcript,
          summary: rec.summary,
        }));

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

        // Ingest usage (tokens) for billing
        try {
          const userId = (session as any)?.user?.id;

          // Attempt to extract tokens from usage shapes
          let tokensUsed = 0;
          if (usage) {
            const u: any = usage as any;
            if (typeof u.totalTokens === 'number') {
              tokensUsed = u.totalTokens;
            } else {
              const inTok = Number(u.inputTokens ?? 0);
              const outTok = Number(u.outputTokens ?? 0);
              const total = Number(u.total ?? 0);
              tokensUsed = total || inTok + outTok || 0;
            }
          }

          if (userId && tokensUsed > 0) {
            await ingestChatTokens({
              userId,
              tokens: Math.max(0, Math.floor(tokensUsed)),
              sessionId,
              model,
            });
          }
        } catch (e) {
          console.warn('Failed to ingest chat tokens:', e);
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

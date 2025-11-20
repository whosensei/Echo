/**
 * Chat Sessions API - List and create chat sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSession, chatMessage, chatAttachment, recording, transcript, summary } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { config } from '@/config/env';
import { safeEncryptChatContent, decryptChatContent } from '@/lib/chat-encryption';

/**
 * GET /api/chat/sessions - List all sessions for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch sessions with message counts and attachments
    const sessions = await db
      .select({
        id: chatSession.id,
        title: chatSession.title,
        model: chatSession.model,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
      })
      .from(chatSession)
      .where(eq(chatSession.userId, userId))
      .orderBy(desc(chatSession.updatedAt));

    // Get message counts for each session and decrypt titles
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const messages = await db
          .select()
          .from(chatMessage)
          .where(eq(chatMessage.sessionId, session.id));

        const attachments = await db
          .select()
          .from(chatAttachment)
          .where(eq(chatAttachment.sessionId, session.id));

        return {
          ...session,
          title: decryptChatContent(session.title),
          messageCount: messages.length,
          attachmentCount: attachments.length,
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/sessions - Create a new chat session
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { title, model = config.app.defaultAiModel, attachedRecordingIds = [], systemPrompt } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Encrypt title and systemPrompt before saving
    const encryptedTitle = safeEncryptChatContent(title);
    const encryptedSystemPrompt = systemPrompt ? safeEncryptChatContent(systemPrompt) : null;

    if (!encryptedTitle) {
      return NextResponse.json(
        { error: 'Failed to encrypt session title' },
        { status: 500 }
      );
    }

    // Create new session
    const [newSession] = await db
      .insert(chatSession)
      .values({
        userId,
        title: encryptedTitle,
        model,
        systemPrompt: encryptedSystemPrompt,
      })
      .returning();

    // Attach recordings if provided
    if (attachedRecordingIds.length > 0) {
      await db.insert(chatAttachment).values(
        attachedRecordingIds.map((recordingId: string) => ({
          sessionId: newSession.id,
          recordingId,
        }))
      );
    }

    // Return attachments with details
    const attachments =
      attachedRecordingIds.length > 0
        ? await db
            .select({
              id: chatAttachment.id,
              recordingId: chatAttachment.recordingId,
              attachedAt: chatAttachment.attachedAt,
              recording,
              transcript,
              summary,
            })
            .from(chatAttachment)
            .leftJoin(recording, eq(chatAttachment.recordingId, recording.id))
            .leftJoin(transcript, eq(recording.id, transcript.recordingId))
            .leftJoin(summary, eq(recording.id, summary.recordingId))
            .where(eq(chatAttachment.sessionId, newSession.id))
        : [];

    // Decrypt session data before returning
    const decryptedNewSession = {
      ...newSession,
      title: decryptChatContent(newSession.title),
      systemPrompt: newSession.systemPrompt ? decryptChatContent(newSession.systemPrompt) : null,
    };

    return NextResponse.json({ session: decryptedNewSession, attachments });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

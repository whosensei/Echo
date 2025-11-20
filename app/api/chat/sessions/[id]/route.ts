import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSession, chatMessage, chatAttachment, recording, transcript, summary } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { safeEncryptChatContent, decryptChatContent } from '@/lib/chat-encryption';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionId = params.id;

    // Fetch session
    const [sessionData] = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.userId, userId)
        )
      );

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Decrypt session title and systemPrompt
    const decryptedSession = {
      ...sessionData,
      title: decryptChatContent(sessionData.title),
      systemPrompt: sessionData.systemPrompt ? decryptChatContent(sessionData.systemPrompt) : null,
    };

    // Fetch messages
    const messages = await db
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.sessionId, sessionId))
      .orderBy(chatMessage.createdAt);

    // Decrypt message content
    const decryptedMessages = messages.map((msg) => ({
      ...msg,
      content: decryptChatContent(msg.content),
    }));

    const attachments = await db
      .select({
        id: chatAttachment.id,
        recordingId: chatAttachment.recordingId,
        attachedAt: chatAttachment.attachedAt,
        recording: recording,
        transcript: transcript,
        summary: summary,
      })
      .from(chatAttachment)
      .leftJoin(recording, eq(chatAttachment.recordingId, recording.id))
      .leftJoin(transcript, eq(recording.id, transcript.recordingId))
      .leftJoin(summary, eq(recording.id, summary.recordingId))
      .where(eq(chatAttachment.sessionId, sessionId));

    const decryptedAttachments = attachments.map((attachment) => ({
      ...attachment,
      transcript: attachment.transcript ? {
        ...attachment.transcript,
        content: decryptChatContent(attachment.transcript.content),
      } : null,
      summary: attachment.summary ? {
        ...attachment.summary,
        summary: decryptChatContent(attachment.summary.summary),
      } : null,
    }));

    return NextResponse.json({
      session: decryptedSession,
      messages: decryptedMessages,
      attachments: decryptedAttachments,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/sessions/[id] - Update session (title, model)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionId = params.id;
    const body = await req.json();
    const { title, model, systemPrompt } = body;

    // Verify ownership
    const [existingSession] = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.userId, userId)
        )
      );

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session - encrypt title and systemPrompt if provided
    const updates: any = { updatedAt: new Date() };
    if (title) {
      const encryptedTitle = safeEncryptChatContent(title);
      if (encryptedTitle) {
        updates.title = encryptedTitle;
      }
    }
    if (model) updates.model = model;
    if (systemPrompt !== undefined) {
      const encryptedSystemPrompt = systemPrompt ? safeEncryptChatContent(systemPrompt) : null;
      updates.systemPrompt = encryptedSystemPrompt;
    }

    const [updatedSession] = await db
      .update(chatSession)
      .set(updates)
      .where(eq(chatSession.id, sessionId))
      .returning();

    // Decrypt session data before returning
    const decryptedUpdatedSession = {
      ...updatedSession,
      title: decryptChatContent(updatedSession.title),
      systemPrompt: updatedSession.systemPrompt ? decryptChatContent(updatedSession.systemPrompt) : null,
    };

    return NextResponse.json({ session: decryptedUpdatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/sessions/[id] - Delete session (cascades to messages and attachments)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionId = params.id;

    // Verify ownership before deleting
    const [existingSession] = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.userId, userId)
        )
      );

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session (cascades to messages and attachments)
    await db.delete(chatSession).where(eq(chatSession.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

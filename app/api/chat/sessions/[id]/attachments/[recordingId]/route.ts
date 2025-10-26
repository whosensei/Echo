/**
 * Chat Attachment API Route - Remove attachment from session
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatAttachment, chatSession } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; recordingId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id: sessionId, recordingId } = params;

    // Verify session belongs to user
    const chatSessions = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.userId, session.user.id)
        )
      )
      .limit(1);

    if (chatSessions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete attachment
    await db
      .delete(chatAttachment)
      .where(
        and(
          eq(chatAttachment.sessionId, sessionId),
          eq(chatAttachment.recordingId, recordingId)
        )
      );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete attachment API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

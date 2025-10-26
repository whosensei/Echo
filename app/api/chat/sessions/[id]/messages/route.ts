/**
 * Chat Messages API Route - Save individual messages to a session
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatMessage } from '@/lib/db/schema';
import { headers } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: sessionId } = params;
    const body = await req.json();
    const { role, content } = body;

    if (!role || !content) {
      return new Response(
        JSON.stringify({ error: 'Role and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save message
    const [message] = await db
      .insert(chatMessage)
      .values({
        sessionId,
        role,
        content,
      })
      .returning();

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chat message API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

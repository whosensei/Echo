import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import {
	chatSession,
	chatAttachment,
	recording,
	transcript,
	summary,
} from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { decryptChatContent } from '@/lib/chat-encryption';

export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { sessionId, recordingIds } = body as {
			sessionId?: string;
			recordingIds?: string[];
		};

		if (!sessionId || !Array.isArray(recordingIds) || recordingIds.length === 0) {
			return NextResponse.json(
				{ error: 'sessionId and recordingIds are required' },
				{ status: 400 }
			);
		}

		// Verify session belongs to user
		const [chatSessionRow] = await db
			.select({ id: chatSession.id })
			.from(chatSession)
			.where(
				and(
					eq(chatSession.id, sessionId),
					eq(chatSession.userId, session.user.id)
				)
			)
			.limit(1);

		if (!chatSessionRow) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		// Ensure recordings belong to the same user
		const validRecordings = await db
			.select({ id: recording.id })
			.from(recording)
			.where(
				and(
					eq(recording.userId, session.user.id),
					inArray(recording.id, recordingIds)
				)
			);

		const validRecordingIds = validRecordings.map((rec) => rec.id);

		if (validRecordingIds.length === 0) {
			return NextResponse.json(
				{ error: 'No valid recordings found to attach' },
				{ status: 400 }
			);
		}

		// Filter out already attached recordings
		const existingAttachments = await db
			.select({ recordingId: chatAttachment.recordingId })
			.from(chatAttachment)
			.where(
				and(
					eq(chatAttachment.sessionId, sessionId),
					inArray(chatAttachment.recordingId, validRecordingIds)
				)
			);

		const existingIds = new Set(existingAttachments.map((att) => att.recordingId));
		const newRecordingIds = validRecordingIds.filter((id) => !existingIds.has(id));

		if (newRecordingIds.length > 0) {
			await db.insert(chatAttachment).values(
				newRecordingIds.map((recordingId) => ({
					sessionId,
					recordingId,
				}))
			);
		}

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

		return NextResponse.json({ attachments: decryptedAttachments });
	} catch (error) {
		console.error('Attach transcripts API error:', error);
		return NextResponse.json(
			{ error: 'Failed to attach transcripts' },
			{ status: 500 }
		);
	}
}

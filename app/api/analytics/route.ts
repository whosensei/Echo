import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meeting, transcript, summary } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql, desc, count, avg } from "drizzle-orm";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const userId = session.user.id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get meetings stats
    const meetingsStats = await db
      .select({
        total: count(),
        avgDuration: avg(transcript.duration),
      })
      .from(meeting)
      .leftJoin(transcript, eq(meeting.id, transcript.meetingId))
      .where(eq(meeting.userId, userId));

    // Get meetings by status
    const meetingsByStatus = await db
      .select({
        status: meeting.status,
        count: count(),
      })
      .from(meeting)
      .where(eq(meeting.userId, userId))
      .groupBy(meeting.status);

    // Get meetings over time (grouped by day for last 30 days)
    const meetingsOverTime = await db
      .select({
        date: sql<string>`DATE(${meeting.createdAt})`,
        count: count(),
      })
      .from(meeting)
      .where(
        and(
          eq(meeting.userId, userId),
          gte(meeting.createdAt, startDate),
          lte(meeting.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${meeting.createdAt})`)
      .orderBy(sql`DATE(${meeting.createdAt}) ASC`);

    // Get transcription stats
    const transcriptionStats = await db
      .select({
        total: count(),
        avgDuration: avg(transcript.duration),
        avgConfidence: avg(transcript.confidence),
      })
      .from(transcript)
      .innerJoin(meeting, eq(transcript.meetingId, meeting.id))
      .where(eq(meeting.userId, userId));

    // Get recent activity (last 5 meetings with transcriptions/summaries)
    const recentActivity = await db
      .select({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        status: meeting.status,
        hasTranscription: sql<boolean>`${transcript.id} IS NOT NULL`,
        hasSummary: sql<boolean>`${summary.id} IS NOT NULL`,
      })
      .from(meeting)
      .leftJoin(transcript, eq(meeting.id, transcript.meetingId))
      .leftJoin(summary, eq(meeting.id, summary.meetingId))
      .where(eq(meeting.userId, userId))
      .orderBy(desc(meeting.createdAt))
      .limit(5);

    // Calculate sentiment distribution from summaries
    const sentimentStats = await db
      .select({
        sentiment: summary.sentiment,
        count: count(),
      })
      .from(summary)
      .innerJoin(meeting, eq(summary.meetingId, meeting.id))
      .where(eq(meeting.userId, userId))
      .groupBy(summary.sentiment);

    return NextResponse.json({
      overview: {
        totalMeetings: meetingsStats[0]?.total || 0,
        avgTranscriptionDuration: Math.round(
          Number(meetingsStats[0]?.avgDuration) || 0
        ),
        totalTranscriptions: transcriptionStats[0]?.total || 0,
        avgConfidence: Math.round(
          Number(transcriptionStats[0]?.avgConfidence) || 0
        ),
      },
      meetingsByStatus: meetingsByStatus.map((item) => ({
        status: item.status,
        count: item.count,
      })),
      meetingsOverTime: meetingsOverTime.map((row) => ({
        date: row.date,
        count: row.count,
      })),
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime,
        status: activity.status,
        hasTranscription: activity.hasTranscription,
        hasSummary: activity.hasSummary,
      })),
      sentimentDistribution: sentimentStats.map((item) => ({
        sentiment: item.sentiment || "Unknown",
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

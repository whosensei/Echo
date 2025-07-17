import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats, versions } from "@/lib/db/schema";
import { desc, eq, count, max } from "drizzle-orm";

export async function GET(req: NextRequest, {params}: {params: {userId: string}}) {
    try {
        const {userId} = params;

        // Get user chats with additional metadata
        const userChats = await db
            .select({
                chatID: chats.chatID,
                userID: chats.userID,
                title: chats.title,
                createdAt: chats.createdAt,
                versionCount: count(versions.versionID),
                latestVersionNum: max(versions.versionNum)
            })
            .from(chats)
            .leftJoin(versions, eq(chats.chatID, versions.chatID))
            .where(eq(chats.userID, userId))
            .groupBy(chats.chatID, chats.userID, chats.title, chats.createdAt)
            .orderBy(desc(chats.createdAt));

        return NextResponse.json({
            chats: userChats
        }, {status: 200});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}
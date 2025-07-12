import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats, versions} from "@/lib/db/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, userID, prompt ,settings} = body

        const createchat = await db.insert(chats).values({
            title,
            userID
        }).returning({chatID:chats.chatID})
        
        const chatID = createchat[0].chatID

        const createVersion = await db.insert(versions).values({
            chatID,
            versionNum: 1,
            prompt,
            settings
            }).returning({versionID:versions.versionID})

        return NextResponse.json({ message: "Chat created successfully" ,chatID: createchat[0].chatID, versionID: createVersion[0].versionID}, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
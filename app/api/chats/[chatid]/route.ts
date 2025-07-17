import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats, versions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest, {params}: {params: {chatid: string}}) {
    try {
        const {chatid} = await params;
        const chatID = parseInt(chatid);

        const chat = await db.select().from(chats).where(eq(chats.chatID, chatID));
        if (chat.length === 0) {
            return NextResponse.json({error: "Chat not found"}, {status: 404});
        }

        const chatVersions = await db.select().from(versions)
            .where(eq(versions.chatID, chatID))
            .orderBy(desc(versions.versionNum));

        return NextResponse.json({
            chat: chat[0],
            versions: chatVersions
        }, {status: 200});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}

export async function POST(req: NextRequest, {params}: {params: {chatid: string}}) {
    const body = await req.json()
    const{prompt ,settings} = body

    const {chatid} = await params

    const chat = await db.select().from(chats).where(eq(chats.chatID, parseInt(chatid)))
    if(!chat) return NextResponse.json({error: "Chat not found"}, {status: 404})
    
    const currentversionNum =  await db.select({versionNum:versions.versionNum}).from(versions).where(eq(versions.chatID,parseInt(chatid))).orderBy(desc(versions.versionNum)).limit(1);

    const currentVersion = currentversionNum[0].versionNum
    const nextVersionNum = currentVersion + 1;

    const nextversion  = await db.insert(versions).values({
        chatID: parseInt(chatid),
        versionNum: nextVersionNum,
        prompt,
        settings,
    }).returning({versionID : versions.versionID})

    const versionID = nextversion[0].versionID;

    return NextResponse.json({versionID}, {status: 200})
}
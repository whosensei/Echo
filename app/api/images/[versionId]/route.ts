import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req:NextRequest, {params}: {params: {versionId: string}}){
    try{
    const {versionId} = await params
    const versionID = parseInt(versionId)

    const generatedimages = await db.select().from(images).where(eq(images.versionID,versionID))

    if(generatedimages.length<1){
        return NextResponse.json({status : "generating",
            images: [],
        }, {status: 200})

    }

    return NextResponse.json({
        status : "completed",
            images : generatedimages,
        }, {status: 200})
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            status : "error",
            message : "Internal Server Error",
        }, {status: 500})
    }
}
import OpenAI from "openai";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { tmpdir } from "os";
const openai = new OpenAI();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const imgprompt = body.imgprompt;
        
        if (!imgprompt) {
            return NextResponse.json({ error: "Image prompt is required" }, { status: 400 });
        }

        const result = await openai.images.generate({
            model: "dall-e-3",
            prompt: imgprompt,
            response_format: "b64_json"
        });

        if (!result.data?.[0]?.b64_json) {
            console.error("Unexpected API response:", result);
            return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
        }

        const image_base64 = result.data[0].b64_json;
        const image_bytes = Buffer.from(image_base64, "base64");

        const tmpDir = "/Users/dipesh/echo/tmp";
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const filePath = `${tmpDir}/${timestamp}.png`;
        fs.writeFileSync(filePath, image_bytes);

        return NextResponse.json({
            message: "Image generated successfully",
            path: filePath
        }, { status: 200 });
    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json({ 
            error: "Failed to generate image",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

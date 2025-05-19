import OpenAI from "openai";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { tmpdir } from "os";
const openai = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imgprompt = body.imgprompt;
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imgprompt,
    });

    // @ts-ignore
    const image_base64 = result.data[0].b64_json as string;
    const image_bytes = Buffer.from(image_base64, "base64");

    const tmpDir = "/Users/dipesh/echo/tmp";
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filePath = `${tmpDir}/Date.now().png`;
    fs.writeFileSync(filePath, image_bytes);

    return NextResponse.json({
        message:"Image generated successfully"
    },{status:200})
  } catch (e) {
    return NextResponse.json(
      {
        message: "Failed to generate the image",e,
      },
      { status: 500 }
    );
  }
}

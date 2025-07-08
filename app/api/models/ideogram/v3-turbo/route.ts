import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { inputSchema } from "@/lib/schema/types";

const replicate = new Replicate();

type Aspectratio =
  | "9:16"
  | "16:9"
  | "3:4"
  | "4:3"
  | "1:1";
type MagicPrompt = "Auto" | "On" | "Off";
type Styletype = "None" | "Auto" | "General" | "Realistic" | "Design";
// type StyleReferenceImages 

interface InputType {
  prompt: string;
  aspect_ratio?: Aspectratio;
  magic_prompt_option?: MagicPrompt;
  style_type?: Styletype;
//   style_reference_images: Array[{items}]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }
    const input: InputType = parsed.data;
    
    const output = await replicate.run("ideogram-ai/ideogram-v3-turbo", {
      input,
    });

    const imageUri = (output as string[])[0];
    const response = await fetch(imageUri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();

    // For Next.js API routes, we should return the image directly instead of saving to disk
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="ideogram-${Date.now()}.png"`
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

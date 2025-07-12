import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { db } from "@/lib/db";
import { predictions } from "@/lib/db/schema";
const replicate = new Replicate();

export async function POST(req:NextRequest){

    const body = await req.json();
    const {versionID} = body;

    const input = {
    prompt: "The photo: Create a cinematic, photorealistic medium shot capturing the nostalgic warmth of a late 90s indie film. The focus is a young woman with brightly dyed pink-gold hair and freckled skin, looking directly and intently into the camera lens with a hopeful yet slightly uncertain smile, she is slightly off-center. She wears an oversized, vintage band t-shirt that says \"Replicate\" (slightly worn) over a long-sleeved striped top and simple silver stud earrings. The lighting is soft, golden hour sunlight streaming through a slightly dusty window, creating lens flare and illuminating dust motes in the air. The background shows a blurred, cluttered bedroom with posters on the wall and fairy lights, rendered with a shallow depth of field. Natural film grain, a warm, slightly muted color palette, and sharp focus on her expressive eyes enhance the intimate, authentic feel",
    aspect_ratio: "16:9",
    safety_filter_level: "block_medium_and_above"
    };
    
    const baseUrl = process.env.WEBHOOK_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    const webhookUrl = `${baseUrl}/api/webhooks/replicate?versionID=${versionID}&model=google/imagen-4`;
    
    const prediction = await replicate.predictions.create({
        model: "google/imagen-4",
        input,
        webhook: webhookUrl,
        webhook_events_filter: ["start","completed"], 
      });

      // Create prediction record in database
      await db.insert(predictions).values({
        versionID: parseInt(versionID),
        replicateID: prediction.id,
        status: prediction.status || 'starting',
        model: 'google/imagen-4',
      });

      return NextResponse.json({prediction}, {status: 200})
}

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const client = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, socialmedia } = body;
    const response = await client.responses.create({
      model: "gpt-4.1",
      instructions: `You are a seasoned ${socialmedia} marketing expert. Your task is to create an ad campaign post to effectively promote a product based on a user-provided prompt and an image(if it is given).
      Carefully analyze the image and the textual prompt to extract key product features, benefits, and emotional or aspirational hooks relevant to the target audience on ${socialmedia}.
      Focus on:
      - A trendy, scroll-stopping opening line (1st line is most important)
      - A clear value proposition or benefit of the product
      - A strong call-to-action (CTA) appropriate for ${socialmedia}
      - Use emojis, hashtags, and line breaks naturally if the platform encourages it
      - Make the tone engaging, brand-aligned, and audience-relevant
      
      Rules:
      - DO NOT include any system messages, headers, or explanations — just the 5 post variations
      - Each variation should be concise and unique, not minor rephrases
      - Assume the image content is relevant to the product (use visual cues creatively)
      - Align with current trends or viral formats

      Output: 5 distinct, platform-optimized post variations tailored to ${socialmedia}`,
      input: prompt,
    });

    return NextResponse.json(
      {
        message: response.output_text,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: e,
      },
      { status: 500 }
    );
  }
}

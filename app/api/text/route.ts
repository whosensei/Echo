import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const client = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const response = await client.responses.create({
      model: "gpt-4.1",
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

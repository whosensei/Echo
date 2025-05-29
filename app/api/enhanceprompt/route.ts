import OpenAI from "openai";
import { NextRequest } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    const enhancement_instructions = `You are a prompt engineering expert. Your task is to improve the effectiveness of a given user prompt by analyzing and enhancing it in the following ways:

    - Understand Context: Carefully read the original prompt and extract the user's intent, domain (e.g., marketing, education, code generation), target audience, and any implicit assumptions.
    
    - Fill in Gaps: If the original prompt lacks detail (e.g., goal, format, tone, examples), add these intelligently based on common best practices or inferred context.
    
    - Reformat Clearly: Structure the improved prompt in a clean, readable, and modular way using sections or bullet points. Ensure it guides the model step-by-step toward the expected outcome.
    
    - Improve Language and Design:
        - Rephrase vague or ambiguous parts
        - Use precise and action-oriented instructions
        - Align the tone with the purpose (e.g., conversational for chatbots, formal for reports)
    
    - Ensure Model Alignment: Make sure the final prompt is easily understandable by the model, avoids generalities, and includes all necessary constraints or examples to ensure quality output.
    
    Output only the improved version of the prompt. Do not include or reference the original user prompt. Do not explain your changes.`;

    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: enhancement_instructions },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response('Failed to enhance prompt', { status: 500 });
  }
}
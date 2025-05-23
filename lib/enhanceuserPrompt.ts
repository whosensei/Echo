import OpenAI from "openai"
const client  = new OpenAI();

export default async function enhanceuserPrompt(userprompt:string){

    const enhancement_instructions = `You are a prompt engineering expert. Your task is to improve the effectiveness of a given user prompt by analyzing and enhancing it in the following ways:

    - Understand Context: Carefully read the original prompt and extract the user's intent, domain (e.g., marketing, education, code generation), target audience, and any implicit assumptions.

    - Fill in Gaps: If the original prompt lacks detail (e.g., goal, format, tone, examples), add these intelligently based on common best practices or inferred context.

    - Reformat Clearly: Structure the improved prompt in a clean, readable, and modular way using sections or bullet points. Ensure it guides the model step-by-step toward the expected outcome.

    - Improve Language and Design:
        - Rephrase vague or ambiguous parts
        - Use precise and action-oriented instructions
        - Align the tone with the purpose (e.g., conversational for chatbots, formal for reports)

    - Ensure Model Alignment: Make sure the final prompt is easily understandable by the model, avoids generalities, and includes all necessary constraints or examples to ensure quality output.

    Output only the improved version of the prompt. Do not include or reference the original user prompt. Do not explain your changes.`

    const responses = await client.responses.create({
        model: "gpt-4.1",
        instructions:enhancement_instructions,
        input:userprompt
    });
    console.log(responses)
}
import { NextRequest } from "next/server";
import Replicate from "replicate";
const replicate = new Replicate();

export async function POST(req:NextRequest){

    const body = await req.json();

    const input = {
    prompt: "The photo: Create a cinematic, photorealistic medium shot capturing the nostalgic warmth of a late 90s indie film. The focus is a young woman with brightly dyed pink-gold hair and freckled skin, looking directly and intently into the camera lens with a hopeful yet slightly uncertain smile, she is slightly off-center. She wears an oversized, vintage band t-shirt that says \"Replicate\" (slightly worn) over a long-sleeved striped top and simple silver stud earrings. The lighting is soft, golden hour sunlight streaming through a slightly dusty window, creating lens flare and illuminating dust motes in the air. The background shows a blurred, cluttered bedroom with posters on the wall and fairy lights, rendered with a shallow depth of field. Natural film grain, a warm, slightly muted color palette, and sharp focus on her expressive eyes enhance the intimate, authentic feel",
    aspect_ratio: "16:9",
    safety_filter_level: "block_medium_and_above"
    };
    
    const output = await replicate.run("google/imagen-4", { input });
    // await writeFile("output.png", output);
}
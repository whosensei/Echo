import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { prompt, input_img, output_format,aspect_ratio } = body;

  const input = {
    prompt: prompt,
    input_image: input_img,
    aspect_ratio:aspect_ratio,
    output_format: output_format,
  };

  const output = await replicate.run("black-forest-labs/flux-kontext-pro", {
    input,
  });

  //   await writeFile("output.jpg", output);
  //=> output.jpg written to disk
}

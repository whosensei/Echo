import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    input_img,
    number_of_images,
    background,
    randomise_images,
    output_format,
  } = body;

  const input = {
    input_image: input_img,
    num_images: number_of_images,
    background: background,
    randomize_images: randomise_images,
    output_format: output_format,
  };

  const output = await replicate.run("flux-kontext-apps/portrait-series", {
    input,
  });
  for (const [index, item] of Object.entries(output)) {
    await writeFile(`output_${index}.png`, item);
  }
  //=> output_0.png, output_1.png, output_2.png, output_3.png, o...
}

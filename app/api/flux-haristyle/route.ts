import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    input_img,
    gender,
    haircut,
    hair_color,
    aspect_ratio,
    output_format,
  } = body;

  const input = {
    input_image: input_img,
    haircut: haircut,
    hair_color: hair_color,
    gender: gender,
    aspect_ratio: aspect_ratio,
    output_format: output_format,
  };

  const output = await replicate.run("flux-kontext-apps/change-haircut", {
    input,
  });
//   await writeFile("output.png", output);
  //=> output.png written to disk
}

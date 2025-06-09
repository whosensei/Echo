import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { gender, input_img, aspect_ratio, background, output_format } = body;

  const input = {
    input_image: input_img,
    gender: gender,
    background: background,
    aspect_ratio: aspect_ratio,
    output_format: output_format,
  };

  const output = await replicate.run(
    "flux-kontext-apps/professional-headshot",
    { input }
  );
  // await writeFile("output.png", output);
  //=> output.png written to disk
}

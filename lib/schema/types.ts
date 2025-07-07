import {z} from "zod"

export const inputSchema = z.object({
    prompt: z.string(),
    aspect_ratio: z
      .enum([
        "9:16",
        "16:9",
        "3:4",
        "4:3",
        "1:1",
      ])
      .optional(),
    magic_prompt_option: z.enum(["Auto", "On", "Off"]).optional(),
    style_type: z
      .enum(["None", "Auto", "General", "Realistic", "Design"])
      .optional(),
  });

// Image Library Types
export interface ImageData {
  id: string;
  url: string;
  aspectRatio: number; // width/height ratio
  title?: string;
  description?: string;
  tags?: string[];
  createdAt?: Date;
  userId?: string;
}

export interface ImageLibraryConfig {
  imagesPerLoad: number;
  gridMinWidth: number;
  enableInfiniteScroll: boolean;
  showImageInfo: boolean;
}
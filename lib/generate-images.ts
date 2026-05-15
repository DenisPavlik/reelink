import OpenAI from "openai";
import { put } from "@vercel/blob";
import { FriendlyError } from "./errors";
import type { Scene, ImageScene } from "./schemas";

const STYLE_PREFIX =
  "Cinematic vertical 9:16 composition, soft volumetric lighting, shallow depth of field, rich color grade, photoreal. No text, no faces, no logos. ";

const IMAGE_SIZE = "1024x1536" as const;
const IMAGE_QUALITY = "medium" as const;

export type GeneratedImages = {
  scenes: ImageScene[];
  jobId: string;
};

export async function generateImages(
  scenes: Scene[],
  jobId: string,
): Promise<GeneratedImages> {
  const client = new OpenAI();

  try {
    const enriched = await Promise.all(
      scenes.map(async (scene, idx) => {
        const result = await client.images.generate({
          model: "gpt-image-1",
          prompt: STYLE_PREFIX + scene.imagePrompt,
          size: IMAGE_SIZE,
          quality: IMAGE_QUALITY,
          n: 1,
        });
        const b64 = result.data?.[0]?.b64_json;
        if (!b64) throw new Error("Image API returned no b64_json payload.");
        const buffer = Buffer.from(b64, "base64");
        const { url } = await put(`images/${jobId}/${idx}.png`, buffer, {
          access: "public",
          contentType: "image/png",
        });
        return { ...scene, imageUrl: url } satisfies ImageScene;
      }),
    );
    return { scenes: enriched, jobId };
  } catch (cause) {
    throw new FriendlyError("Image generation failed — try again.", cause);
  }
}

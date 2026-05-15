import OpenAI from "openai";
import { put } from "@vercel/blob";
import mp3Duration from "mp3-duration";
import { FriendlyError } from "./errors";
import type { ImageScene, AudioScene } from "./schemas";

const SCENE_GAP_MS = 250;

export type SynthesizedAudio = {
  scenes: AudioScene[];
  totalDurationMs: number;
  jobId: string;
};

export async function synthesizeAudio(
  scenes: ImageScene[],
  jobId: string = crypto.randomUUID(),
): Promise<SynthesizedAudio> {
  const client = new OpenAI();

  let synthesized: {
    audioUrl: string;
    durationMs: number;
    text: string;
    imageUrl: string;
  }[];
  try {
    synthesized = await Promise.all(
      scenes.map(async (scene, idx) => {
        const speech = await client.audio.speech.create({
          model: "tts-1-hd",
          voice: "nova",
          input: scene.text,
          response_format: "mp3",
        });
        const buffer = Buffer.from(await speech.arrayBuffer());
        const durationSeconds = await mp3DurationAsync(buffer);
        const { url } = await put(
          `audio/${jobId}/${idx}.mp3`,
          buffer,
          { access: "public", contentType: "audio/mpeg" },
        );
        return {
          audioUrl: url,
          durationMs: Math.round(durationSeconds * 1000),
          text: scene.text,
          imageUrl: scene.imageUrl,
        };
      }),
    );
  } catch (cause) {
    throw new FriendlyError("Voice generation failed — try again.", cause);
  }

  const result: AudioScene[] = [];
  let cursor = 0;
  for (const item of synthesized) {
    result.push({
      text: item.text,
      imageUrl: item.imageUrl,
      audioUrl: item.audioUrl,
      durationMs: item.durationMs,
      startMs: cursor,
    });
    cursor += item.durationMs + SCENE_GAP_MS;
  }
  const totalDurationMs = cursor - SCENE_GAP_MS;

  return { scenes: result, totalDurationMs, jobId };
}

function mp3DurationAsync(buffer: Buffer): Promise<number> {
  return new Promise((resolve, reject) => {
    mp3Duration(buffer, (err: unknown, duration: number) => {
      if (err) reject(err);
      else resolve(duration);
    });
  });
}

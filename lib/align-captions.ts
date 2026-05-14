import OpenAI, { toFile } from "openai";
import { FriendlyError } from "./errors";
import type { AudioScene, Caption } from "./schemas";

export async function alignCaptions(
  scenes: AudioScene[],
): Promise<Caption[]> {
  const client = new OpenAI();

  try {
    const perScene = await Promise.all(
      scenes.map(async (scene, idx) => {
        const response = await fetch(scene.audioUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to download audio for scene ${idx}: ${response.status}`,
          );
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const file = await toFile(buffer, `${idx}.mp3`, {
          type: "audio/mpeg",
        });

        const transcription = await client.audio.transcriptions.create({
          file,
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["word"],
        });

        const words = transcription.words ?? [];
        return words.map<Caption>((w) => ({
          word: w.word,
          startMs: Math.round(w.start * 1000) + scene.startMs,
          endMs: Math.round(w.end * 1000) + scene.startMs,
        }));
      }),
    );

    return perScene.flat();
  } catch (cause) {
    throw new FriendlyError(
      "Caption alignment failed — try again.",
      cause,
    );
  }
}

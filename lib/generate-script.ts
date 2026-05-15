import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { ScriptSchema, type Script } from "./schemas";
import { FriendlyError } from "./errors";
import type { ExtractedArticle } from "./extract-article";

const SYSTEM_PROMPT = `You write punchy short-form video narration AND the visual prompt for each scene.

Narration rules:
- Output 3 to 4 scenes. Hook first, payoff last.
- One spoken sentence per scene, ≤25 words.
- No emojis. No markdown. No hashtags.
- Never say "in this article" or refer to the source — speak directly to the viewer.
- Plain spoken English a narrator can read out loud.

Image prompt rules (for each scene's imagePrompt field):
- One vivid sentence describing a concrete subject + setting + mood that visualizes the scene.
- 9:16 vertical composition, cinematic depth.
- No human faces, no on-image text, no logos, no watermarks.
- Same visual style across all scenes: cinematic, soft volumetric lighting, shallow depth of field, rich color grade, photoreal.
- Symbolic / atmospheric is fine when the scene is abstract.`;

export async function generateScript(
  article: ExtractedArticle,
): Promise<Script> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ScriptSchema,
      system: SYSTEM_PROMPT,
      prompt: `Title: ${article.title}\n\nArticle:\n${article.text}`,
      temperature: 0.7,
    });
    return object;
  } catch (cause) {
    throw new FriendlyError(
      "Couldn't write a script for this article — try a different URL.",
      cause,
    );
  }
}

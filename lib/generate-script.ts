import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { ScriptSchema, type Script } from "./schemas";
import { FriendlyError } from "./errors";
import type { ExtractedArticle } from "./extract-article";

const SYSTEM_PROMPT = `You write punchy short-form video narration.

Rules:
- Output 3 to 6 scenes. Hook first, payoff last.
- One spoken sentence per scene, ≤25 words.
- No emojis. No markdown. No hashtags.
- Never say "in this article" or refer to the source — speak directly to the viewer.
- Plain spoken English a narrator can read out loud.`;

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

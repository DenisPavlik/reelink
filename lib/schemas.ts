import { z } from "zod";

export const SceneSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(150)
    .describe("One spoken sentence, ≤25 words, no emojis, no markdown."),
  imagePrompt: z
    .string()
    .min(1)
    .max(300)
    .describe(
      "Visual prompt for the scene image. Concrete subject + setting + mood. No on-image text, no faces, no logos. Style prefix is added later.",
    ),
});

export const ScriptSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120)
    .describe("Short attention-grabbing title for the video."),
  scenes: z
    .array(SceneSchema)
    .min(3)
    .max(4)
    .describe("3 to 4 scenes. Hook first, payoff last."),
});

export type Scene = z.infer<typeof SceneSchema>;
export type Script = z.infer<typeof ScriptSchema>;

export const ImageSceneSchema = SceneSchema.extend({
  imageUrl: z.string().url(),
});

export type ImageScene = z.infer<typeof ImageSceneSchema>;

export const AudioSceneSchema = z.object({
  text: z.string(),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().url(),
  durationMs: z.number().positive(),
  startMs: z.number().nonnegative(),
});

export type AudioScene = z.infer<typeof AudioSceneSchema>;

export const CaptionSchema = z.object({
  word: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
});

export type Caption = z.infer<typeof CaptionSchema>;

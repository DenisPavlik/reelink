import { generateImages } from "@/lib/generate-images";
import { addSpent } from "@/lib/budget";
import { checkPaused, handleError } from "@/lib/api-helpers";
import type { Scene } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const CENTS_PER_IMAGE = 7;

export async function POST(request: Request) {
  try {
    const paused = await checkPaused();
    if (paused) return paused;

    const body = (await request.json()) as {
      scenes?: Scene[];
      jobId?: string;
    };
    if (!body.scenes || !body.jobId) {
      return Response.json(
        { error: "failed", message: "Missing scenes or jobId." },
        { status: 400 },
      );
    }

    const result = await generateImages(body.scenes, body.jobId);
    await addSpent(result.scenes.length * CENTS_PER_IMAGE);

    return Response.json(result);
  } catch (err) {
    return handleError(err);
  }
}

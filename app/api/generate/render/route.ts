import { startRender } from "@/lib/render-video";
import { addSpent } from "@/lib/budget";
import { checkPaused, handleError } from "@/lib/api-helpers";
import type { ReelProps } from "@/remotion/Reel";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const paused = await checkPaused();
    if (paused) return paused;

    const body = (await request.json()) as ReelProps;
    if (!body.scenes || !body.captions || !body.totalDurationMs) {
      return Response.json(
        { error: "failed", message: "Missing scenes, captions, or duration." },
        { status: 400 },
      );
    }

    const result = await startRender(body);
    await addSpent(5);

    return Response.json(result);
  } catch (err) {
    return handleError(err);
  }
}

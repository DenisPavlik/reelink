import { synthesizeAudio } from "@/lib/synthesize-audio";
import { checkPaused, handleError } from "@/lib/api-helpers";
import type { Scene } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const result = await synthesizeAudio(body.scenes, body.jobId);
    return Response.json(result);
  } catch (err) {
    return handleError(err);
  }
}

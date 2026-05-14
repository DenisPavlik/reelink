import { alignCaptions } from "@/lib/align-captions";
import { checkPaused, handleError } from "@/lib/api-helpers";
import type { AudioScene } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const paused = await checkPaused();
    if (paused) return paused;

    const body = (await request.json()) as { audioScenes?: AudioScene[] };
    if (!body.audioScenes) {
      return Response.json(
        { error: "failed", message: "Missing audioScenes." },
        { status: 400 },
      );
    }

    const captions = await alignCaptions(body.audioScenes);
    return Response.json({ captions });
  } catch (err) {
    return handleError(err);
  }
}

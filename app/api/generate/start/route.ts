import { extractArticle } from "@/lib/extract-article";
import { generateScript } from "@/lib/generate-script";
import { checkPaused, handleError } from "@/lib/api-helpers";
import { checkAndIncrement, getIpFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const paused = await checkPaused();
    if (paused) return paused;

    await checkAndIncrement(getIpFromRequest(request));

    const body = (await request.json()) as { url?: string };
    if (!body.url) {
      return Response.json(
        { error: "failed", message: "Missing URL." },
        { status: 400 },
      );
    }

    const article = await extractArticle(body.url);
    const script = await generateScript(article);

    return Response.json({
      jobId: crypto.randomUUID(),
      title: script.title,
      scenes: script.scenes,
    });
  } catch (err) {
    return handleError(err);
  }
}

import { getRenderStatus } from "@/lib/render-video";
import { handleError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const renderId = url.searchParams.get("renderId");
    const bucketName = url.searchParams.get("bucket");
    if (!renderId || !bucketName) {
      return Response.json(
        { error: "failed", message: "Missing renderId or bucket." },
        { status: 400 },
      );
    }
    const status = await getRenderStatus({ renderId, bucketName });
    return Response.json(status);
  } catch (err) {
    return handleError(err);
  }
}

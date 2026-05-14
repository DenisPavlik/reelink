import { list, del } from "@vercel/blob";

export const runtime = "nodejs";

const TTL_MS = 24 * 60 * 60 * 1000;
const PREFIX = "audio/";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const cutoff = Date.now() - TTL_MS;
  let cursor: string | undefined;
  const deleted: string[] = [];

  do {
    const result = await list({ prefix: PREFIX, cursor, limit: 1000 });
    cursor = result.cursor;
    const stale = result.blobs.filter(
      (b) => new Date(b.uploadedAt).getTime() < cutoff,
    );
    if (stale.length > 0) {
      await del(stale.map((b) => b.url));
      deleted.push(...stale.map((b) => b.pathname));
    }
  } while (cursor);

  return Response.json({ ok: true, deletedCount: deleted.length });
}

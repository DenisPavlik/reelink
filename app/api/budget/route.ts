import { getStatus } from "@/lib/budget";
import { handleError } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getStatus();
    return Response.json(status);
  } catch (err) {
    return handleError(err);
  }
}

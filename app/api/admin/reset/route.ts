import { reset } from "@/lib/budget";
import { handleError } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-admin-token");
    const expected = process.env.ADMIN_RESET_TOKEN;
    if (!expected) {
      return Response.json(
        { error: "failed", message: "Admin token not configured." },
        { status: 500 },
      );
    }
    if (token !== expected) {
      return Response.json(
        { error: "unauthorized", message: "Invalid admin token." },
        { status: 401 },
      );
    }
    await reset();
    return Response.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

import { isPaused } from "./budget";
import { FriendlyError, isFriendlyError } from "./errors";
import { RateLimitError } from "./rate-limit";

export const PAUSED_MESSAGE =
  "Live demo paused to stay within budget — try the pre-rendered demos below.";

export function pausedResponse(): Response {
  return Response.json(
    { error: "paused", message: PAUSED_MESSAGE },
    { status: 503 },
  );
}

export function rateLimitedResponse(err: RateLimitError): Response {
  return Response.json(
    {
      error: "rate-limited",
      message: "Daily limit reached — try the demos below or come back tomorrow.",
      retryAfterSeconds: err.retryAfterSeconds,
    },
    {
      status: 429,
      headers: { "retry-after": String(err.retryAfterSeconds) },
    },
  );
}

export function friendlyErrorResponse(err: FriendlyError): Response {
  return Response.json(
    { error: "failed", message: err.userMessage },
    { status: 400 },
  );
}

export function unexpectedErrorResponse(err: unknown): Response {
  console.error("[api] unexpected", err);
  return Response.json(
    { error: "unexpected", message: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

export async function checkPaused(): Promise<Response | null> {
  if (await isPaused()) return pausedResponse();
  return null;
}

export function handleError(err: unknown): Response {
  if (err instanceof RateLimitError) return rateLimitedResponse(err);
  if (isFriendlyError(err)) return friendlyErrorResponse(err);
  return unexpectedErrorResponse(err);
}

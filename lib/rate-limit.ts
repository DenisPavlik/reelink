import { kv } from "./kv";

export const DAILY_LIMIT = 3;

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Daily generation limit reached.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function checkAndIncrement(ip: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `reelink:rl:${ip}:${today}`;
  const client = kv();
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, 172_800);
  }
  if (count > DAILY_LIMIT) {
    throw new RateLimitError(secondsUntilMidnightUTC());
  }
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
    ),
  );
  return Math.max(60, Math.round((midnight.getTime() - now.getTime()) / 1000));
}

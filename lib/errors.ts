export class FriendlyError extends Error {
  readonly userMessage: string;
  readonly cause?: unknown;

  constructor(userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = "FriendlyError";
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

export function isFriendlyError(value: unknown): value is FriendlyError {
  return value instanceof FriendlyError;
}

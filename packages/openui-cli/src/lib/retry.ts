import { CreateError } from "./errors";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

export type RetryAttemptInfo = {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  error: unknown;
};

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (info: RetryAttemptInfo) => void;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref();
  });
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof CreateError && error.errorClass === "network";
}

export async function withRetry<T>(
  label: string,
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options.shouldRetry ?? isNetworkError;
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt < maxAttempts && shouldRetry(error)) {
        const delayMs = baseDelayMs * 2 ** (attempt - 1);
        const errorCode = error instanceof CreateError ? error.errorCode : "error";
        console.warn(
          `${label} failed (${errorCode}); retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxAttempts})...`,
        );
        options.onRetry?.({ attempt, maxAttempts, delayMs, error });
        await sleep(delayMs);
        continue;
      }
      if (error instanceof CreateError) {
        error.errorMetadata.attempts = attempt;
      }
      throw error;
    }
  }

  throw new Error(`${label} failed without an error`);
}

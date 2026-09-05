export type RetryOptions = {
  attempts: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 400;

export function readFetchAttempts(env: NodeJS.Dict<string> = process.env): number {
  const raw = env.RATE_FETCH_RETRIES?.trim();
  if (!raw || !/^[1-9]\d{0,1}$/.test(raw)) {
    return DEFAULT_ATTEMPTS;
  }
  return Math.min(8, Number(raw));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) {
        break;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Retry failed.");
}

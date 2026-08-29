type Window = {
  timestamps: number[];
};

const loginByEmail = new Map<string, Window>();
const loginByIp = new Map<string, Window>();
const signupByIp = new Map<string, Window>();

const HOUR_MS = 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

function prune(window: Window, now: number, maxAge: number) {
  window.timestamps = window.timestamps.filter((stamp) => now - stamp < maxAge);
}

function take(map: Map<string, Window>, key: string): Window {
  const existing = map.get(key);
  if (existing) {
    return existing;
  }
  const created = { timestamps: [] };
  map.set(key, created);
  return created;
}

function assertUnderLimit(window: Window, now: number, maxAge: number, max: number, message: string) {
  prune(window, now, maxAge);
  if (window.timestamps.length >= max) {
    throw new RateLimitError(message);
  }
  window.timestamps.push(now);
}

export function assertLoginAllowed(email: string, ip: string): void {
  const now = Date.now();
  const tooMany = "تعداد تلاش‌ها زیاد شده. کمی بعد دوباره تلاش کن.";
  assertUnderLimit(take(loginByEmail, email), now, FIFTEEN_MIN_MS, 10, tooMany);
  assertUnderLimit(take(loginByIp, ip), now, FIFTEEN_MIN_MS, 30, tooMany);
}

export function assertSignupAllowed(ip: string): void {
  const now = Date.now();
  assertUnderLimit(
    take(signupByIp, ip),
    now,
    HOUR_MS,
    8,
    "تعداد ساخت حساب زیاد شده. کمی بعد دوباره تلاش کن.",
  );
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

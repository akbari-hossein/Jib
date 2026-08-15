type Window = {
  timestamps: number[];
};

const sendByPhone = new Map<string, Window>();
const sendByIp = new Map<string, Window>();

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

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

export function assertOtpSendAllowed(phone: string, ip: string): void {
  const now = Date.now();
  const phoneWindow = take(sendByPhone, phone);
  const ipWindow = take(sendByIp, ip);

  prune(phoneWindow, now, HOUR_MS);
  prune(ipWindow, now, HOUR_MS);

  const lastSend = phoneWindow.timestamps.at(-1);
  if (lastSend && now - lastSend < MINUTE_MS) {
    throw new RateLimitError("لطفاً یک دقیقه صبر کن و دوباره تلاش کن.");
  }

  if (phoneWindow.timestamps.length >= 5) {
    throw new RateLimitError("تعداد درخواست‌ها زیاد شده. کمی بعد دوباره تلاش کن.");
  }

  if (ipWindow.timestamps.length >= 10) {
    throw new RateLimitError("تعداد درخواست‌ها زیاد شده. کمی بعد دوباره تلاش کن.");
  }

  phoneWindow.timestamps.push(now);
  ipWindow.timestamps.push(now);
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

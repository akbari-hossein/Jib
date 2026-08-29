import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

let dummyHashPromise: Promise<string> | undefined;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (key.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(key, expected);
}

function dummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("not-a-real-password");
  return dummyHashPromise;
}

export async function passwordMatches(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  const hash = stored ?? (await dummyPasswordHash());
  const ok = await verifyPassword(password, hash);
  return Boolean(stored) && ok;
}

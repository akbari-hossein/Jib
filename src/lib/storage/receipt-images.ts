import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  MAX_RECEIPT_IMAGE_BYTES,
  RECEIPT_IMAGE_KEY_PREFIX,
  RECEIPT_IMAGE_MIME_TYPES,
  type ReceiptImageMimeType,
} from "@/lib/subscription/constants";

export type ReceiptImageStore = {
  put(input: {
    userId: string;
    bytes: Buffer;
    mimeType: ReceiptImageMimeType;
    filename: string;
  }): Promise<{ imageUrl: string }>;
  get(imageUrl: string): Promise<{ bytes: Buffer; mimeType: ReceiptImageMimeType } | null>;
};

const MIME_TO_EXT: Record<ReceiptImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedReceiptMime(value: string): value is ReceiptImageMimeType {
  return (RECEIPT_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function parseReceiptImageUrl(imageUrl: string): { key: string } | null {
  if (!imageUrl.startsWith(RECEIPT_IMAGE_KEY_PREFIX)) {
    return null;
  }
  const key = imageUrl.slice(RECEIPT_IMAGE_KEY_PREFIX.length);
  if (!/^[a-zA-Z0-9/_-]+\.(jpg|png|webp)$/.test(key)) {
    return null;
  }
  return { key };
}

export function receiptImageOwnerId(imageUrl: string): string | null {
  const parsed = parseReceiptImageUrl(imageUrl);
  if (!parsed) {
    return null;
  }
  const [userId] = parsed.key.split("/");
  return userId || null;
}

function storageDir() {
  return process.env.RECEIPT_IMAGE_DIR ?? path.join(process.cwd(), "data", "receipt-images");
}

function safeJoin(root: string, key: string) {
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error("INVALID_RECEIPT_PATH");
  }
  return resolved;
}

/**
 * Local filesystem adapter for development.
 * TODO: swap for S3-compatible / Vercel Blob in production by implementing ReceiptImageStore.
 */
export const localReceiptImageStore: ReceiptImageStore = {
  async put({ userId, bytes, mimeType, filename }) {
    const ext = MIME_TO_EXT[mimeType];
    const key = `${userId}/${filename}.${ext}`;
    const dir = storageDir();
    const fullPath = safeJoin(dir, key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, bytes);
    return { imageUrl: `${RECEIPT_IMAGE_KEY_PREFIX}${key}` };
  },
  async get(imageUrl) {
    const parsed = parseReceiptImageUrl(imageUrl);
    if (!parsed) {
      return null;
    }
    const ext = parsed.key.split(".").pop();
    const mimeType = (Object.entries(MIME_TO_EXT).find(([, value]) => value === ext)?.[0] ??
      null) as ReceiptImageMimeType | null;
    if (!mimeType) {
      return null;
    }
    try {
      const bytes = await readFile(safeJoin(storageDir(), parsed.key));
      return { bytes, mimeType };
    } catch {
      return null;
    }
  },
};

export const receiptImageStore: ReceiptImageStore = localReceiptImageStore;

export function validateReceiptImageUpload(input: { mimeType: string; size: number }): {
  ok: true;
  mimeType: ReceiptImageMimeType;
} | { ok: false; error: string } {
  if (!isAllowedReceiptMime(input.mimeType)) {
    return { ok: false, error: "فقط عکس‌های JPEG، PNG یا WebP پذیرفته می‌شود." };
  }
  if (input.size <= 0 || input.size > MAX_RECEIPT_IMAGE_BYTES) {
    return { ok: false, error: "حجم عکس رسید باید کمتر از ۴ مگابایت باشد." };
  }
  return { ok: true, mimeType: input.mimeType };
}

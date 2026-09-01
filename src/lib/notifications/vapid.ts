export function vapidPublicKey(): string | null {
  const value = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
  return value && value.length > 0 ? value : null;
}

export function vapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null {
  const publicKey = vapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return null;
  }

  const subject =
    process.env.VAPID_SUBJECT ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "mailto:jib@localhost";

  return { publicKey, privateKey, subject };
}

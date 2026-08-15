import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OTP_PHONE_COOKIE, SESSION_COOKIE } from "@/lib/config/app";
import { hashSecret } from "@/lib/auth/crypto";
import { prisma } from "@/lib/db/prisma";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const token = await readSessionToken();
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSecret(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function setPendingPhoneCookie(phone: string) {
  const store = await cookies();
  store.set(OTP_PHONE_COOKIE, phone, {
    ...cookieOptions,
    maxAge: 10 * 60,
  });
}

export async function readPendingPhone(): Promise<string | null> {
  const store = await cookies();
  return store.get(OTP_PHONE_COOKIE)?.value ?? null;
}

export async function clearPendingPhoneCookie() {
  const store = await cookies();
  store.delete(OTP_PHONE_COOKIE);
}

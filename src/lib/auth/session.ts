import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  SESSION_COOKIE,
} from "@/lib/config/app";
import { generateSessionToken, hashSecret, sessionExpiry } from "@/lib/auth/crypto";
import { clientIp } from "@/lib/auth/request";
import { prisma } from "@/lib/db/prisma";

export const cookieOptions = {
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

export async function createSession(userId: string, headerList: Headers) {
  const { token, tokenHash } = generateSessionToken();
  const expiresAt = sessionExpiry();
  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip: clientIp(headerList),
      userAgent: headerList.get("user-agent")?.slice(0, 180),
    },
  });
  return { token, expiresAt };
}

export async function issueSession(userId: string, headerList: Headers) {
  const { token, expiresAt } = await createSession(userId, headerList);
  await setSessionCookie(token, expiresAt);
}

export async function readOAuthCookies(): Promise<{ state: string | null; verifier: string | null }> {
  const store = await cookies();
  return {
    state: store.get(OAUTH_STATE_COOKIE)?.value ?? null,
    verifier: store.get(OAUTH_VERIFIER_COOKIE)?.value ?? null,
  };
}

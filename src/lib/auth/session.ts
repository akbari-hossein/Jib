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

export function sessionCookieOptions(expiresAt: Date) {
  return {
    ...cookieOptions,
    expires: expiresAt,
    maxAge: Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
  };
}

export function clearedSessionCookieOptions() {
  return {
    ...cookieOptions,
    expires: new Date(0),
    maxAge: 0,
  };
}

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
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  if (session.user.status === "DISABLED") {
    await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => undefined);
    return null;
  }

  await touchLastActive(session.user.id, session.user.lastActiveAt);
  return session.user;
}

const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

async function touchLastActive(userId: string, lastActiveAt: Date | null) {
  if (lastActiveAt && Date.now() - lastActiveAt.getTime() < LAST_ACTIVE_THROTTLE_MS) {
    return;
  }
  await prisma.user
    .update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => undefined);
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
  store.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", clearedSessionCookieOptions());
}

export async function createSession(userId: string, headerList: Headers) {
  const { token, tokenHash } = generateSessionToken();
  const expiresAt = sessionExpiry();
  await prisma.$transaction([
    prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ip: clientIp(headerList),
        userAgent: headerList.get("user-agent")?.slice(0, 180),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    }),
  ]);
  return { token, expiresAt };
}

export async function issueSession(userId: string, headerList: Headers) {
  const { token, expiresAt } = await createSession(userId, headerList);
  await setSessionCookie(token, expiresAt);
}

export async function extendSession(token: string) {
  const tokenHash = hashSecret(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  const expiresAt = sessionExpiry();
  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt },
  });
  return expiresAt;
}

export async function readOAuthCookies(): Promise<{ state: string | null; verifier: string | null }> {
  const store = await cookies();
  return {
    state: store.get(OAUTH_STATE_COOKIE)?.value ?? null,
    verifier: store.get(OAUTH_VERIFIER_COOKIE)?.value ?? null,
  };
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  fetchGoogleProfile,
  googleRedirectUri,
  GoogleAuthError,
  type GoogleProfile,
} from "@/lib/auth/google";
import { requestOrigin } from "@/lib/auth/request";
import { createSession, readOAuthCookies, sessionCookieOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createUserWithDefaults } from "@/server/services/users";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, SESSION_COOKIE } from "@/lib/config/app";

function loginError(origin: string, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  return response;
}

async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const existingByGoogle = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingByGoogle) {
    if (!existingByGoogle.name && profile.name) {
      return prisma.user.update({
        where: { id: existingByGoogle.id },
        data: { name: profile.name },
      });
    }
    return existingByGoogle;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  });
  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.googleId,
        name: existingByEmail.name ?? profile.name,
      },
    });
  }

  try {
    return await createUserWithDefaults({
      email: profile.email,
      googleId: profile.googleId,
      name: profile.name,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.user.findFirst({
        where: {
          OR: [{ googleId: profile.googleId }, { email: profile.email }],
        },
      });
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const url = new URL(request.url);
  const errorParam = url.searchParams.get("error");
  if (errorParam === "access_denied") {
    return loginError(origin, "google_denied");
  }
  if (errorParam) {
    return loginError(origin, "google");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = await readOAuthCookies();

  if (!code || !state || !stored.state || !stored.verifier || stored.state !== state) {
    return loginError(origin, "google");
  }

  try {
    const profile = await fetchGoogleProfile({
      code,
      redirectUri: googleRedirectUri(request),
      verifier: stored.verifier,
    });
    const user = await findOrCreateGoogleUser(profile);
    const { token, expiresAt } = await createSession(user.id, request.headers);
    const response = NextResponse.redirect(new URL("/home", origin));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);
    return response;
  } catch (error) {
    const codeName = error instanceof GoogleAuthError ? error.code : "google";
    return loginError(origin, codeName);
  }
}

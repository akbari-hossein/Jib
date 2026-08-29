import { NextResponse } from "next/server";
import {
  createPkcePair,
  googleAuthUrl,
  googleClientConfig,
  googleRedirectUri,
  GoogleAuthError,
} from "@/lib/auth/google";
import { requestOrigin } from "@/lib/auth/request";
import { cookieOptions } from "@/lib/auth/session";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/config/app";

export async function GET(request: Request) {
  const origin = requestOrigin(request);

  try {
    const { clientId } = googleClientConfig();
    const { verifier, challenge, state } = createPkcePair();
    const destination = googleAuthUrl({
      clientId,
      redirectUri: googleRedirectUri(request),
      state,
      challenge,
    });
    const response = NextResponse.redirect(destination);
    response.cookies.set(OAUTH_STATE_COOKIE, state, { ...cookieOptions, maxAge: 10 * 60 });
    response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, { ...cookieOptions, maxAge: 10 * 60 });
    return response;
  } catch (error) {
    const code = error instanceof GoogleAuthError ? error.code : "google";
    return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  }
}

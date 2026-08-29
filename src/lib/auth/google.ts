import { createHash, randomBytes } from "node:crypto";
import { requestOrigin } from "@/lib/auth/request";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleAuthErrorCode =
  | "google"
  | "google_denied"
  | "google_unverified"
  | "google_email"
  | "google_config";

export class GoogleAuthError extends Error {
  constructor(readonly code: GoogleAuthErrorCode) {
    super(code);
    this.name = "GoogleAuthError";
  }
}

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string | null;
};

export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function googleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new GoogleAuthError("google_config");
  }
  return { clientId, clientSecret };
}

export function googleRedirectUri(request: Request): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }
  return `${requestOrigin(request)}/api/auth/google/callback`;
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");
  return { verifier, challenge, state };
}

export function googleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
}): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
};

type UserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
};

export async function fetchGoogleProfile(params: {
  code: string;
  redirectUri: string;
  verifier: string;
}): Promise<GoogleProfile> {
  const { clientId, clientSecret } = googleClientConfig();
  const body = new URLSearchParams({
    code: params.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
    code_verifier: params.verifier,
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    throw new GoogleAuthError("google");
  }

  const tokens = (await tokenResponse.json()) as TokenResponse;
  if (!tokens.access_token) {
    throw new GoogleAuthError("google");
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileResponse.ok) {
    throw new GoogleAuthError("google");
  }

  const profile = (await profileResponse.json()) as UserInfoResponse;
  const email = profile.email?.trim().toLowerCase();
  if (!profile.sub || !email) {
    throw new GoogleAuthError("google_email");
  }

  const verified = profile.email_verified === true || profile.email_verified === "true";
  if (!verified) {
    throw new GoogleAuthError("google_unverified");
  }

  const name = profile.name?.trim().slice(0, 60) || null;
  return { googleId: profile.sub, email, name };
}

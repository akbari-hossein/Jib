import { afterEach, describe, expect, it, vi } from "vitest";
import { googleAuthUrl, isGoogleAuthEnabled } from "@/lib/auth/google";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("googleAuthUrl", () => {
  it("includes PKCE and the requested scopes", () => {
    const url = new URL(
      googleAuthUrl({
        clientId: "client-id",
        redirectUri: "http://localhost:3000/api/auth/google/callback",
        state: "abc",
        challenge: "challenge",
      }),
    );

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/google/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe("abc");
    expect(url.searchParams.get("code_challenge")).toBe("challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });
});

describe("isGoogleAuthEnabled", () => {
  it("is false when credentials are missing", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it("is true when both credentials are set", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
    expect(isGoogleAuthEnabled()).toBe(true);
  });
});

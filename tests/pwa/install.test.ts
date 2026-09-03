import { describe, expect, it } from "vitest";
import {
  PWA_INSTALL_DISMISS_MS,
  PWA_INSTALL_SESSION_KEY,
  PWA_INSTALL_STORAGE_KEY,
  canPresentInstallInvitation,
  dismissInstallInvitation,
  getInstallSurface,
  hasShownInstallInvitationThisSession,
  isIosDevice,
  isStandaloneDisplayMode,
  markInstallInvitationInstalled,
  markInstallInvitationShownThisSession,
  parseInstallPromptRecord,
  readInstallPromptRecord,
  resolveInstallSurface,
  shouldOfferInstallInvitation,
  type DisplayModeEnv,
  type NavigatorLike,
  type StorageLike,
} from "@/lib/pwa/install";

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key]! : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
  };
}

function nav(partial: Partial<NavigatorLike> = {}): NavigatorLike {
  return {
    userAgent: "Mozilla/5.0",
    platform: "MacIntel",
    maxTouchPoints: 0,
    ...partial,
  };
}

function env(options: {
  standalone?: boolean;
  modes?: string[];
  referrer?: string;
  navigator?: Partial<NavigatorLike>;
}): DisplayModeEnv {
  const modes = new Set(options.modes ?? []);
  if (options.standalone) {
    modes.add("(display-mode: standalone)");
  }
  return {
    matchMedia: (query) => ({ matches: modes.has(query) }),
    navigator: nav({
      standalone: options.standalone ? true : undefined,
      ...options.navigator,
    }),
    document: { referrer: options.referrer ?? "" },
  };
}

describe("PWA install surface", () => {
  it("detects iPhone, iPad, and iPadOS desktop UA", () => {
    expect(isIosDevice(nav({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" }))).toBe(
      true,
    );
    expect(isIosDevice(nav({ userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)" }))).toBe(true);
    expect(isIosDevice(nav({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 5 }))).toBe(
      true,
    );
    expect(isIosDevice(nav({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 0 }))).toBe(
      false,
    );
    expect(isIosDevice(nav({ userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120" }))).toBe(false);
  });

  it("treats standalone, fullscreen, and TWA as already installed", () => {
    expect(isStandaloneDisplayMode(env({ standalone: true }))).toBe(true);
    expect(isStandaloneDisplayMode(env({ modes: ["(display-mode: fullscreen)"] }))).toBe(true);
    expect(isStandaloneDisplayMode(env({ modes: ["(display-mode: window-controls-overlay)"] }))).toBe(true);
    expect(isStandaloneDisplayMode(env({ referrer: "android-app://app.jib.web/" }))).toBe(true);
    expect(isStandaloneDisplayMode(env({}))).toBe(false);
  });

  it("prefers the native prompt, then iOS instructions, otherwise nothing", () => {
    expect(getInstallSurface({ standalone: true, ios: true, hasNativePrompt: true })).toBe("none");
    expect(getInstallSurface({ standalone: false, ios: false, hasNativePrompt: true })).toBe("native");
    expect(getInstallSurface({ standalone: false, ios: true, hasNativePrompt: false })).toBe("ios");
    expect(getInstallSurface({ standalone: false, ios: false, hasNativePrompt: false })).toBe("none");
  });

  it("does not offer iOS instructions inside an installed PWA", () => {
    expect(
      resolveInstallSurface(
        env({
          standalone: true,
          navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" },
        }),
        false,
      ),
    ).toBe("none");
  });

  it("offers iOS instructions in Safari and Chrome on iPhone", () => {
    const safari = env({
      navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/605.1.15" },
    });
    const chromeIos = env({
      navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) CriOS/120.0.0.0" },
    });
    expect(resolveInstallSurface(safari, false)).toBe("ios");
    expect(resolveInstallSurface(chromeIos, false)).toBe("ios");
  });

  it("does not offer a desktop or Android CTA without a native prompt", () => {
    expect(
      resolveInstallSurface(
        env({ navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" } }),
        false,
      ),
    ).toBe("none");
    expect(
      resolveInstallSurface(
        env({ navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120" } }),
        false,
      ),
    ).toBe("none");
    expect(
      resolveInstallSurface(
        env({ navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120" } }),
        true,
      ),
    ).toBe("native");
  });
});

describe("PWA install invitation persistence", () => {
  it("parses stored records and ignores corrupt data", () => {
    expect(parseInstallPromptRecord(null)).toBeNull();
    expect(parseInstallPromptRecord("{")).toBeNull();
    expect(parseInstallPromptRecord(JSON.stringify({ status: "dismissed", at: 10 }))).toEqual({
      status: "dismissed",
      at: 10,
    });
    expect(parseInstallPromptRecord(JSON.stringify({ status: "nope", at: 10 }))).toBeNull();
  });

  it("hides the invitation after dismiss until the cooldown elapses", () => {
    const now = 1_700_000_000_000;
    expect(shouldOfferInstallInvitation(null, now)).toBe(true);
    expect(shouldOfferInstallInvitation({ status: "dismissed", at: now - 1000 }, now)).toBe(false);
    expect(
      shouldOfferInstallInvitation({ status: "dismissed", at: now - PWA_INSTALL_DISMISS_MS }, now),
    ).toBe(true);
  });

  it("never offers the invitation again after a successful install", () => {
    const now = 1_700_000_000_000;
    expect(
      shouldOfferInstallInvitation(
        { status: "installed", at: now - PWA_INSTALL_DISMISS_MS * 4 },
        now,
      ),
    ).toBe(false);
  });

  it("writes dismissed and installed records without storing personal data", () => {
    const storage = memoryStorage();
    dismissInstallInvitation(storage, 42);
    expect(readInstallPromptRecord(storage)).toEqual({ status: "dismissed", at: 42 });
    markInstallInvitationInstalled(storage, 99);
    expect(readInstallPromptRecord(storage)).toEqual({ status: "installed", at: 99 });
    expect(PWA_INSTALL_STORAGE_KEY).toBe("jib:pwa-install-prompt");
  });

  it("remembers a presentation for the rest of the tab session", () => {
    const session = memoryStorage();
    expect(hasShownInstallInvitationThisSession(session)).toBe(false);
    markInstallInvitationShownThisSession(session);
    expect(hasShownInstallInvitationThisSession(session)).toBe(true);
    expect(session.getItem(PWA_INSTALL_SESSION_KEY)).toBe("1");
  });

  it("does not present when the surface is unavailable or already shown", () => {
    expect(
      canPresentInstallInvitation({
        surface: "none",
        record: null,
        shownThisSession: false,
      }),
    ).toBe(false);
    expect(
      canPresentInstallInvitation({
        surface: "ios",
        record: null,
        shownThisSession: true,
      }),
    ).toBe(false);
    expect(
      canPresentInstallInvitation({
        surface: "native",
        record: { status: "dismissed", at: Date.now() },
        shownThisSession: false,
      }),
    ).toBe(false);
    expect(
      canPresentInstallInvitation({
        surface: "ios",
        record: null,
        shownThisSession: false,
      }),
    ).toBe(true);
  });
});

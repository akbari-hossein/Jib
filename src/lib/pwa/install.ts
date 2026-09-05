export const PWA_INSTALL_STORAGE_KEY = "jib:pwa-install-prompt";
export const PWA_INSTALL_SESSION_KEY = "jib:pwa-install-prompt:shown";
export const PWA_INSTALL_DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
export const PWA_INSTALL_SETTLE_MS = 1800;

export type InstallSurface = "native" | "ios" | "none";
export type InstallPromptStatus = "dismissed" | "installed";

export type InstallPromptRecord = {
  status: InstallPromptStatus;
  at: number;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type NavigatorLike = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
};

export type DisplayModeEnv = {
  matchMedia(query: string): { matches: boolean };
  navigator: NavigatorLike;
  document?: { referrer?: string };
};

const STANDALONE_MEDIA = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)",
] as const;

export function isIosDevice(nav: NavigatorLike): boolean {
  if (/iPhone|iPod|iPad/i.test(nav.userAgent)) {
    return true;
  }
  return nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
}

export function isStandaloneDisplayMode(env: DisplayModeEnv): boolean {
  if (env.navigator.standalone) {
    return true;
  }
  if (STANDALONE_MEDIA.some((query) => env.matchMedia(query).matches)) {
    return true;
  }
  const referrer = env.document?.referrer ?? "";
  return referrer.startsWith("android-app://");
}

export function getInstallSurface(input: {
  standalone: boolean;
  ios: boolean;
  hasNativePrompt: boolean;
}): InstallSurface {
  if (input.standalone) {
    return "none";
  }
  if (input.hasNativePrompt) {
    return "native";
  }
  if (input.ios) {
    return "ios";
  }
  return "none";
}

export function parseInstallPromptRecord(raw: string | null): InstallPromptRecord | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const record = parsed as { status?: unknown; at?: unknown };
    if (record.status !== "dismissed" && record.status !== "installed") {
      return null;
    }
    if (typeof record.at !== "number" || !Number.isFinite(record.at)) {
      return null;
    }
    return { status: record.status, at: record.at };
  } catch {
    return null;
  }
}

export function shouldOfferInstallInvitation(
  record: InstallPromptRecord | null,
  now = Date.now(),
): boolean {
  if (!record) {
    return true;
  }
  if (record.status === "installed") {
    return false;
  }
  return now - record.at >= PWA_INSTALL_DISMISS_MS;
}

export function canPresentInstallInvitation(input: {
  surface: InstallSurface;
  record: InstallPromptRecord | null;
  shownThisSession: boolean;
  now?: number;
}): boolean {
  if (input.surface === "none" || input.shownThisSession) {
    return false;
  }
  return shouldOfferInstallInvitation(input.record, input.now);
}

export function readStorageItem(storage: StorageLike | null, key: string): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageItem(storage: StorageLike | null, key: string, value: string) {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    /* Safari private mode */
  }
}

export function readInstallPromptRecord(storage: StorageLike | null): InstallPromptRecord | null {
  return parseInstallPromptRecord(readStorageItem(storage, PWA_INSTALL_STORAGE_KEY));
}

export function writeInstallPromptRecord(
  storage: StorageLike | null,
  record: InstallPromptRecord,
) {
  writeStorageItem(storage, PWA_INSTALL_STORAGE_KEY, JSON.stringify(record));
}

export function hasShownInstallInvitationThisSession(storage: StorageLike | null): boolean {
  return readStorageItem(storage, PWA_INSTALL_SESSION_KEY) === "1";
}

export function markInstallInvitationShownThisSession(storage: StorageLike | null) {
  writeStorageItem(storage, PWA_INSTALL_SESSION_KEY, "1");
}

export function dismissInstallInvitation(storage: StorageLike | null, now = Date.now()) {
  writeInstallPromptRecord(storage, { status: "dismissed", at: now });
}

export function markInstallInvitationInstalled(storage: StorageLike | null, now = Date.now()) {
  writeInstallPromptRecord(storage, { status: "installed", at: now });
}

export function browserLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function browserSessionStorage(): StorageLike | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function resolveInstallSurface(env: DisplayModeEnv, hasNativePrompt: boolean): InstallSurface {
  return getInstallSurface({
    standalone: isStandaloneDisplayMode(env),
    ios: isIosDevice(env.navigator),
    hasNativePrompt,
  });
}

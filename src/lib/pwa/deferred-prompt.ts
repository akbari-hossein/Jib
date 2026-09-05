import {
  browserLocalStorage,
  markInstallInvitationInstalled,
} from "@/lib/pwa/install";

export type JibBeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Snapshot = {
  deferred: JibBeforeInstallPromptEvent | null;
  installed: boolean;
};

const listeners = new Set<() => void>();
let bound = false;
let snapshot: Snapshot = { deferred: null, installed: false };

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(next: Snapshot) {
  snapshot = next;
  emit();
}

function onBeforeInstallPrompt(event: Event) {
  event.preventDefault();
  setSnapshot({
    deferred: event as JibBeforeInstallPromptEvent,
    installed: false,
  });
}

function onAppInstalled() {
  markInstallInvitationInstalled(browserLocalStorage());
  setSnapshot({ deferred: null, installed: true });
}

export function bindInstallPromptListeners() {
  if (typeof window === "undefined" || bound) {
    return;
  }
  bound = true;
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
}

export function subscribeInstallPrompt(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getInstallPromptSnapshot(): Snapshot {
  return snapshot;
}

export function getServerInstallPromptSnapshot(): Snapshot {
  return { deferred: null, installed: false };
}

export function clearDeferredInstallPrompt() {
  if (!snapshot.deferred && !snapshot.installed) {
    return;
  }
  setSnapshot({ deferred: null, installed: snapshot.installed });
}

export function resetInstallPromptBridgeForTests() {
  bound = false;
  snapshot = { deferred: null, installed: false };
  listeners.clear();
}

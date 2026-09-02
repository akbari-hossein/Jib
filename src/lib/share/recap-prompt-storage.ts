const PREFIX = "jib:recap-prompt:";

export function recapPromptStorageKey(year: number, month: number): string {
  return `${PREFIX}${year}-${month}`;
}

export function isRecapPromptDismissed(year: number, month: number): boolean {
  try {
    return window.localStorage.getItem(recapPromptStorageKey(year, month)) === "1";
  } catch {
    return false;
  }
}

export function dismissRecapPrompt(year: number, month: number) {
  try {
    window.localStorage.setItem(recapPromptStorageKey(year, month), "1");
  } catch {
    /* Safari private mode */
  }
}

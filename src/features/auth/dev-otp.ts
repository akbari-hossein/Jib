let current: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function setDevOtp(code: string | null) {
  current = code;
  if (typeof sessionStorage !== "undefined") {
    if (code) {
      sessionStorage.setItem("jib_dev_otp", code);
    } else {
      sessionStorage.removeItem("jib_dev_otp");
    }
  }
  emit();
}

export function subscribeDevOtp(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDevOtpSnapshot() {
  if (current === null && typeof sessionStorage !== "undefined") {
    current = sessionStorage.getItem("jib_dev_otp");
  }
  return current;
}

export function getDevOtpServerSnapshot() {
  return null;
}

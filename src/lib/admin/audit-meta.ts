const SENSITIVE_KEY = /password|token|secret|hash|auth|p256dh|cookie|session/i;

export function sanitizeAuditMetadata(
  input: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      continue;
    }
    if (value == null) {
      result[key] = value;
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
      continue;
    }
    if (typeof value === "bigint") {
      result[key] = value.toString();
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

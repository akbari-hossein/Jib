import { timingSafeEqual } from "node:crypto";

export function requestMatchesBearerSecret(
  request: Request,
  secret: string | undefined,
): boolean {
  const expectedSecret = secret?.trim();
  if (!expectedSecret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  const token = header.slice("Bearer ".length);
  const expected = Buffer.from(expectedSecret);
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function requestMatchesAnyBearerSecret(
  request: Request,
  secrets: Array<string | undefined>,
): boolean {
  return secrets.some((secret) => requestMatchesBearerSecret(request, secret));
}

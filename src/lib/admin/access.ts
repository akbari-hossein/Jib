import type { UserRole, UserStatus } from "@prisma/client";

export function isActiveAdmin(user: {
  role: UserRole;
  status: UserStatus;
} | null | undefined): boolean {
  return user?.role === "ADMIN" && user.status === "ACTIVE";
}

export function parseBootstrapAdminEmails(
  raw = process.env.ADMIN_BOOTSTRAP_EMAILS,
): string[] {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

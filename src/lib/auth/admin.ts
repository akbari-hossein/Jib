import { notFound, redirect } from "next/navigation";
import { isActiveAdmin, parseBootstrapAdminEmails } from "@/lib/admin/access";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export { isActiveAdmin, parseBootstrapAdminEmails };

export async function maybePromoteBootstrapAdmin<
  T extends { id: string; email: string; role: "USER" | "ADMIN"; status: "ACTIVE" | "DISABLED" },
>(user: T): Promise<T> {
  if (user.role === "ADMIN" || user.status !== "ACTIVE") {
    return user;
  }

  const emails = parseBootstrapAdminEmails();
  if (!emails.includes(user.email.toLowerCase())) {
    return user;
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return user;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: { role: true },
  });

  return { ...user, role: updated.role };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.status !== "ACTIVE") {
    notFound();
  }
  if (isActiveAdmin(user)) {
    return user;
  }

  const promoted = await maybePromoteBootstrapAdmin(user);
  if (isActiveAdmin(promoted)) {
    return promoted;
  }

  notFound();
}

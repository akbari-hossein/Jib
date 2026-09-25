import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { maybePromoteBootstrapAdmin } from "@/lib/auth/admin";
import { authorizeAdminList } from "@/lib/subscription/api-access";
import { getAdminUserById } from "@/server/admin/admin-user-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const sessionUser = await getCurrentUser();
  const actor = sessionUser ? await maybePromoteBootstrapAdmin(sessionUser) : null;
  const auth = authorizeAdminList(actor);
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.status === 401 ? "unauthorized" : "forbidden" },
      { status: auth.status },
    );
  }

  const { id } = await context.params;
  const user = await getAdminUserById(id);
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

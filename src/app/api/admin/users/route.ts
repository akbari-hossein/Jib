import { NextResponse } from "next/server";
import { maybePromoteBootstrapAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { parseAdminUsersQuery } from "@/lib/subscription/admin-users";
import { authorizeAdminList } from "@/lib/subscription/api-access";
import { listAdminSubscribers } from "@/server/queries/admin/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const actor = user ? await maybePromoteBootstrapAdmin(user) : null;
  const auth = authorizeAdminList(actor);
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.status === 401 ? "unauthorized" : "forbidden" },
      { status: auth.status },
    );
  }

  const params = new URL(request.url).searchParams;
  const query = parseAdminUsersQuery({
    status: params.get("status"),
    search: params.get("search"),
    page: params.get("page"),
    pageSize: params.get("pageSize"),
  });
  const result = await listAdminSubscribers(query);
  return NextResponse.json(result);
}

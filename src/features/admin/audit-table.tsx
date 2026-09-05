import { Badge } from "@/components/ui/badge";
import { formatJalaliDateTime } from "@/lib/admin/format";
import { ADMIN_AUDIT_LABEL } from "@/lib/admin/labels";
import type { AdminAuditAction } from "@prisma/client";

export function AdminAuditTable({
  logs,
}: {
  logs: Array<{
    id: string;
    adminEmail: string;
    action: AdminAuditAction;
    targetType: string;
    targetId: string;
    metadata: unknown;
    createdAt: Date;
    admin: { id: string; name: string | null } | null;
  }>;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">زمان</th>
              <th className="px-4 py-3 text-start font-medium">مدیر</th>
              <th className="px-4 py-3 text-start font-medium">اقدام</th>
              <th className="px-4 py-3 text-start font-medium">هدف</th>
              <th className="px-4 py-3 text-start font-medium">جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{formatJalaliDateTime(log.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{log.admin?.name ?? "مدیر حذف‌شده"}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {log.adminEmail}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={log.action === "USER_DELETED" ? "expense" : "muted"}>
                    {ADMIN_AUDIT_LABEL[log.action]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs">{log.targetType}</p>
                  <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {log.targetId}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatMetadata(log.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {logs.map((log) => (
          <li key={log.id} className="rounded-3xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Badge tone={log.action === "USER_DELETED" ? "expense" : "muted"}>
                {ADMIN_AUDIT_LABEL[log.action]}
              </Badge>
              <p className="text-xs text-muted-foreground">{formatJalaliDateTime(log.createdAt)}</p>
            </div>
            <p className="mt-3 text-sm">{log.admin?.name ?? log.adminEmail}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground" dir="ltr">
              {log.targetId}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{formatMetadata(log.metadata)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function formatMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") {
    return "—";
  }
  const entries = Object.entries(metadata as Record<string, unknown>)
    .filter(([, value]) => value != null && typeof value !== "object")
    .map(([key, value]) => `${key}: ${String(value)}`);
  return entries.length > 0 ? entries.join(" · ") : "—";
}

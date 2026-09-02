"use client";

import { useActionState, useEffect, useState } from "react";
import type { UserRole, UserStatus } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDialog } from "@/features/admin/confirm-dialog";
import { USER_ROLE_LABEL } from "@/lib/admin/labels";
import {
  deleteAdminUser,
  resetAdminUserOnboarding,
  setAdminUserRole,
  setAdminUserStatus,
  type AdminActionState,
} from "@/server/actions/admin/users";

const initial: AdminActionState = { ok: false };

export function AdminUserActions({
  userId,
  email,
  role,
  status,
  onboardingCompleted,
  isSelf,
}: {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  onboardingCompleted: boolean;
  isSelf: boolean;
}) {
  const [dialog, setDialog] = useState<"status" | "delete" | "onboarding" | null>(null);
  const nextStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  const [statusState, statusAction, statusPending] = useActionState(setAdminUserStatus, initial);
  const [roleState, roleAction, rolePending] = useActionState(setAdminUserRole, initial);
  const [onboardingState, onboardingAction, onboardingPending] = useActionState(
    resetAdminUserOnboarding,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAdminUser, initial);

  useEffect(() => {
    if (statusState.ok) {
      toast.success(status === "ACTIVE" ? "کاربر غیرفعال شد." : "کاربر دوباره فعال شد.");
    }
  }, [statusState.ok, status]);

  useEffect(() => {
    if (onboardingState.ok) {
      toast.success("راهنمای شروع بازنشانی شد.");
    }
  }, [onboardingState.ok]);

  useEffect(() => {
    if (roleState.ok) {
      toast.success("نقش کاربر ذخیره شد.");
    }
  }, [roleState.ok]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">اقدامات مدیریتی</h2>
      <p className="mt-1 text-sm leading-7 text-muted-foreground">
        این کارها در گزارش اقدامات ثبت می‌شوند و از سمت سرور بررسی می‌شوند.
      </p>

      <form action={roleAction} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="userId" value={userId} />
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          نقش
          <NativeSelect name="role" defaultValue={role} disabled={isSelf || rolePending} className="h-11">
            <option value="USER">{USER_ROLE_LABEL.USER}</option>
            <option value="ADMIN">{USER_ROLE_LABEL.ADMIN}</option>
          </NativeSelect>
        </label>
        <Button type="submit" variant="secondary" disabled={isSelf || rolePending} className="h-11">
          ذخیره نقش
        </Button>
      </form>
      {roleState.error ? <p className="mt-2 text-sm text-destructive">{roleState.error}</p> : null}
      {isSelf ? (
        <p className="mt-2 text-xs text-muted-foreground">نمی‌توانی نقش یا وضعیت خودت را تغییر بدهی.</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={isSelf}
          onClick={() => setDialog("status")}
        >
          {status === "ACTIVE" ? "غیرفعال کردن" : "فعال‌سازی دوباره"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!onboardingCompleted}
          onClick={() => setDialog("onboarding")}
        >
          بازنشانی راهنمای شروع
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">منطقه خطر</p>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          حذف کاربر همه داده‌های مالی‌اش را برای همیشه پاک می‌کند و قابل برگشت نیست.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          disabled={isSelf}
          onClick={() => setDialog("delete")}
        >
          حذف حساب کاربر
        </Button>
      </div>

      <form action={statusAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={nextStatus} />
        <ConfirmDialog
          open={dialog === "status" && !statusState.ok}
          title={status === "ACTIVE" ? "غیرفعال کردن کاربر؟" : "فعال‌سازی دوباره؟"}
          description={
            status === "ACTIVE"
              ? "جلسات کاربر بسته می‌شود و دیگر نمی‌تواند وارد جیب شود."
              : "کاربر دوباره می‌تواند با همین ایمیل وارد شود."
          }
          confirmLabel={status === "ACTIVE" ? "غیرفعال کن" : "فعال کن"}
          pending={statusPending}
          error={statusState.error}
          onClose={() => setDialog(null)}
        />
      </form>

      <form action={onboardingAction}>
        <input type="hidden" name="userId" value={userId} />
        <ConfirmDialog
          open={dialog === "onboarding" && !onboardingState.ok}
          title="بازنشانی راهنمای شروع؟"
          description="کاربر در ورود بعدی دوباره تور شروع جیب را می‌بیند. داده‌های مالی‌اش پاک نمی‌شود."
          confirmLabel="بازنشانی"
          pending={onboardingPending}
          error={onboardingState.error}
          onClose={() => setDialog(null)}
        />
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="userId" value={userId} />
        <ConfirmDialog
          open={dialog === "delete"}
          title="حذف دائمی این کاربر؟"
          description={`حساب‌ها، تراکنش‌ها، بودجه‌ها، اهداف و نشست‌های «${email}» حذف می‌شوند. برای تأیید، ایمیل کاربر را وارد کن.`}
          confirmLabel="حذف دائمی"
          destructive
          pending={deletePending}
          requireValue={email}
          requireHint="ایمیل کاربر را وارد کن"
          error={deleteState.error}
          onClose={() => setDialog(null)}
        />
      </form>
    </section>
  );
}

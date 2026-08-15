"use client";

import { useActionState, useSyncExternalStore } from "react";
import { resendOtp, verifyOtp, type AuthActionState } from "@/server/actions/auth";
import {
  getDevOtpServerSnapshot,
  getDevOtpSnapshot,
  subscribeDevOtp,
} from "@/features/auth/dev-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPersianDigits } from "@/lib/currency/format";

const initial: AuthActionState = { ok: false };

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyOtp, initial);
  const [resendState, resendAction, resending] = useActionState(resendOtp, initial);
  const storedCode = useSyncExternalStore(
    subscribeDevOtp,
    getDevOtpSnapshot,
    getDevOtpServerSnapshot,
  );
  const devCode = resendState.devCode ?? storedCode;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">کد تأیید</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            maxLength={5}
            placeholder="_____"
            className="text-center text-2xl tracking-[0.6em]"
            required
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {resendState.error ? (
          <p role="alert" className="text-sm text-destructive">
            {resendState.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "در حال بررسی…" : "ورود"}
        </Button>
      </form>

      <form action={resendAction}>
        <Button type="submit" variant="ghost" disabled={resending} className="w-full">
          {resending ? "در حال ارسال…" : "ارسال دوباره کد"}
        </Button>
      </form>

      {devCode ? (
        <p className="rounded-2xl bg-surface-muted px-4 py-3 text-center text-sm text-foreground/70">
          کد توسعه: {toPersianDigits(devCode)}
        </p>
      ) : null}
    </div>
  );
}

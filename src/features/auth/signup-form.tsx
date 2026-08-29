"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthActionState } from "@/server/actions/auth";
import { GoogleButton } from "@/features/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthActionState = { ok: false };

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action, pending] = useActionState(signup, initial);

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">نام</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="مثلاً حسین" maxLength={60} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">ایمیل</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            className="text-left"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">رمز عبور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            minLength={8}
            className="text-left"
            required
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "در حال ساخت حساب…" : "ثبت‌نام"}
        </Button>
      </form>
      {googleEnabled ? <GoogleButton /> : null}
      <p className="text-center text-sm text-foreground/55">
        قبلاً حساب ساختی؟{" "}
        <Link href="/login" className="text-primary">
          ورود
        </Link>
      </p>
    </div>
  );
}

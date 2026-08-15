"use client";

import { useActionState } from "react";
import { updateProfile } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ name }: { name: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">نام</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name ?? ""}
          placeholder="مثلاً حسین"
          autoComplete="name"
          maxLength={60}
        />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-income">ذخیره شد.</p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ذخیره نام"}
      </Button>
    </form>
  );
}

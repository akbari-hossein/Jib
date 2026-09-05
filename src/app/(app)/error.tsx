"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <main className="px-5 pt-8">
      <Logo href="/home" size="sm" className="mb-6" />
      <ErrorState
        title="این صفحه الان در دسترس نیست"
        description="یک مشکل موقتی پیش آمد. داده‌ات پاک نشده. یک بار دیگر تلاش کن."
        action={
          <Button type="button" onClick={reset}>
            تلاش دوباره
          </Button>
        }
      />
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <main className="px-5 pt-8">
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

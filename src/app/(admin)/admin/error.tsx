"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="این صفحه الان در دسترس نیست"
      description="یک مشکل موقتی پیش آمد. داده‌های کاربران تغییر نکرده. یک بار دیگر تلاش کن."
      action={
        <Button type="button" onClick={reset}>
          تلاش دوباره
        </Button>
      }
    />
  );
}

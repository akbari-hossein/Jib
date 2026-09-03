"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5">
      <Logo href="/" size="sm" className="mb-6" />
      <ErrorState
        title="یک جای کار گیر کرد"
        description="صفحه درست بارگذاری نشد. یک بار دیگر تلاش کن. اگر ادامه داشت، بعداً برگرد."
        action={
          <Button type="button" onClick={reset}>
            تلاش دوباره
          </Button>
        }
      />
    </main>
  );
}

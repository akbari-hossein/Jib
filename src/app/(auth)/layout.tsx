import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/config/app";

export const metadata: Metadata = {
  title: "حساب کاربری",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <p className="mb-8 text-sm text-foreground/45">{APP_NAME}</p>
        {children}
      </div>
    </div>
  );
}

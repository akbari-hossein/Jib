import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "حساب کاربری",
  robots: privatePageRobots,
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8">
          <Logo href="/" size="sm" />
        </div>
        {children}
      </div>
    </div>
  );
}

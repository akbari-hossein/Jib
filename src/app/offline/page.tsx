import Link from "next/link";
import { APP_NAME } from "@/lib/config/app";
import { privatePageRobots } from "@/lib/seo/metadata";

export const metadata = {
  title: "آفلاین",
  robots: privatePageRobots,
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="text-sm text-muted-foreground">{APP_NAME}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">آفلاین هستی</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        اتصال اینترنت برقرار نیست. پوستهٔ برنامه اینجاست؛ اطلاعات مالی وقتی آنلاین
        شوی به‌روز می‌شود.
      </p>
      <Link href="/home" className="mt-8 text-sm text-primary">
        تلاش دوباره
      </Link>
    </main>
  );
}

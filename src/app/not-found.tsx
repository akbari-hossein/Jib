import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5">
      <Logo href="/" size="sm" />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">این صفحه پیدا نشد</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        آدرس اشتباه است یا این صفحه دیگر وجود ندارد.
      </p>
      <Button asChild className="mt-8 w-fit">
        <Link href="/">برگشت به خانه</Link>
      </Button>
    </main>
  );
}

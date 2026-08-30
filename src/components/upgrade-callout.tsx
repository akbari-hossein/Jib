import Link from "next/link";

export function UpgradeCallout({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card px-5 py-4">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
      <Link href="/pricing" className="mt-3 inline-block text-sm text-primary">
        نسخه حرفه‌ای
      </Link>
    </section>
  );
}

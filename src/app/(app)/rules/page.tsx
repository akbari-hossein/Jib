import { requireUser } from "@/lib/auth/session";
import { listRules } from "@/server/queries/rules";
import { listCategories } from "@/server/queries/categories";
import { deleteRule } from "@/server/actions/rules";
import { RuleForm } from "@/features/rules/rule-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default async function RulesPage() {
  const user = await requireUser();
  const [rules, categories] = await Promise.all([
    listRules(user.id),
    listCategories(user.id),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">قوانین</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          اگر فروشنده‌ای را چند بار به یک دسته بزنی، جیب همان را به خاطر می‌سپارد.
          اینجا می‌توانی قانون‌ها را ببینی یا خودت بسازی.
        </p>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          title="هنوز قانونی نداری"
          description="مثلاً هر بار «اسنپ» را در حمل‌ونقل بگذار تا بعداً خودکار انتخاب شود."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <p className="text-sm">
                <span className="font-medium">{rule.matchValue}</span>
                <span className="text-foreground/45"> → {rule.category.name}</span>
              </p>
              <form action={deleteRule}>
                <input type="hidden" name="id" value={rule.id} />
                <Button type="submit" variant="ghost" size="sm">
                  حذف
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold">قانون جدید</h2>
        <RuleForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />
      </section>
    </main>
  );
}

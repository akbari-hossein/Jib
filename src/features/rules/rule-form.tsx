"use client";

import { useActionState } from "react";
import { createRule, type RuleActionState } from "@/server/actions/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: RuleActionState = { ok: false };

export function RuleForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createRule, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="matchValue">اگر نام فروشنده شامل این باشد</Label>
        <Input id="matchValue" name="matchValue" placeholder="مثلاً اسنپ" required />
      </div>
      <input type="hidden" name="matchType" value="CONTAINS" />
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">دسته‌بندی</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="h-12 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="">انتخاب کن</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "افزودن قانون"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import {
  upsertBudgetCategory,
  updateOverallLimit,
  type BudgetActionState,
} from "@/server/actions/budgets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";

const initial: BudgetActionState = { ok: false };

export function BudgetCategoryForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(upsertBudgetCategory, initial);

  if (categories.length === 0) {
    return null;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">دسته</Label>
        <NativeSelect id="categoryId" name="categoryId" required>
          <option value="">انتخاب کن</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="limit">سقف این ماه</Label>
        <MoneyInput id="limit" name="limit" required />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ذخیره سقف"}
      </Button>
    </form>
  );
}

export function OverallLimitForm({ overallLimit }: { overallLimit: string }) {
  const [state, action, pending] = useActionState(updateOverallLimit, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="overallLimit">سقف کل ماه</Label>
        <MoneyInput
          id="overallLimit"
          name="overallLimit"
          defaultValue={overallLimit}
          placeholder="خالی = بدون سقف کل"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ذخیره سقف کل"}
      </Button>
    </form>
  );
}

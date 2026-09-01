"use client";

import { useActionState } from "react";
import { updateGoalCurrent, type GoalActionState } from "@/server/actions/goals";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/money/money-input";

const initial: GoalActionState = { ok: false };

export function GoalCurrentForm({
  id,
  currentAmount,
}: {
  id: string;
  currentAmount: string;
}) {
  const [state, action, pending] = useActionState(updateGoalCurrent, initial);

  return (
    <form action={action} className="mt-4 flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <MoneyInput
          name="currentAmount"
          defaultValue={currentAmount}
          aria-label="مبلغ فعلی"
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          {pending ? "…" : "به‌روز کن"}
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

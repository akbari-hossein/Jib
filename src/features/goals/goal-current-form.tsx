"use client";

import { useActionState } from "react";
import { updateGoalCurrent, type GoalActionState } from "@/server/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <Input
          name="currentAmount"
          inputMode="numeric"
          dir="ltr"
          defaultValue={currentAmount}
          className="text-left"
          aria-label="مبلغ فعلی"
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

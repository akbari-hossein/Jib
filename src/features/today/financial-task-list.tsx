"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { cn } from "@/lib/utils";
import type { JalaliDate } from "@/lib/dates/tehran";
import { completeFinancialTask, createCustomFinancialTask } from "@/server/actions/today";

export type TodayTaskItem = {
  id: string;
  title: string;
  isOverdue: boolean;
};

export function FinancialTaskList({
  tasks,
  defaultDueDate,
}: {
  tasks: TodayTaskItem[];
  defaultDueDate: JalaliDate;
}) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [addPending, startAdd] = useTransition();
  const items = tasks.filter((task) => !completedIds.includes(task.id));

  function complete(taskId: string) {
    setCompletedIds((ids) => [...ids, taskId]);
    setPendingId(taskId);
    startTransition(async () => {
      const result = await completeFinancialTask(taskId);
      setPendingId(null);
      if (!result.ok) {
        setCompletedIds((ids) => ids.filter((id) => id !== taskId));
        toast.error(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
      }
    });
  }

  function addTask(formData: FormData) {
    startAdd(async () => {
      const result = await createCustomFinancialTask(undefined, formData);
      if (result.ok) {
        setAdding(false);
        setAddError(null);
        return;
      }
      setAddError(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm text-muted-foreground">کارهای مالی</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-primary"
          onClick={() => {
            setAdding((open) => !open);
            setAddError(null);
          }}
        >
          {adding ? "بستن" : "افزودن کار"}
        </Button>
      </div>
      {adding ? (
        <form action={addTask} className="mb-3 flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
          <Input name="title" required maxLength={80} placeholder="مثلاً پرداخت قبض" />
          <JalaliDateFields
            prefix="due"
            defaultValue={defaultDueDate}
            minYear={defaultDueDate.year}
            maxYear={defaultDueDate.year + 1}
          />
          {addError ? (
            <p role="alert" className="text-sm text-destructive">
              {addError}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={addPending}>
            {addPending ? "در حال ذخیره…" : "ثبت کار"}
          </Button>
        </form>
      ) : null}
      {items.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">برای امروز کاری نداری.</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="overflow-hidden rounded-3xl border border-border bg-card">
          {items.map((task) => {
            const checkboxId = `task-${task.id}`;
            return (
              <li
                key={task.id}
                className={cn(
                  "border-s-2",
                  task.isOverdue ? "border-s-warning" : "border-s-transparent",
                )}
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={pendingId === task.id}
                    disabled={pendingId === task.id}
                    onChange={() => complete(task.id)}
                    className="size-4 shrink-0 rounded border-border accent-primary"
                  />
                  <label htmlFor={checkboxId} className="min-w-0 flex-1 text-sm leading-6">
                    {task.title}
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

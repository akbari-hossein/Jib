"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { completeFinancialTask } from "@/server/actions/today";
import { cn } from "@/lib/utils";

export type TodayTaskItem = {
  id: string;
  title: string;
  isOverdue: boolean;
};

export function FinancialTaskList({ tasks }: { tasks: TodayTaskItem[] }) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const items = tasks.filter((task) => !completedIds.includes(task.id));

  if (items.length === 0) {
    return null;
  }

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

  return (
    <section>
      <h2 className="mb-3 text-sm text-muted-foreground">کارهای مالی</h2>
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
    </section>
  );
}

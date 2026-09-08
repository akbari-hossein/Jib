"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CHECK_IN_MOOD_LABEL } from "@/lib/labels";
import { saveDailyCheckIn } from "@/server/actions/today";
import type { CheckInMood } from "@prisma/client";

const MOODS: CheckInMood[] = ["GOOD", "NEUTRAL", "STRESSED"];

export function DailyCheckIn({ mood }: { mood: CheckInMood | null }) {
  const [selected, setSelected] = useState<CheckInMood | null>(mood);
  const [pendingMood, setPendingMood] = useState<CheckInMood | null>(null);
  const [, startTransition] = useTransition();

  function choose(next: CheckInMood) {
    if (next === selected) {
      return;
    }
    const previous = selected;
    setSelected(next);
    setPendingMood(next);
    startTransition(async () => {
      const result = await saveDailyCheckIn(next);
      setPendingMood(null);
      if (!result.ok) {
        setSelected(previous);
        toast.error(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
      }
    });
  }

  return (
    <section>
      <h2 className="mb-4 text-sm text-muted-foreground">حالت امروز چطوره؟</h2>
      <div className="grid grid-cols-3 gap-3">
        {MOODS.map((item) => {
          const isSelected = selected === item;
          return (
            <Button
              key={item}
              type="button"
              variant={isSelected ? "default" : "secondary"}
              size="sm"
              className="h-11 w-full"
              disabled={pendingMood === item}
              onClick={() => choose(item)}
            >
              {CHECK_IN_MOOD_LABEL[item]}
            </Button>
          );
        })}
      </div>
    </section>
  );
}

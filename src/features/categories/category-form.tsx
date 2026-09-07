"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  CATEGORY_ICON_LABEL,
  CATEGORY_ICONS,
  defaultCategoryIcon,
} from "@/lib/categories/icons";
import { TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { createCategory } from "@/server/actions/categories";

const KINDS = ["EXPENSE", "INCOME"] as const;

export function CategoryForm({ onSuccess }: { onSuccess?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("EXPENSE");
  const [icon, setIcon] = useState(defaultCategoryIcon("EXPENSE"));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleKindChange(next: (typeof KINDS)[number]) {
    setKind(next);
    setIcon((current) =>
      current === defaultCategoryIcon(kind) ? defaultCategoryIcon(next) : current,
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCategory(undefined, formData);
      if (!result.ok) {
        setError(result.error ?? "ذخیره دسته‌بندی انجام نشد. دوباره تلاش کن.");
        return;
      }
      toast.success("دسته‌بندی اضافه شد.");
      formRef.current?.reset();
      setKind("EXPENSE");
      setIcon(defaultCategoryIcon("EXPENSE"));
      onSuccess?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="icon" value={icon} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-name">نام دسته‌بندی</Label>
        <Input
          id="category-name"
          name="name"
          placeholder="مثلاً خرید کتاب"
          required
          maxLength={40}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-kind">نوع</Label>
        <NativeSelect
          id="category-kind"
          name="kind"
          value={kind}
          onChange={(event) => handleKindChange(event.target.value as (typeof KINDS)[number])}
        >
          {KINDS.map((item) => (
            <option key={item} value={item}>
              {TRANSACTION_TYPE_LABEL[item]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">آیکون</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border transition-colors",
                icon === name
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-muted",
              )}
              aria-pressed={icon === name}
              aria-label={CATEGORY_ICON_LABEL[name]}
            >
              <CategoryIcon name={name} />
            </button>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال افزودن…" : "افزودن"}
      </Button>
    </form>
  );
}

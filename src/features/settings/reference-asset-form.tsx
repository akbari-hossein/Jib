"use client";

import { useActionState, useState } from "react";
import { updateReferenceAssetPreference } from "@/server/actions/reference-asset";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  REFERENCE_ASSET_OPTION_LABEL,
  REFERENCE_ASSET_TYPES,
  type ReferenceAssetType,
} from "@/lib/finance/purchasing-power";

export function ReferenceAssetForm({
  preference,
}: {
  preference: ReferenceAssetType | null;
}) {
  const [state, action, pending] = useActionState(updateReferenceAssetPreference, undefined);
  const [enabled, setEnabled] = useState(preference != null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="enabled"
          value="on"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-1 size-4 accent-primary"
        />
        <span>
          <span className="text-sm font-medium">نمایش معادل ارزش (دلار، سکه، طلا، نقره)</span>
          <span className="mt-1 block text-xs leading-6 text-muted-foreground">
            کنار مبلغ تومان، ارزش معادل یک دارایی مرجع را نشان می‌دهد. نرخ‌ها از بازار خوانده
            می‌شوند؛ اگر نرخی موجود نباشد، خط دوم نمایش داده نمی‌شود.
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="referenceAsset">دارایی مرجع</Label>
          <NativeSelect
            id="referenceAsset"
            name="asset"
            defaultValue={preference ?? "GOLD_COIN"}
          >
            {REFERENCE_ASSET_TYPES.map((asset) => (
              <option key={asset} value={asset}>
                {REFERENCE_ASSET_OPTION_LABEL[asset]}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : (
        <input type="hidden" name="asset" value="" />
      )}

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-income">ذخیره شد.</p> : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ذخیره معادل ارزش"}
      </Button>
    </form>
  );
}

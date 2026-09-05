"use client";

import { useActionState, useTransition } from "react";
import { setMuteAll, toggleNotificationRule, updateNotificationPreferences } from "@/server/actions/notifications";
import { PushToggle } from "@/features/notifications/push-toggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { toPersianDigits } from "@/lib/currency/format";
import type { NotificationSettingsDto } from "@/server/queries/notifications";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function hourLabel(hour: number) {
  return `${toPersianDigits(String(hour).padStart(2, "0"))}:۰۰`;
}

export function NotificationSettings({ settings }: { settings: NotificationSettingsDto }) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, undefined);
  const [mutePending, startMuteTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">سکوت کامل</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              هیچ اعلان تازه‌ای ساخته نمی‌شود. تاریخچه قبلی می‌ماند.
            </p>
          </div>
          <Switch
            checked={settings.muteAll}
            disabled={mutePending}
            aria-label="سکوت کامل"
            onClick={() => {
              startMuteTransition(() => {
                void setMuteAll(!settings.muteAll);
              });
            }}
          />
        </div>
        <form action={action} className="flex flex-col gap-6">

          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quietHoursStart">شروع ساعت آرام</Label>
              <NativeSelect
                id="quietHoursStart"
                name="quietHoursStart"
                defaultValue={settings.quietHoursStart == null ? "" : String(settings.quietHoursStart)}
              >
                <option value="">خاموش</option>
                {HOURS.map((hour) => (
                  <option key={`qs-${hour}`} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quietHoursEnd">پایان ساعت آرام</Label>
              <NativeSelect
                id="quietHoursEnd"
                name="quietHoursEnd"
                defaultValue={settings.quietHoursEnd == null ? "" : String(settings.quietHoursEnd)}
              >
                <option value="">خاموش</option>
                {HOURS.map((hour) => (
                  <option key={`qe-${hour}`} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs leading-6 text-foreground/45">
                در این بازه اعلان مرورگر نمی‌رود؛ داخل برنامه ثبت می‌شود.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="eveningHour">یادآوری ثبت‌نکردن</Label>
              <NativeSelect id="eveningHour" name="eveningHour" defaultValue={String(settings.eveningHour)}>
                {HOURS.map((hour) => (
                  <option key={`ev-${hour}`} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dailyAllowanceHour">ساعت سهم امروز</Label>
              <NativeSelect
                id="dailyAllowanceHour"
                name="dailyAllowanceHour"
                defaultValue={String(settings.dailyAllowanceHour)}
              >
                {HOURS.map((hour) => (
                  <option key={`da-${hour}`} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {state?.ok ? <p className="text-sm text-income">ذخیره شد.</p> : null}
          <Button type="submit" variant="secondary" disabled={pending} className="w-full">
            {pending ? "در حال ذخیره…" : "ذخیره زمان‌ها"}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <PushToggle vapidPublicKey={settings.vapidPublicKey} initiallySubscribed={settings.hasPushSubscription} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">چه چیزی یادآوری شود</h2>
        {settings.items.map((item) => (
          <RuleToggle key={item.key} item={item} />
        ))}
      </section>
    </div>
  );
}

function RuleToggle({
  item,
}: {
  item: NotificationSettingsDto["items"][number];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-border bg-card px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </div>
      <Switch
        checked={item.enabled}
        disabled={pending}
        aria-label={item.title}
        onClick={() => {
          startTransition(() => {
            void toggleNotificationRule(item.key, !item.enabled);
          });
        }}
      />
    </div>
  );
}

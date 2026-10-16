"use client";

import { useState } from "react";
import { Check, Copy, Gift, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Summary = {
  referralCode: string;
  successfulCount: number;
  referrals: Array<{ createdAt: string; requestedDays: number; grantedDays: number }>;
  annualGrantedDays: number;
  annualCapDays: number;
  progressCount: number;
  nextRewardDays: number;
};

export function ReferralCard({ summary, signupUrl }: { summary: Summary; signupUrl: string }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${signupUrl}?ref=${encodeURIComponent(summary.referralCode)}`;

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(summary.referralCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Gift className="size-5 text-primary" />
        <h2 className="text-base font-semibold">معرفی دوستان</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        دوستت با کد تو ۷ روز Trial اضافه می‌گیرد؛ تو هم با هر سه دعوت موفق ۳۰ روز پاداش می‌گیری.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <code dir="ltr" className="flex-1 rounded-xl bg-surface-muted px-3 py-3 text-center font-semibold tracking-widest">
          {summary.referralCode}
        </code>
        <Button type="button" variant="outline" onClick={copyCode} aria-label="کپی کد معرفی">
          {copied ? <Check /> : <Copy />}
          کد
        </Button>
        <Button type="button" variant="outline" onClick={copyInvite} aria-label="کپی لینک دعوت">
          <Link2 />
          لینک
        </Button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-surface-muted p-3">
          <p className="text-xs text-muted-foreground">دعوت‌های موفق</p>
          <p className="mt-1 font-semibold">{summary.successfulCount}</p>
        </div>
        <div className="rounded-2xl bg-surface-muted p-3">
          <p className="text-xs text-muted-foreground">پاداش این سال</p>
          <p className="mt-1 font-semibold">{summary.annualGrantedDays} از {summary.annualCapDays} روز</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>پیشرفت چرخهٔ بعدی</span>
          <span>{summary.progressCount} از ۳ · پاداش بعدی {Math.max(0, summary.nextRewardDays)} روز</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(summary.progressCount / 3) * 100}%` }} />
        </div>
      </div>
      <ul className="mt-5 space-y-2 border-t border-border pt-4">
        {summary.referrals.length ? summary.referrals.map((referral, index) => (
          <li key={`${referral.createdAt}-${index}`} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground"><Link2 className="size-3.5" />دعوت موفق · {new Date(referral.createdAt).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}</span>
            <span>{referral.grantedDays} از {referral.requestedDays} روز پاداش</span>
          </li>
        )) : <li className="text-xs text-muted-foreground">هنوز دعوت موفقی ثبت نشده است.</li>}
      </ul>
    </section>
  );
}

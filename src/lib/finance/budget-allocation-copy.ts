import { formatToman } from "@/lib/currency/format";

export function categoryBudgetOverCopy(remaining: bigint): string {
  if (remaining <= 0n) {
    return "برای این دسته‌بندی بودجه‌ای باقی نمانده. اول سقف بعضی دسته‌ها را کم کن.";
  }
  return `حداکثر می‌تونی ${formatToman(remaining)} برای این دسته‌بندی اختصاص بدی.`;
}

export function overallBelowAllocatedCopy(allocated: bigint, overall: bigint): string {
  return `بودجه دسته‌بندی‌ها در مجموع ${formatToman(allocated)} است، اما بودجه کل را روی ${formatToman(overall)} گذاشتی. برای کاهش بودجه کل، اول باید بودجه بعضی دسته‌بندی‌ها را کم کنی.`;
}

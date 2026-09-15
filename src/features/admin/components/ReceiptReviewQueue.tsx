import { EmptyState } from "@/components/empty-state";
import {
  ReceiptReviewCard,
  type AdminReceiptItem,
} from "@/features/admin/components/ReceiptReviewCard";

export function ReceiptReviewQueue({ receipts }: { receipts: AdminReceiptItem[] }) {
  if (receipts.length === 0) {
    return (
      <EmptyState
        title="رسید در انتظاری نیست"
        description="وقتی کاربری رسید واریز بفرستد، اینجا به ترتیب قدیمی‌ترین نمایش داده می‌شود."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {receipts.map((receipt) => (
        <li key={receipt.id}>
          <ReceiptReviewCard receipt={receipt} />
        </li>
      ))}
    </ul>
  );
}

import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { ReceiptReviewQueue } from "@/features/admin/components/ReceiptReviewQueue";
import { requireAdmin } from "@/lib/auth/admin";
import { parseReceiptImageUrl } from "@/lib/storage/receipt-images";
import { listAdminReceipts } from "@/server/services/subscription";

export const metadata = { title: "رسیدها" };

export default async function AdminReceiptsPage() {
  await requireAdmin();
  const receipts = await listAdminReceipts("PENDING");

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader
        title="رسیدهای در انتظار"
        description="تأیید یا رد رسید یک تصمیم انسانی است. هیچ بررسی خودکاری روی مبلغ یا اصالت انجام نمی‌شود."
      />
      <ReceiptReviewQueue
        receipts={receipts.map((receipt) => {
          const parsed = receipt.imageUrl ? parseReceiptImageUrl(receipt.imageUrl) : null;
          return {
            id: receipt.id,
            type: receipt.type,
            createdAt: receipt.createdAt.toISOString(),
            claimedAmount: receipt.claimedAmount,
            claimedTransferDate: receipt.claimedTransferDate?.toISOString() ?? null,
            imageUrl: parsed ? `/api/subscription/receipts/files/${parsed.key}` : null,
            rawText: receipt.rawText,
            user: {
              id: receipt.user.id,
              name: receipt.user.name,
              phone: receipt.user.email,
            },
          };
        })}
      />
    </main>
  );
}

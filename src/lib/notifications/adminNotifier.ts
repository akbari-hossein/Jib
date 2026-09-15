import { formatJalaliAbsolute } from "@/lib/admin/format";

export type NewReceiptNotice = {
  id: string;
  userId: string;
  userPhone: string;
  type: "IMAGE" | "TEXT";
  createdAt: Date;
};

function telegramEndpoint(token: string) {
  return `https://api.telegram.org/bot${token}/sendMessage`;
}

function receiptTypeLabel(type: NewReceiptNotice["type"]) {
  return type === "IMAGE" ? "عکس" : "متن";
}

export function formatAdminReceiptMessage(receipt: NewReceiptNotice): string {
  const jalaliDate = formatJalaliAbsolute(receipt.createdAt);
  return [
    "رسید جدید ثبت شد.",
    `کاربر: ${receipt.userPhone}`,
    `نوع: ${receiptTypeLabel(receipt.type)}`,
    `زمان: ${jalaliDate}`,
    "برای بررسی وارد پنل مدیریت شو.",
  ].join("\n");
}

async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    return;
  }

  const response = await fetch(telegramEndpoint(token), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`TELEGRAM_SEND_FAILED:${response.status}`);
  }
}

/**
 * MVP: Telegram Bot API.
 * TODO: add an email-based notifier (Resend) if/when email infra exists. Do not block receipt creation on notify failure.
 */
export async function notifyAdminNewReceipt(receipt: NewReceiptNotice): Promise<void> {
  try {
    await sendTelegramMessage(formatAdminReceiptMessage(receipt));
  } catch (error) {
    console.error("admin receipt notify failed", {
      receiptId: receipt.id,
      reason: error instanceof Error ? error.name : "unknown",
    });
  }
}

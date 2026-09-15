import { z } from "zod";
import {
  MAX_RECEIPT_TEXT_LENGTH,
  MIN_RECEIPT_TEXT_LENGTH,
} from "@/lib/subscription/constants";

export const receiptSubmissionSchema = z
  .object({
    type: z.enum(["IMAGE", "TEXT"]),
    imageUrl: z.string().min(1).max(500).optional(),
    rawText: z.string().min(MIN_RECEIPT_TEXT_LENGTH).max(MAX_RECEIPT_TEXT_LENGTH).optional(),
    claimedAmount: z.number().int().positive().optional(),
    claimedTransferDate: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "تاریخ واریز معتبر نیست.")
      .optional(),
  })
  .refine((data) => (data.type === "IMAGE" ? Boolean(data.imageUrl) : Boolean(data.rawText)), {
    message: "مدرک پرداخت (عکس یا متن) الزامی است.",
  });

export type ReceiptSubmissionInput = z.infer<typeof receiptSubmissionSchema>;

export const receiptRejectSchema = z.object({
  reasonCode: z.enum(["AMOUNT_MISMATCH", "UNREADABLE", "WRONG_DESTINATION", "DUPLICATE", "OTHER"]),
});

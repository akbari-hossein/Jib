import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/plan";
import { jalaliFromInstant } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { TRANSACTION_TYPE_LABEL } from "@/lib/labels";

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

function jalaliNumeric(date: Date): string {
  const jalali = jalaliFromInstant(date);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${jalali.year}/${pad(jalali.month)}/${pad(jalali.day)}`;
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }
  if (!hasFeature(user.plan, "export")) {
    return NextResponse.redirect(new URL("/pricing", origin));
  }

  const rows = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true, account: true, toAccount: true },
    orderBy: { occurredAt: "desc" },
  });

  const header = ["تاریخ", "نوع", "مبلغ (تومان)", "دسته", "حساب", "فروشنده", "یادداشت"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        jalaliNumeric(row.occurredAt),
        TRANSACTION_TYPE_LABEL[row.type],
        row.amount.toString(),
        row.category?.name ?? "",
        row.type === "TRANSFER"
          ? `${row.account.name} → ${row.toAccount?.name ?? ""}`
          : row.account.name,
        row.merchant ?? "",
        row.note ?? "",
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const body = `\uFEFF${lines.join("\n")}\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jib-transactions.csv"',
      "Cache-Control": "no-store",
    },
  });
}

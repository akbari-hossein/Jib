import type { DebtStatus, DebtType } from "@prisma/client";
import {
  calculateContactBalance,
  calculateTotalIOwe,
  calculateTotalOwedToMe,
  type ContactBalance,
} from "@/lib/finance/debts";
import { prisma } from "@/lib/db/prisma";

const openStatus = { not: "SETTLED" as const };

export type DangContactRow = {
  id: string;
  name: string;
  color: string | null;
  openCount: number;
  balance: ContactBalance;
};

export type DangSummary = {
  owedToMe: bigint;
  iOwe: bigint;
  contacts: DangContactRow[];
};

export async function listDebtRecords(
  userId: string,
  filters?: { status?: DebtStatus; contactId?: string; type?: DebtType },
) {
  return prisma.debtRecord.findMany({
    where: {
      userId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.contactId ? { contactId: filters.contactId } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    include: { contact: { select: { id: true, name: true, color: true } } },
    orderBy: { date: "desc" },
  });
}

export async function listOpenDebtSnapshots(userId: string) {
  return prisma.debtRecord.findMany({
    where: { userId, status: openStatus },
    select: { type: true, remainingAmount: true, status: true },
  });
}

export async function getDangImpactAmounts(userId: string) {
  const records = await listOpenDebtSnapshots(userId);
  return {
    owedToMe: calculateTotalOwedToMe(records),
    iOwe: calculateTotalIOwe(records),
  };
}

export async function listContacts(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export async function getDangSummary(userId: string): Promise<DangSummary> {
  const [openRecords, contacts] = await Promise.all([
    prisma.debtRecord.findMany({
      where: { userId, status: openStatus },
      select: {
        contactId: true,
        type: true,
        remainingAmount: true,
        status: true,
      },
    }),
    prisma.contact.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const owedToMe = calculateTotalOwedToMe(openRecords);
  const iOwe = calculateTotalIOwe(openRecords);
  const byContact = new Map<string, typeof openRecords>();
  for (const record of openRecords) {
    const list = byContact.get(record.contactId) ?? [];
    list.push(record);
    byContact.set(record.contactId, list);
  }

  const rows: DangContactRow[] = contacts.map((contact) => {
    const records = byContact.get(contact.id) ?? [];
    return {
      id: contact.id,
      name: contact.name,
      color: contact.color,
      openCount: records.length,
      balance: calculateContactBalance(records),
    };
  });

  rows.sort((left, right) => {
    const leftOpen = left.balance.direction === "SETTLED" ? 1 : 0;
    const rightOpen = right.balance.direction === "SETTLED" ? 1 : 0;
    if (leftOpen !== rightOpen) {
      return leftOpen - rightOpen;
    }
    if (left.balance.netAmount === right.balance.netAmount) {
      return left.name.localeCompare(right.name, "fa");
    }
    return left.balance.netAmount > right.balance.netAmount ? -1 : 1;
  });

  return { owedToMe, iOwe, contacts: rows };
}

export type ContactTimelineItem =
  | {
      kind: "debt";
      id: string;
      type: DebtType;
      status: DebtStatus;
      originalAmount: string;
      remainingAmount: string;
      reason: string | null;
      date: string;
      splitTitle: string | null;
    }
  | {
      kind: "settlement";
      id: string;
      debtId: string;
      amount: string;
      date: string;
      note: string | null;
    };

export type ContactDetailDto = {
  contact: { id: string; name: string; color: string | null; note: string | null };
  balance: ContactBalance;
  timeline: ContactTimelineItem[];
  openDebts: Array<{
    id: string;
    type: DebtType;
    remainingAmount: string;
    reason: string | null;
  }>;
};

export async function getContactDetail(
  userId: string,
  contactId: string,
): Promise<ContactDetailDto | null> {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    include: {
      debtRecords: {
        include: {
          settlements: { orderBy: { date: "desc" } },
          splitBill: { select: { title: true } },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!contact) {
    return null;
  }

  const balance = calculateContactBalance(contact.debtRecords);
  const timeline: ContactTimelineItem[] = [];

  for (const debt of contact.debtRecords) {
    timeline.push({
      kind: "debt",
      id: debt.id,
      type: debt.type,
      status: debt.status,
      originalAmount: debt.originalAmount.toString(),
      remainingAmount: debt.remainingAmount.toString(),
      reason: debt.reason,
      date: debt.date.toISOString(),
      splitTitle: debt.splitBill?.title ?? null,
    });
    for (const settlement of debt.settlements) {
      timeline.push({
        kind: "settlement",
        id: settlement.id,
        debtId: debt.id,
        amount: settlement.amount.toString(),
        date: settlement.date.toISOString(),
        note: settlement.note,
      });
    }
  }

  timeline.sort((left, right) => right.date.localeCompare(left.date));

  return {
    contact: {
      id: contact.id,
      name: contact.name,
      color: contact.color,
      note: contact.note,
    },
    balance,
    timeline,
    openDebts: contact.debtRecords
      .filter((debt) => debt.status !== "SETTLED")
      .map((debt) => ({
        id: debt.id,
        type: debt.type,
        remainingAmount: debt.remainingAmount.toString(),
        reason: debt.reason,
      })),
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { parseJalaliForm } from "@/lib/dates/jalali-form";
import { gregorianUtcFromJalali } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { SettlementError, calculateContactBalance, splitAmountEvenly } from "@/lib/finance/debts";
import { parseTomanInput } from "@/lib/validation/money";
import {
  contactNameSchema,
  debtReasonSchema,
  debtTypeSchema,
  splitMethodSchema,
  splitTitleSchema,
} from "@/lib/validation/debts";
import {
  createDebtRecord,
  createSplitBillWithDebts,
  deleteOpenDebtRecord,
  resolveOrCreateContact,
  settleDebtRecord,
  settleDebtsInOrder,
  type ResolvedParticipant,
} from "@/server/services/debts";
import {
  assertAccountOwned,
  assertContactOwned,
  assertDebtRecordOwned,
  OwnershipError,
  userFacingMutationError,
} from "@/server/services/ownership";
import { isWriteBlocked, writeBlockedState } from "@/server/services/subscription";

export type DebtActionState = {
  ok: boolean;
  error?: string;
};

function revalidateDang() {
  revalidatePath("/dang");
  revalidatePath("/dang", "layout");
  revalidatePath("/home");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/reports");
}

function parseOptionalAccountId(raw: string): string | null {
  const value = raw.trim();
  return value ? value : null;
}

function settlementCopy(error: unknown): string {
  if (error instanceof SettlementError) {
    if (error.code === "OVERPAYMENT") {
      return "مبلغ از باقیمانده بیشتر است.";
    }
    if (error.code === "ALREADY_SETTLED") {
      return "این دنگ تسویه شده.";
    }
    return "مبلغ تسویه معتبر نیست.";
  }
  if (error instanceof OwnershipError || (error instanceof Error && error.message === "NOT_OWNED")) {
    return "این مورد در دسترس نیست.";
  }
  if (error instanceof Error && error.message === "CONTACT_REQUIRED") {
    return "نام فرد را وارد کن.";
  }
  if (error instanceof Error && error.message === "HAS_SETTLEMENTS") {
    return "این دنگ تسویه دارد و حذف نمی‌شود.";
  }
  if (error instanceof Error && error.message === "SPLIT_MISMATCH") {
    return "جمع سهم‌ها با مبلغ کل یکی نیست.";
  }
  if (error instanceof Error && error.message === "INACTIVE_ACCOUNT") {
    return "این حساب فعال نیست.";
  }
  return userFacingMutationError(error, "ذخیره انجام نشد. دوباره تلاش کن.");
}

async function parseOwnedAccount(userId: string, accountId: string | null) {
  if (!accountId) {
    return null;
  }
  const account = await assertAccountOwned(userId, accountId);
  if (!account.isActive) {
    throw new Error("INACTIVE_ACCOUNT");
  }
  return account.id;
}

export async function createContact(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const name = contactNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!name.success) {
    return { ok: false, error: "نام فرد را وارد کن." };
  }

  try {
    await prisma.$transaction(async (db) => {
      await resolveOrCreateContact(db, user.id, { name: name.data });
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

export async function createDebt(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const typeResult = debtTypeSchema.safeParse(String(formData.get("type") ?? ""));
  const amount = parseTomanInput(String(formData.get("amount") ?? ""));
  const contactId = String(formData.get("contactId") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const date = parseJalaliForm(formData, "date");
  const accountId = parseOptionalAccountId(String(formData.get("accountId") ?? ""));

  if (!typeResult.success) {
    return { ok: false, error: "نوع دنگ معتبر نیست." };
  }
  if (amount === null) {
    return { ok: false, error: "مبلغ را وارد کن." };
  }
  if (!contactId && !contactName) {
    return { ok: false, error: "نام فرد را وارد کن." };
  }
  if (reasonRaw) {
    const reason = debtReasonSchema.safeParse(reasonRaw);
    if (!reason.success) {
      return { ok: false, error: "توضیح کوتاه‌تری بنویس." };
    }
  }
  if (!date.ok || !date.value) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }

  try {
    await parseOwnedAccount(user.id, accountId);
    await prisma.$transaction(async (db) => {
      const contact = await resolveOrCreateContact(db, user.id, {
        contactId: contactId || null,
        name: contactName || null,
      });
      await createDebtRecord(db, {
        userId: user.id,
        contactId: contact.id,
        type: typeResult.data,
        amount,
        reason: reasonRaw || null,
        date: gregorianUtcFromJalali(date.value!),
        accountId,
      });
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

type SplitParticipantInput = {
  contactId?: string;
  name?: string;
  amount?: string;
};

export async function createSplitBill(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const title = splitTitleSchema.safeParse(String(formData.get("title") ?? ""));
  const totalAmount = parseTomanInput(String(formData.get("totalAmount") ?? ""));
  const paidByMe = String(formData.get("paidByMe") ?? "true") !== "false";
  const method = splitMethodSchema.safeParse(String(formData.get("method") ?? "EQUAL"));
  const date = parseJalaliForm(formData, "date");
  const accountId = parseOptionalAccountId(String(formData.get("accountId") ?? ""));
  const payerContactId = String(formData.get("payerContactId") ?? "").trim();
  const includeMe = String(formData.get("includeMe") ?? "true") !== "false";

  let participants: SplitParticipantInput[] = [];
  try {
    const raw = String(formData.get("participants") ?? "[]");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "لیست افراد معتبر نیست." };
    }
    participants = parsed as SplitParticipantInput[];
  } catch {
    return { ok: false, error: "لیست افراد معتبر نیست." };
  }

  if (!title.success) {
    return { ok: false, error: "عنوان را وارد کن." };
  }
  if (totalAmount === null) {
    return { ok: false, error: "مبلغ کل را وارد کن." };
  }
  if (!method.success) {
    return { ok: false, error: "روش تقسیم معتبر نیست." };
  }
  if (!date.ok || !date.value) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }
  if (participants.length < 1) {
    return { ok: false, error: "حداقل یک نفر دیگر را اضافه کن." };
  }

  const occurredAt = gregorianUtcFromJalali(date.value);
  const headCount = includeMe ? participants.length + 1 : participants.length;
  if (headCount < 2) {
    return { ok: false, error: "حداقل یک نفر دیگر را اضافه کن." };
  }

  try {
    if (paidByMe) {
      await parseOwnedAccount(user.id, accountId);
    }

    await prisma.$transaction(async (db) => {
      const resolved: ResolvedParticipant[] = [];
      for (const participant of participants) {
        const contact = await resolveOrCreateContact(db, user.id, {
          contactId: participant.contactId ?? null,
          name: participant.name ?? null,
        });
        resolved.push({
          contactId: contact.id,
          name: contact.name,
          share: 0n,
        });
      }

      if (method.data === "EQUAL") {
        const shares = splitAmountEvenly(totalAmount, headCount);
        const otherShares = includeMe ? shares.slice(1) : shares;
        const myShare = includeMe ? shares[0]! : 0n;
        for (let index = 0; index < resolved.length; index += 1) {
          resolved[index]!.share = otherShares[index] ?? 0n;
        }
        await createSplitBillWithDebts(db, {
          userId: user.id,
          title: title.data,
          totalAmount,
          date: occurredAt,
          paidByMe,
          accountId: paidByMe ? accountId : null,
          myShare,
          others: resolved,
          payerContactId: paidByMe
            ? null
            : resolved.find((item) => item.contactId === payerContactId || item.name === payerContactId)
                ?.contactId ?? resolved[0]!.contactId,
        });
        return;
      }

      const customShares: bigint[] = [];
      for (const participant of participants) {
        const share = parseTomanInput(String(participant.amount ?? ""), { allowZero: true });
        if (share === null) {
          throw new Error("SPLIT_MISMATCH");
        }
        customShares.push(share);
      }
      const othersTotal = customShares.reduce((sum, share) => sum + share, 0n);
      const myShareRaw = String(formData.get("myShare") ?? "");
      const myShare = includeMe
        ? parseTomanInput(myShareRaw, { allowZero: true })
        : 0n;
      if (myShare === null) {
        throw new Error("SPLIT_MISMATCH");
      }
      if (myShare + othersTotal !== totalAmount) {
        throw new Error("SPLIT_MISMATCH");
      }
      for (let index = 0; index < resolved.length; index += 1) {
        resolved[index]!.share = customShares[index] ?? 0n;
      }
      await createSplitBillWithDebts(db, {
        userId: user.id,
        title: title.data,
        totalAmount,
        date: occurredAt,
        paidByMe,
        accountId: paidByMe ? accountId : null,
        myShare,
        others: resolved,
          payerContactId: paidByMe
            ? null
            : resolved.find((item) => item.contactId === payerContactId || item.name === payerContactId)
                ?.contactId ?? resolved[0]!.contactId,
      });
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

export async function settleDebt(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const id = String(formData.get("id") ?? "").trim();
  const amount = parseTomanInput(String(formData.get("amount") ?? ""));
  const accountId = parseOptionalAccountId(String(formData.get("accountId") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;
  const date = parseJalaliForm(formData, "date");

  if (!id) {
    return { ok: false, error: "دنگ پیدا نشد." };
  }
  if (amount === null) {
    return { ok: false, error: "مبلغ را وارد کن." };
  }
  if (!date.ok || !date.value) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }

  try {
    await parseOwnedAccount(user.id, accountId);
    const debt = await assertDebtRecordOwned(user.id, id);
    await prisma.$transaction(async (db) => {
      await settleDebtRecord(db, {
        userId: user.id,
        debt,
        amount,
        date: gregorianUtcFromJalali(date.value!),
        accountId,
        note,
      });
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

export async function settleContact(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const contactId = String(formData.get("contactId") ?? "").trim();
  const amount = parseTomanInput(String(formData.get("amount") ?? ""));
  const accountId = parseOptionalAccountId(String(formData.get("accountId") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;
  const date = parseJalaliForm(formData, "date");

  if (!contactId) {
    return { ok: false, error: "فرد پیدا نشد." };
  }
  if (amount === null) {
    return { ok: false, error: "مبلغ را وارد کن." };
  }
  if (!date.ok || !date.value) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }

  try {
    await parseOwnedAccount(user.id, accountId);
    await assertContactOwned(user.id, contactId);
    const debts = await prisma.debtRecord.findMany({
      where: { userId: user.id, contactId, status: { not: "SETTLED" } },
      orderBy: { date: "asc" },
    });
    const balance = calculateContactBalance(debts);
    const directed =
      balance.direction === "SETTLED"
        ? []
        : debts.filter((debt) => debt.type === balance.direction);
    await prisma.$transaction(async (db) => {
      await settleDebtsInOrder(db, {
        userId: user.id,
        debts: directed,
        amount,
        date: gregorianUtcFromJalali(date.value!),
        accountId,
        note,
      });
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

export async function deleteDebt(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (await isWriteBlocked(user.id)) {
    return;
  }
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return;
  }

  const debt = await prisma.debtRecord.findFirst({
    where: { id, userId: user.id },
    include: {
      transaction: true,
      settlements: { include: { transaction: true } },
    },
  });
  if (!debt) {
    throw new OwnershipError();
  }
  try {
    await prisma.$transaction(async (db) => {
      await deleteOpenDebtRecord(db, debt);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "HAS_SETTLEMENTS") {
      return;
    }
    throw error;
  }
  revalidateDang();
}

export async function updateContact(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const id = String(formData.get("id") ?? "").trim();
  const name = contactNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!id) {
    return { ok: false, error: "فرد پیدا نشد." };
  }
  if (!name.success) {
    return { ok: false, error: "نام فرد را وارد کن." };
  }

  try {
    await assertContactOwned(user.id, id);
    await prisma.contact.update({
      where: { id },
      data: { name: name.data },
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

export async function updateDebt(
  _previous: DebtActionState | undefined,
  formData: FormData,
): Promise<DebtActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const id = String(formData.get("id") ?? "").trim();
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  if (!id) {
    return { ok: false, error: "دنگ پیدا نشد." };
  }
  if (reasonRaw) {
    const reason = debtReasonSchema.safeParse(reasonRaw);
    if (!reason.success) {
      return { ok: false, error: "توضیح کوتاه‌تری بنویس." };
    }
  }

  try {
    await assertDebtRecordOwned(user.id, id);
    await prisma.debtRecord.update({
      where: { id },
      data: { reason: reasonRaw || null },
    });
  } catch (error) {
    return { ok: false, error: settlementCopy(error) };
  }

  revalidateDang();
  return { ok: true };
}

export async function deleteContact(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (await isWriteBlocked(user.id)) {
    return;
  }
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return;
  }

  await assertContactOwned(user.id, id);
  const openCount = await prisma.debtRecord.count({
    where: { userId: user.id, contactId: id, status: { not: "SETTLED" } },
  });
  if (openCount > 0) {
    return;
  }
  await prisma.$transaction(async (db) => {
    await db.debtRecord.deleteMany({
      where: { userId: user.id, contactId: id, status: "SETTLED" },
    });
    await db.contact.delete({ where: { id } });
  });
  revalidateDang();
  redirect("/dang");
}

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateOtpCode, generateSessionToken, hashOtp, hashSecret, otpEquals, otpExpiry, sessionExpiry } from "@/lib/auth/crypto";
import { parseIranianMobile } from "@/lib/auth/phone";
import { RateLimitError, assertOtpSendAllowed } from "@/lib/auth/rate-limit";
import {
  clearPendingPhoneCookie,
  clearSessionCookie,
  readPendingPhone,
  readSessionToken,
  requireUser,
  setPendingPhoneCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { OTP_MAX_ATTEMPTS } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import { getSmsProvider } from "@/lib/sms";
import { SYSTEM_CATEGORIES } from "@/server/services/categories";

export type AuthActionState = {
  ok: boolean;
  error?: string;
  devCode?: string;
};

function clientIp(headerList: Headers): string {
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}

export async function sendOtp(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedPhone = parseIranianMobile(String(formData.get("phone") ?? ""));
  if (!parsedPhone.ok) {
    return { ok: false, error: parsedPhone.error };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);

  try {
    assertOtpSendAllowed(parsedPhone.e164, ip);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "ارسال کد انجام نشد. دوباره تلاش کن." };
  }

  const code = generateOtpCode();
  const now = new Date();

  try {
    await prisma.$transaction([
      prisma.otpChallenge.updateMany({
        where: { phone: parsedPhone.e164, consumedAt: null },
        data: { consumedAt: now },
      }),
      prisma.otpChallenge.create({
        data: {
          phone: parsedPhone.e164,
          codeHash: hashOtp(parsedPhone.e164, code),
          expiresAt: otpExpiry(now),
          ip,
        },
      }),
    ]);

    await getSmsProvider().sendOtp(parsedPhone.e164, code);
    await setPendingPhoneCookie(parsedPhone.e164);
  } catch {
    return { ok: false, error: "ارسال کد انجام نشد. دوباره تلاش کن." };
  }

  return {
    ok: true,
    devCode: process.env.NODE_ENV === "development" ? code : undefined,
  };
}

export async function resendOtp(
  previousState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const phone = await readPendingPhone();
  if (!phone) {
    return { ok: false, error: "ابتدا شماره موبایل را وارد کن." };
  }

  formData.set("phone", phone);
  return sendOtp(previousState, formData);
}

export async function verifyOtp(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const phone = await readPendingPhone();
  if (!phone) {
    return { ok: false, error: "ابتدا شماره موبایل را وارد کن." };
  }

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 5) {
    return { ok: false, error: "کد پنج‌رقمی را وارد کن." };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  const now = new Date();

  try {
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge || challenge.expiresAt.getTime() <= now.getTime()) {
      return { ok: false, error: "کد منقضی شده. دوباره بفرست." };
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      return { ok: false, error: "تعداد تلاش‌ها تمام شده. کد جدید بفرست." };
    }

    const expected = hashOtp(phone, code);
    if (!otpEquals(challenge.codeHash, expected)) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, error: "کد درست نیست." };
    }

    const { token, tokenHash } = generateSessionToken();
    const expiresAt = sessionExpiry(now);

    await prisma.$transaction(async (tx) => {
      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: now },
      });

      const user = await tx.user.upsert({
        where: { phone },
        update: {},
        create: {
          phone,
          notificationPref: { create: {} },
          categories: {
            create: SYSTEM_CATEGORIES.map((category) => ({
              name: category.name,
              group: category.group,
              kind: category.kind,
              icon: category.icon,
              isSystem: true,
            })),
          },
        },
      });

      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          ip,
          userAgent: headerList.get("user-agent")?.slice(0, 180),
        },
      });
    });

    await setSessionCookie(token, expiresAt);
    await clearPendingPhoneCookie();
  } catch {
    return { ok: false, error: "ورود انجام نشد. دوباره تلاش کن." };
  }

  redirect("/home");
}

export async function logout() {
  const token = await readSessionToken();
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSecret(token) } });
  }
  await clearSessionCookie();
  redirect("/login");
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "نام را وارد کن.").max(60, "نام خیلی بلند است."),
});

export async function updateProfile(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "نام معتبر نیست." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    });
    revalidatePath("/home");
    revalidatePath("/more");
  } catch {
    return { ok: false, error: "ذخیره نام انجام نشد. دوباره تلاش کن." };
  }

  return { ok: true };
}

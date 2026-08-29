"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { hashSecret } from "@/lib/auth/crypto";
import { loginSchema, signupSchema } from "@/lib/auth/credentials";
import { hashPassword, passwordMatches } from "@/lib/auth/password";
import { RateLimitError, assertLoginAllowed, assertSignupAllowed } from "@/lib/auth/rate-limit";
import { clientIp } from "@/lib/auth/request";
import {
  clearSessionCookie,
  issueSession,
  readSessionToken,
  requireUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createUserWithDefaults } from "@/server/services/users";

export type AuthActionState = {
  ok: boolean;
  error?: string;
};

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "اطلاعات معتبر نیست.";
}

export async function login(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);

  try {
    assertLoginAllowed(parsed.data.email, ip);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "ورود انجام نشد. دوباره تلاش کن." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    const matches = await passwordMatches(parsed.data.password, user?.passwordHash);
    if (!user || !matches) {
      return { ok: false, error: "ایمیل یا رمز عبور اشتباه است." };
    }

    await issueSession(user.id, headerList);
  } catch {
    return { ok: false, error: "ورود انجام نشد. دوباره تلاش کن." };
  }

  redirect("/home");
}

export async function signup(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);

  try {
    assertSignupAllowed(ip);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "ساخت حساب انجام نشد. دوباره تلاش کن." };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUserWithDefaults({
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name ?? null,
    });
    await issueSession(user.id, headerList);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "این ایمیل قبلاً ثبت شده." };
    }
    return { ok: false, error: "ساخت حساب انجام نشد. دوباره تلاش کن." };
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

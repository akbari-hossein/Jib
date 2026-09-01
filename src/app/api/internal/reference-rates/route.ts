import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordRate } from "@/lib/finance/referenceRates";

export const dynamic = "force-dynamic";

const ingestSchema = z.object({
  assetType: z.enum(["USD", "GOLD_COIN", "GOLD_GRAM"]),
  rateToToman: z
    .union([z.number(), z.string()])
    .transform((value, ctx) => {
      const digits = String(value).trim();
      if (!/^[1-9]\d{0,17}$/.test(digits)) {
        ctx.addIssue({ code: "custom", message: "rateToToman must be a positive integer." });
        return z.NEVER;
      }
      return BigInt(digits);
    }),
  source: z.string().trim().min(1).max(64).optional(),
  effectiveAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "effectiveAt must be an ISO date.")
    .optional(),
});

function ingestAuthorized(request: Request): boolean {
  const secret = process.env.REFERENCE_RATE_INGEST_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  const token = header.slice("Bearer ".length);
  const expected = Buffer.from(secret);
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  if (!process.env.REFERENCE_RATE_INGEST_SECRET?.trim()) {
    return NextResponse.json({ error: "Rate ingest is not configured." }, { status: 503 });
  }

  if (!ingestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  const row = await recordRate({
    assetType: parsed.data.assetType,
    rateToToman: parsed.data.rateToToman,
    source: parsed.data.source ?? "manual",
    effectiveAt: parsed.data.effectiveAt ? new Date(parsed.data.effectiveAt) : undefined,
  });

  return NextResponse.json({
    id: row.id,
    assetType: row.assetType,
    rateToToman: row.rateToToman.toString(),
    source: row.source,
    effectiveAt: row.effectiveAt.toISOString(),
  });
}

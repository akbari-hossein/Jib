import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ingestLiveRates } from "@/lib/finance/referenceRates";
import { requestMatchesAnyBearerSecret } from "@/lib/http/bearer-secret";

export const dynamic = "force-dynamic";

function cronAuthorized(request: Request): boolean {
  return requestMatchesAnyBearerSecret(request, [
    process.env.CRON_SECRET,
    process.env.REFERENCE_RATE_INGEST_SECRET,
  ]);
}

function secretsConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET?.trim() || process.env.REFERENCE_RATE_INGEST_SECRET?.trim());
}

async function runIngest() {
  if (!secretsConfigured()) {
    return NextResponse.json({ error: "Rate ingest is not configured." }, { status: 503 });
  }

  const result = await ingestLiveRates();
  if (!result.ok) {
    const status = result.error === "Live rate provider is not configured." ? 503 : 502;
    return NextResponse.json({ error: result.error, skipped: result.skipped }, { status });
  }

  if (!result.skipped && result.recorded.length > 0) {
    revalidatePath("/home");
    revalidatePath("/rates");
    revalidatePath("/accounts");
    revalidatePath("/goals");
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    recorded: result.recorded,
    ignored: result.ignored,
  });
}

export async function GET(request: Request) {
  if (!secretsConfigured()) {
    return NextResponse.json({ error: "Rate ingest is not configured." }, { status: 503 });
  }
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return runIngest();
}

export async function POST(request: Request) {
  return GET(request);
}

const DEFAULT_JUMP_RATIO = 0.3;

export function readImplausibleJumpRatio(env: NodeJS.Dict<string> = process.env): number {
  const raw = env.RATE_IMPLAUSIBLE_JUMP_RATIO?.trim();
  if (raw && /^(?:0?\.\d+|[01](?:\.\d+)?)$/.test(raw)) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0 && value < 1) {
      return value;
    }
  }
  const pct = env.RATE_IMPLAUSIBLE_JUMP_PCT?.trim();
  if (pct && /^[1-9]\d{0,2}$/.test(pct)) {
    const value = Number(pct) / 100;
    if (value > 0 && value < 1) {
      return value;
    }
  }
  return DEFAULT_JUMP_RATIO;
}

/**
 * True when `next` differs from `previous` by more than `ratio` (e.g. 0.3 = 30%).
 * A 10× Rial-as-Toman write is always implausible against a sane previous rate.
 */
export function isImplausibleJump(previous: bigint, next: bigint, ratio: number): boolean {
  if (previous <= 0n || next <= 0n) {
    return false;
  }
  if (previous === next) {
    return false;
  }
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return false;
  }
  const larger = previous > next ? previous : next;
  const smaller = previous > next ? next : previous;
  const diff = larger - smaller;
  const basisPoints = BigInt(Math.round(ratio * 10_000));
  if (basisPoints <= 0n) {
    return false;
  }
  return diff * 10_000n > previous * basisPoints;
}

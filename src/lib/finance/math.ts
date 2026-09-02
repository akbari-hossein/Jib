/** Integer ceiling division. Returns 0 when the denominator is zero or negative. */
export function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    return 0n;
  }
  return (numerator + denominator - 1n) / denominator;
}

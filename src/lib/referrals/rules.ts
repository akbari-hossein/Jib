const REWARD_DAYS = [7, 7, 16] as const;
export const REFERRAL_ANNUAL_CAP_DAYS = 90;

export function daysForReferralNumber(number: number) {
  return REWARD_DAYS[(number - 1) % REWARD_DAYS.length]!;
}

export function capReferralReward(requestedDays: number, alreadyGrantedDays: number) {
  return Math.min(requestedDays, Math.max(0, REFERRAL_ANNUAL_CAP_DAYS - alreadyGrantedDays));
}

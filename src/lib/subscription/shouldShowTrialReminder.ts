export function shouldShowTrialReminder(daysRemaining: number): boolean {
  return daysRemaining === 3 || daysRemaining === 1;
}

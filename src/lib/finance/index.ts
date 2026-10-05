export {
  calculateAvailableMoney,
  sumLiquidBalance,
  sumPlannedExpenses,
  sumReservedForGoals,
} from "@/lib/finance/available-money";
export {
  calculateDepositInterest,
} from "@/lib/finance/depositCalculations";
export type {
  DepositCalculatorInput,
  DepositCalculatorResult,
} from "@/lib/finance/depositCalculations";
export {
  calculateEqualInstallmentAmount,
  calculateLoan,
  calculateQarzAlHasanehLoan,
  calculateStandardLoan,
  periodicRateFromAnnual,
} from "@/lib/finance/loanCalculations";
export type {
  AmortizationRow,
  LoanCalculationMode,
  LoanCalculatorInput,
  LoanCalculatorResult,
} from "@/lib/finance/loanCalculations";
export {
  applySettlement,
  calculateContactBalance,
  calculateDebtImpactOnAvailableMoney,
  calculateTotalIOwe,
  calculateTotalOwedToMe,
  planSettlementAllocation,
  splitAmountEvenly,
  SettlementError,
  SplitError,
} from "@/lib/finance/debts";
export type {
  ContactBalance,
  ContactBalanceDirection,
  DebtSnapshot,
} from "@/lib/finance/debts";
export { calculateBudgetUsage } from "@/lib/finance/budget-usage";
export {
  isCategoryLimitAllowed,
  isOverallLimitAllowed,
  remainingAllocatable,
  sumBudgetLimits,
} from "@/lib/finance/budget-allocation";
export { assembleDashboard } from "@/lib/finance/dashboard";
export { getCalendarMonthData, jalaliDateKey, jalaliMonthRange } from "@/lib/finance/calendar-month";
export type {
  CalendarDayTotals,
  CalendarMonthData,
  CalendarMonthDay,
  CalendarMonthEvent,
} from "@/lib/finance/calendar-month";
export { getTodaySummary, timeOfDayFromNow, UPCOMING_RECURRING_HORIZON_DAYS } from "@/lib/finance/today-summary";
export type {
  CalendarEventSummary,
  GoalProgressSummary,
  TimeOfDay,
  TodaySummary,
  UpcomingFinancialEvent,
} from "@/lib/finance/today-summary";
export { calculateDailyAllowance } from "@/lib/finance/daily-allowance";
export { calculateGoalProgress } from "@/lib/finance/goal-progress";
export { calculateMonthlyChange } from "@/lib/finance/monthly-change";
export type { MonthlyChange } from "@/lib/finance/monthly-change";
export { ceilDiv } from "@/lib/finance/math";
export { simulateGoalCompletion, simulateHypotheticalExpense } from "@/lib/finance/whatIf";
export type {
  GoalCompletionSimulation,
  GoalWhatIfInput,
  HypotheticalExpenseInput,
  HypotheticalExpenseResult,
} from "@/lib/finance/whatIf";
export {
  assembleMonthlyRecap,
  availableRecapFields,
  budgetDiscipline,
  defaultRecapSelection,
  pickMovedGoal,
  serializeMonthlyRecap,
  summarizeLoggedDays,
} from "@/lib/finance/monthly-recap-data";
export type {
  MonthlyRecapData,
  MonthlyRecapDto,
  RecapFieldId,
  RecapSelection,
} from "@/lib/finance/monthly-recap-data";
export { assemblePeriodReview, rankCategorySpend } from "@/lib/finance/reports";
export type { CategorySpend, PeriodReview, RankedCategory } from "@/lib/finance/reports";
export {
  aggregateMonthlyFlows,
  getCategoryBreakdown,
  getMonthComparisonData,
  getMonthlyTrendData,
  getSavingsRateSeries,
  listChartMonthWindow,
  serializeReportCharts,
  REPORT_TREND_MONTHS,
} from "@/lib/finance/report-charts";
export type {
  ChartTransaction,
  MonthlyFlow,
  ReportChartsDto,
} from "@/lib/finance/report-charts";
export { calculateRequiredSavings } from "@/lib/finance/required-savings";
export {
  checkBudgetThreshold,
  checkDailyAllowanceStatus,
  checkGoalMilestone,
  checkNoTransactionToday,
  checkSpendingPaceAnomaly,
  checkUpcomingRecurringExpense,
  collectNotifications,
} from "@/lib/finance/notificationRules";
export type { FinanceNotification } from "@/lib/finance/notificationRules";
export { matchTransactionRule } from "@/lib/finance/rules";
export type { RuleSnapshot } from "@/lib/finance/rules";
export { calculateSavingsRate } from "@/lib/finance/savings-rate";
export {
  EMERGENCY_FUND_HISTORY_MONTHS,
  EMERGENCY_FUND_MAX_TARGET_MONTHS,
  EMERGENCY_FUND_MIN_HISTORY_MONTHS,
  EMERGENCY_FUND_TARGET_MONTH_PRESETS,
  assembleEmergencyFund,
  averageMonthlySavingsFromFlows,
  buildEssentialMonthlyBuckets,
  calculateEmergencyFundProgress,
  calculateEmergencyFundTarget,
  calculateEssentialMonthlyAverage,
  calculateMonthsToTarget,
  emergencyFundMonthKey,
  resolveEssentialMonthlyAverage,
} from "@/lib/finance/emergencyFund";
export type {
  CategoryMonthTotal,
  EmergencyFundProgress,
  EssentialSpendTransaction,
  MonthlyFlowAmounts,
  MonthlySpendBucket,
  MonthsToTarget,
} from "@/lib/finance/emergencyFund";
export {
  calculateBudgetAdherenceScore,
  calculateDebtBurdenScore,
  calculateEmergencyFundScore,
  calculateFinancialHealthScore,
  calculateSavingsRateScore,
  calculateSpendingConsistencyScore,
  combineWeightedScores,
  monthlyEquivalentAmount,
  SCORE_WEIGHTS,
} from "@/lib/finance/financial-health-score";
export type {
  BudgetUsageInput,
  FinancialHealthInput,
  FinancialHealthResult,
  ScoreComponentKey,
  SubScoreResult,
} from "@/lib/finance/financial-health-score";
export {
  assembleFinancialHealthInput,
  computeHealthFromSource,
} from "@/lib/finance/financial-health-input";
export {
  formatScoreExplanation,
  HEALTH_SCORE_COPY,
  SCORE_COMPONENT_LABEL,
  scoreDeltaCopy,
} from "@/lib/finance/financial-health-copy";
export type {
  AccountSnapshot,
  AvailableMoneyInput,
  BudgetSnapshot,
  BudgetStatus,
  DailyAllowanceInput,
  GoalProgressInput,
  GoalSnapshot,
  PlannedExpenseSnapshot,
} from "@/lib/finance/types";

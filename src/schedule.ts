/**
 * Sliding-fee tiers and dollar amounts from the Premier Mobile Health
 * policy adopted January 29, 2024. Income cutoffs are recalculated with
 * the 2026 HHS poverty guidelines for the 48 contiguous states:
 * $15,960 for one person, plus $5,680 for each additional person.
 * Confirm with the clinic before patient use.
 */

export const FPL_YEAR = 2026
export const FPL_BASE = 15_960
export const FPL_INCREMENT = 5_680

export const tierIds = ["A", "B1", "B2", "C", "D", "standard"] as const
export type TierId = (typeof tierIds)[number]

export const visitIds = [
  "sick",
  "chronic",
  "screening",
  "physical",
  "vaccine",
  "lab",
  "other",
] as const
export type VisitId = (typeof visitIds)[number]

export type PayPeriod = "weekly" | "monthly"

export interface IncomeBand {
  tier: TierId
  min: number
  max: number | null
}

const TIER_PERCENTS: { tier: Exclude<TierId, "standard">; percent: number }[] = [
  { tier: "A", percent: 100 },
  { tier: "B1", percent: 130 },
  { tier: "B2", percent: 160 },
  { tier: "C", percent: 200 },
  { tier: "D", percent: 400 },
]

const FEE_BY_TIER: Record<Exclude<TierId, "standard">, number> = {
  A: 10,
  B1: 15,
  B2: 20,
  C: 25,
  D: 75,
}

export function povertyGuideline(householdSize: number): number {
  if (!Number.isInteger(householdSize) || householdSize < 1) {
    throw new Error("Household size must be a whole number of at least 1.")
  }
  return FPL_BASE + (householdSize - 1) * FPL_INCREMENT
}

export function dollarsAtPercent(householdSize: number, percent: number): number {
  const amount = (povertyGuideline(householdSize) * percent) / 100
  if (!Number.isInteger(amount)) {
    throw new Error("Poverty cutoff was not a whole dollar.")
  }
  return amount
}

export function tierForAnnualIncome(
  householdSize: number,
  annualIncome: number,
): TierId {
  if (!Number.isFinite(annualIncome) || annualIncome < 0) {
    throw new Error("Income must be zero or more.")
  }
  const income = Math.round(annualIncome)
  for (const band of TIER_PERCENTS) {
    if (income <= dollarsAtPercent(householdSize, band.percent)) return band.tier
  }
  return "standard"
}

export function feeForTier(tier: TierId): number | null {
  if (tier === "standard") return null
  return FEE_BY_TIER[tier]
}

export function incomeBands(householdSize: number): IncomeBand[] {
  let previous = -1
  const bands: IncomeBand[] = TIER_PERCENTS.map((band) => {
    const max = dollarsAtPercent(householdSize, band.percent)
    const next = { tier: band.tier, min: previous + 1, max }
    previous = max
    return next
  })
  bands.push({ tier: "standard", min: previous + 1, max: null })
  return bands
}

export function annualFromPaycheck(
  amount: number,
  period: PayPeriod,
): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null
  const periods = period === "weekly" ? 52 : 12
  return Math.round(amount * periods)
}

export function parseMoney(raw: string): number | null {
  let value = raw.trim().replace(/[$\s]/g, "")
  if (!value) return null
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(value)) {
    value = value.replace(/,/g, "")
  } else if (/^\d+,\d{1,2}$/.test(value)) {
    value = value.replace(",", ".")
  } else {
    value = value.replace(/,/g, "")
  }
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) return null
  return amount
}

export function monthlyAmount(annual: number): number {
  return Math.round(annual / 12)
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export const clinicPhone = {
  display: "(239) 288-7949",
  tel: "+12392887949",
} as const

import { describe, expect, it } from "vitest"
import {
  FPL_BASE,
  FPL_INCREMENT,
  annualFromPaycheck,
  dollarsAtPercent,
  feeForTier,
  incomeBands,
  parseMoney,
  povertyGuideline,
  tierForAnnualIncome,
} from "./schedule"

describe("povertyGuideline", () => {
  it("uses the 2026 base and the per-person increment", () => {
    expect(povertyGuideline(1)).toBe(FPL_BASE)
    expect(povertyGuideline(2)).toBe(FPL_BASE + FPL_INCREMENT)
    expect(povertyGuideline(4)).toBe(33_000)
    expect(povertyGuideline(9)).toBe(61_400)
    expect(povertyGuideline(12)).toBe(78_440)
  })

  it("rejects an empty or partial household", () => {
    expect(() => povertyGuideline(0)).toThrow()
    expect(() => povertyGuideline(1.5)).toThrow()
  })
})

describe("tier boundaries", () => {
  it("keeps the adopted fee on each inclusive ceiling for a household of 1", () => {
    expect(feeForTier(tierForAnnualIncome(1, 0))).toBe(10)
    expect(tierForAnnualIncome(1, 15_960)).toBe("A")
    expect(tierForAnnualIncome(1, 15_961)).toBe("B1")
    expect(tierForAnnualIncome(1, 20_748)).toBe("B1")
    expect(tierForAnnualIncome(1, 20_749)).toBe("B2")
    expect(tierForAnnualIncome(1, 25_536)).toBe("B2")
    expect(tierForAnnualIncome(1, 25_537)).toBe("C")
    expect(tierForAnnualIncome(1, 31_920)).toBe("C")
    expect(tierForAnnualIncome(1, 31_921)).toBe("D")
    expect(tierForAnnualIncome(1, 63_840)).toBe("D")
    expect(feeForTier(tierForAnnualIncome(1, 63_841))).toBeNull()
  })

  it("matches the hand-calculated 2026 cutoffs for a household of 4", () => {
    expect(dollarsAtPercent(4, 100)).toBe(33_000)
    expect(dollarsAtPercent(4, 130)).toBe(42_900)
    expect(dollarsAtPercent(4, 160)).toBe(52_800)
    expect(dollarsAtPercent(4, 200)).toBe(66_000)
    expect(dollarsAtPercent(4, 400)).toBe(132_000)
    expect(feeForTier(tierForAnnualIncome(4, 33_000))).toBe(10)
    expect(feeForTier(tierForAnnualIncome(4, 42_900))).toBe(15)
    expect(feeForTier(tierForAnnualIncome(4, 52_800))).toBe(20)
    expect(feeForTier(tierForAnnualIncome(4, 66_000))).toBe(25)
    expect(feeForTier(tierForAnnualIncome(4, 132_000))).toBe(75)
    expect(feeForTier(tierForAnnualIncome(4, 132_001))).toBeNull()
  })

  it("builds contiguous whole-dollar ranges through a household of 12", () => {
    for (let size = 1; size <= 12; size += 1) {
      for (const percent of [100, 130, 160, 200, 400]) {
        expect(Number.isInteger(dollarsAtPercent(size, percent))).toBe(true)
      }
      const bands = incomeBands(size)
      expect(bands.map((band) => band.tier)).toEqual([
        "A",
        "B1",
        "B2",
        "C",
        "D",
        "standard",
      ])
      for (let index = 1; index < bands.length; index += 1) {
        expect(bands[index].min).toBe((bands[index - 1].max ?? 0) + 1)
      }
      expect(bands[0]?.min).toBe(0)
      expect(bands.at(-1)?.max).toBeNull()
    }
  })
})

describe("paycheck estimate", () => {
  it("turns a paycheck into an annual amount and a tier", () => {
    expect(annualFromPaycheck(300, "weekly")).toBe(15_600)
    expect(tierForAnnualIncome(1, 15_600)).toBe("A")
    expect(annualFromPaycheck(400, "weekly")).toBe(20_800)
    expect(tierForAnnualIncome(1, 20_800)).toBe("B2")
    expect(annualFromPaycheck(2_000, "monthly")).toBe(24_000)
    expect(tierForAnnualIncome(1, 24_000)).toBe("B2")
    expect(annualFromPaycheck(-1, "weekly")).toBeNull()
  })

  it("parses plain amounts and rejects blanks", () => {
    expect(parseMoney("400")).toBe(400)
    expect(parseMoney("$1,200")).toBe(1_200)
    expect(parseMoney("12,50")).toBe(12.5)
    expect(parseMoney("")).toBeNull()
    expect(parseMoney("-5")).toBeNull()
    expect(parseMoney("abc")).toBeNull()
  })
})

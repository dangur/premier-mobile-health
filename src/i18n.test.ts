import { describe, expect, it } from "vitest"
import { copy, languages } from "./i18n"
import { tierIds, visitIds } from "./schedule"

describe("copy", () => {
  it("has a proof line and every tier in each language", () => {
    for (const lang of languages) {
      expect(copy[lang].documents).toHaveLength(7)
      for (const tier of tierIds) {
        expect(copy[lang].tierName[tier].length).toBeGreaterThan(0)
        expect(copy[lang].tierExplain[tier].length).toBeGreaterThan(0)
      }
      for (const visit of visitIds) {
        expect(copy[lang].visits[visit].length).toBeGreaterThan(0)
      }
    }
  })
})

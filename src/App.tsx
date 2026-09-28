import { useEffect, useRef, useState } from "react"
import {
  clinicLanguages,
  copy,
  fill,
  formatPassDate,
  languages,
  type Copy,
  type Lang,
} from "./i18n"
import {
  FPL_BASE,
  FPL_INCREMENT,
  annualFromPaycheck,
  formatUsd,
  incomeBands,
  monthlyAmount,
  parseMoney,
  tierForAnnualIncome,
  visitIds,
  type IncomeBand,
  type PayPeriod,
  type TierId,
  type VisitId,
} from "./schedule"
import { Voucher } from "./Voucher"

const MAX_HOUSEHOLD = 20
type Step = "language" | "household" | "income" | "visit" | "result"

const stepNumber: Record<Exclude<Step, "language">, number> = {
  household: 1,
  income: 2,
  visit: 3,
  result: 4,
}

function countLabel(text: Copy, count: number): string {
  return count === 1
    ? text.onePerson
    : fill(text.manyPeople, { count: String(count) })
}

function bandLabels(band: IncomeBand, text: Copy): { year: string; month: string } {
  if (band.max === null) {
    const floor = band.min - 1
    return {
      year: fill(text.moreThanYear, { amount: formatUsd(floor) }),
      month: fill(text.moreThanMonth, { amount: formatUsd(monthlyAmount(floor)) }),
    }
  }
  if (band.min === 0) {
    return {
      year: fill(text.upToYear, { amount: formatUsd(band.max) }),
      month: fill(text.upToMonth, { amount: formatUsd(monthlyAmount(band.max)) }),
    }
  }
  return {
    year: fill(text.betweenYear, {
      min: formatUsd(band.min),
      max: formatUsd(band.max),
    }),
    month: fill(text.betweenMonth, {
      min: formatUsd(monthlyAmount(band.min)),
      max: formatUsd(monthlyAmount(band.max)),
    }),
  }
}

function Check() {
  return (
    <svg className="tick" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 10.5 8 14.5 16 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function App() {
  const [lang, setLang] = useState<Lang | null>(null)
  const [step, setStep] = useState<Step>("language")
  const [householdSize, setHouseholdSize] = useState(1)
  const [tier, setTier] = useState<TierId | null>(null)
  const [visit, setVisit] = useState<VisitId | null>(null)
  const [showEstimate, setShowEstimate] = useState(false)
  const [payPeriod, setPayPeriod] = useState<PayPeriod>("weekly")
  const [payAmount, setPayAmount] = useState("")
  const [estimateMessage, setEstimateMessage] = useState<"applied" | "error" | null>(
    null,
  )
  const [passDate, setPassDate] = useState<Date | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const text = copy[lang ?? "en"]

  useEffect(() => {
    document.documentElement.lang = lang ?? "en"
  }, [lang])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  function chooseLanguage(next: Lang) {
    setLang(next)
    setStep("household")
  }

  function changeHousehold(next: number) {
    const size = Math.min(MAX_HOUSEHOLD, Math.max(1, next))
    if (size === householdSize) return
    setHouseholdSize(size)
    setTier(null)
    setPayAmount("")
    setEstimateMessage(null)
  }

  function selectTier(next: TierId) {
    setTier(next)
    setPayAmount("")
    setEstimateMessage(null)
  }

  function applyEstimate() {
    const amount = parseMoney(payAmount)
    const annual = amount === null ? null : annualFromPaycheck(amount, payPeriod)
    if (annual === null) {
      setEstimateMessage("error")
      return
    }
    const nextTier = tierForAnnualIncome(householdSize, annual)
    setTier(nextTier)
    setPayAmount("")
    setEstimateMessage("applied")
    requestAnimationFrame(() => {
      document.getElementById(`band-${nextTier}`)?.focus()
    })
  }

  function startOver() {
    setHouseholdSize(1)
    setTier(null)
    setVisit(null)
    setShowEstimate(false)
    setPayPeriod("weekly")
    setPayAmount("")
    setEstimateMessage(null)
    setPassDate(null)
    setStep("household")
  }

  const banner = fill(text.demoBanner, {
    base: formatUsd(FPL_BASE),
    increment: formatUsd(FPL_INCREMENT),
  })

  return (
    <>
      <a className="skip no-print" href="#main">
        {text.skip}
      </a>
      <div className="banner no-print">
        <p>{banner}</p>
      </div>
      <div className="wrap">
        <header className="no-print">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path
                  d="M16 8v16M8 16h16"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <p className="brand-name" translate="no">
                Premier Mobile Health
              </p>
              <p className="brand-tool">{text.toolName}</p>
            </div>
          </div>
          {lang && step !== "language" ? (
            <div className="langs" role="group" aria-label={text.changeLanguage}>
              {clinicLanguages.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  lang={choice.id}
                  aria-pressed={lang === choice.id}
                  aria-label={choice.label}
                  onClick={() => setLang(choice.id)}
                >
                  {choice.short}
                </button>
              ))}
            </div>
          ) : null}
          {lang && lang !== "en" && step !== "language" ? (
            <p className="draft-short">{text.draftShort}</p>
          ) : null}
          {step === "language" ? (
            languages.map((id) => (
              <p key={id} className="privacy" lang={id}>
                {copy[id].privacy}
              </p>
            ))
          ) : (
            <p className="privacy">{text.privacy}</p>
          )}
        </header>
        <main id="main">{renderStep()}</main>
      </div>
    </>
  )

  function renderStep() {
    if (step === "language") {
      return (
        <>
          <h1 ref={headingRef} tabIndex={-1} className="lang-title">
            <span lang="en">{copy.en.chooseLanguage}</span>
            <span lang="es">{copy.es.chooseLanguage}</span>
            <span lang="ht">{copy.ht.chooseLanguage}</span>
          </h1>
          <div className="stack" role="group" aria-label={text.chooseLanguage}>
            {clinicLanguages.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="choice"
                lang={choice.id}
                onClick={() => chooseLanguage(choice.id)}
              >
                <span className="choice-title">{choice.label}</span>
                {copy[choice.id].draftBadge ? (
                  <span className="badge">{copy[choice.id].draftBadge}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="draft-notes">
            {languages.map((id) => (
              <p key={id} lang={id}>
                {copy[id].draftNote}
              </p>
            ))}
          </div>
        </>
      )
    }

    if (step === "household") {
      return (
        <>
          <p className="eyebrow">
            {fill(text.step, { current: String(stepNumber.household), total: "4" })}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {text.householdTitle}
          </h1>
          <p className="help">{text.householdHelp}</p>
          <div className="stepper">
            <button
              type="button"
              onClick={() => changeHousehold(householdSize - 1)}
              disabled={householdSize <= 1}
              aria-label={text.fewerPeople}
            >
              −
            </button>
            <p className="count" aria-hidden="true">
              {householdSize}
            </p>
            <button
              type="button"
              onClick={() => changeHousehold(householdSize + 1)}
              disabled={householdSize >= MAX_HOUSEHOLD}
              aria-label={text.morePeople}
            >
              +
            </button>
          </div>
          <p className="count-label" aria-live="polite">
            {countLabel(text, householdSize)}
          </p>
          <div className="actions">
            <button type="button" className="primary" onClick={() => setStep("income")}>
              {text.next}
            </button>
            <button type="button" className="ghost" onClick={() => setStep("language")}>
              {text.back}
            </button>
          </div>
        </>
      )
    }

    if (step === "income") {
      const bands = incomeBands(householdSize)
      return (
        <>
          <p className="eyebrow">
            {fill(text.step, { current: String(stepNumber.income), total: "4" })}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {text.incomeTitle}
          </h1>
          <p className="help">{text.incomeHelp}</p>
          <button
            type="button"
            className="ghost estimate-toggle"
            aria-expanded={showEstimate}
            onClick={() => setShowEstimate((open) => !open)}
          >
            {showEstimate ? text.estimateHide : text.estimateShow}
          </button>
          {showEstimate ? (
            <div className="estimate">
              <p>{text.estimateHelp}</p>
              <div className="period" role="group" aria-label={text.payPeriodLabel}>
                {(["weekly", "monthly"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    aria-pressed={payPeriod === period}
                    onClick={() => setPayPeriod(period)}
                  >
                    {period === "weekly" ? text.weekly : text.monthly}
                  </button>
                ))}
              </div>
              <label htmlFor="pay-amount">{text.payLabel}</label>
              <input
                id="pay-amount"
                value={payAmount}
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={estimateMessage === "error"}
                onChange={(event) => {
                  setPayAmount(event.target.value)
                  setEstimateMessage(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    applyEstimate()
                  }
                }}
              />
              <button type="button" className="primary" onClick={applyEstimate}>
                {text.useEstimate}
              </button>
              {estimateMessage === "error" ? (
                <p className="alert" role="alert">
                  {text.estimateError}
                </p>
              ) : null}
              {estimateMessage === "applied" ? (
                <p className="status" role="status">
                  {text.estimateApplied}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="stack">
            {bands.map((band) => {
              const labels = bandLabels(band, text)
              const selected = tier === band.tier
              return (
                <button
                  key={band.tier}
                  id={`band-${band.tier}`}
                  type="button"
                  className="choice"
                  aria-pressed={selected}
                  onClick={() => selectTier(band.tier)}
                >
                  <span className="choice-text">
                    <span className="choice-title">{labels.year}</span>
                    <span className="choice-meta">{labels.month}</span>
                  </span>
                  {selected ? <Check /> : null}
                </button>
              )
            })}
          </div>
          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={tier === null}
              onClick={() => {
                setPayAmount("")
                setStep("visit")
              }}
            >
              {text.next}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setPayAmount("")
                setStep("household")
              }}
            >
              {text.back}
            </button>
          </div>
        </>
      )
    }

    if (step === "visit") {
      return (
        <>
          <p className="eyebrow">
            {fill(text.step, { current: String(stepNumber.visit), total: "4" })}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {text.visitTitle}
          </h1>
          <p className="help">{text.visitHelp}</p>
          <div className="stack">
            {visitIds.map((id) => {
              const selected = visit === id
              return (
                <button
                  key={id}
                  type="button"
                  className="choice"
                  aria-pressed={selected}
                  onClick={() => setVisit(id)}
                >
                  <span className="choice-title">{text.visits[id]}</span>
                  {selected ? <Check /> : null}
                </button>
              )
            })}
          </div>
          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={visit === null}
              onClick={() => {
                setPassDate(new Date())
                setStep("result")
              }}
            >
              {text.next}
            </button>
            <button type="button" className="ghost" onClick={() => setStep("income")}>
              {text.back}
            </button>
          </div>
        </>
      )
    }

    if (!tier || !visit || !passDate) return null

    return (
      <>
        <div className="no-print">
          <p className="eyebrow">
            {fill(text.step, { current: String(stepNumber.result), total: "4" })}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {text.resultTitle}
          </h1>
          <p className="help">{text.stillSeen}</p>
        </div>
        <Voucher
          copy={text}
          tier={tier}
          visit={visit}
          dateLabel={formatPassDate(passDate, lang ?? "en")}
        />
        <div className="actions no-print">
          <button type="button" className="primary" onClick={() => window.print()}>
            {text.print}
          </button>
          <button type="button" className="ghost" onClick={() => setStep("visit")}>
            {text.back}
          </button>
          <button type="button" className="text" onClick={startOver}>
            {text.startOver}
          </button>
        </div>
      </>
    )
  }
}

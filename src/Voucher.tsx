import type { Copy } from "./i18n"
import {
  clinicPhone,
  feeForTier,
  formatUsd,
  type TierId,
  type VisitId,
} from "./schedule"

export function Voucher({
  copy,
  tier,
  visit,
  dateLabel,
}: {
  copy: Copy
  tier: TierId
  visit: VisitId
  dateLabel: string
}) {
  const fee = feeForTier(tier)

  return (
    <article className="voucher" aria-label={copy.voucherKicker}>
      <header className="voucher-head">
        <p className="clinic" translate="no">
          Premier Mobile Health Services
        </p>
        <div className="voucher-title">
          <h2>{copy.voucherKicker}</h2>
          <p>{copy.notABill}</p>
        </div>
      </header>

      {fee === null ? (
        <p className="fee-sentence">{copy.standardFee}</p>
      ) : (
        <>
          <p className="fee">{formatUsd(fee)}</p>
          <p className="fee-caption">{copy.dueAtVisit}</p>
        </>
      )}
      <p className="tier">{copy.tierName[tier]}</p>
      <p className="explain">{copy.tierExplain[tier]}</p>

      <dl className="meta">
        <div>
          <dt>{copy.dateLabel}</dt>
          <dd>{dateLabel}</dd>
        </div>
        <div>
          <dt>{copy.visitLabel}</dt>
          <dd>{copy.visits[visit]}</dd>
        </div>
      </dl>

      <p className="name-line">
        <span>{copy.nameLine}</span>
        <span className="line" aria-hidden="true" />
      </p>

      <h3>{copy.bringTitle}</h3>
      <p className="bring-intro">{copy.bringIntro}</p>
      <ul className="docs">
        {copy.documents.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="note">{copy.grace}</p>
      <p className="disclaimer">{copy.disclaimer}</p>

      <p className="phone">
        <span>{copy.phoneLabel}</span>
        <a href={`tel:${clinicPhone.tel}`}>{clinicPhone.display}</a>
      </p>
    </article>
  )
}

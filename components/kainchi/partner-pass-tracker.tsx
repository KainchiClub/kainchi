'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { usePartnerPasses } from './partner-pass-store'

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export function PartnerPassTracker() {
  const { passes, isLoaded } = usePartnerPasses()
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [didSearch, setDidSearch] = useState(false)

  const normalizedCode = submittedQuery.trim().toUpperCase()
  const normalizedPhone = normalizePhone(submittedQuery)
  const matchedPass = didSearch
    ? passes.find((pass) => pass.partnerId.toUpperCase() === normalizedCode
      || (normalizedPhone.length >= 4 && normalizePhone(pass.phone) === normalizedPhone))
    : undefined
  const nextMilestone = matchedPass
    ? (Math.floor(matchedPass.referralsCount / matchedPass.milestoneTarget) + 1) * matchedPass.milestoneTarget
    : 0
  const progressWithinTier = matchedPass ? matchedPass.referralsCount % matchedPass.milestoneTarget : 0
  const progressPercent = matchedPass ? (progressWithinTier / matchedPass.milestoneTarget) * 100 : 0

  function checkPartnerStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedQuery(query.trim())
    setDidSearch(true)
  }

  return (
    <section className="studio-partner-tracker" aria-labelledby="studio-partner-tracker-title">
      <div className="studio-partner-tracker-copy">
        <p className="studio-partner-tracker-kicker">A personal archive</p>
        <h3 id="studio-partner-tracker-title">Track Partner Status</h3>
        <p>Check your referral milestones and current lifetime privilege with your partner code or registered phone.</p>
      </div>
      <form className="studio-partner-tracker-form" onSubmit={checkPartnerStatus}>
        <label htmlFor="partner-pass-lookup">Partner code or phone number</label>
        <div className="studio-partner-tracker-input-row">
          <input
            id="partner-pass-lookup"
            autoComplete="off"
            maxLength={80}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="KC-VIP-SAM-5356 or phone"
          />
          <button type="submit" disabled={!isLoaded} aria-label="Check partner status">
            <Search aria-hidden="true" /> <span>Check status</span> <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <p className="studio-partner-tracker-local-note">This no-integration preview stores passes only in this browser; it cannot look up records from another device.</p>
      </form>

      {didSearch && (
        matchedPass ? (
          <div className="studio-partner-tracker-result" role="status" aria-live="polite">
            <div className="studio-partner-tracker-result-heading">
              <div>
                <p className="studio-partner-tracker-result-label">{matchedPass.status}</p>
                <h4>{matchedPass.partnerId}</h4>
              </div>
              <p className="studio-partner-tracker-discount">+{matchedPass.stackedDiscount}% <span>Lifetime Privilege</span></p>
            </div>
            <div className="studio-partner-tracker-progress-copy">
              <span>{matchedPass.referralsCount} / {nextMilestone} Referrals Completed</span>
              <span>{matchedPass.milestoneTarget - progressWithinTier} to next +1%</span>
            </div>
            <div
              className="studio-partner-tracker-progress"
              role="progressbar"
              aria-label="Progress toward next lifetime discount tier"
              aria-valuemin={0}
              aria-valuemax={matchedPass.milestoneTarget}
              aria-valuenow={progressWithinTier}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        ) : (
          <p className="studio-partner-tracker-empty" role="status" aria-live="polite">
            {isLoaded ? 'No pass was found in this browser. Check the code or registered phone, or contact the studio.' : 'Loading partner passes…'}
          </p>
        )
      )}
    </section>
  )
}

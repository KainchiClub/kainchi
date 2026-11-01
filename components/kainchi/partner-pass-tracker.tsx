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
        <h3 id="studio-partner-tracker-title">Check Your Partner Status</h3>
      </div>
      <form className="studio-partner-tracker-form" onSubmit={checkPartnerStatus}>
        <label htmlFor="partner-pass-lookup">Enter your WhatsApp Number to check your Partner Status</label>
        <div className="studio-partner-tracker-input-row">
          <input
            id="partner-pass-lookup"
            autoComplete="off"
            maxLength={80}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter WhatsApp number"
          />
          <button type="submit" disabled={!isLoaded} aria-label="Check Milestone">
            <Search aria-hidden="true" /> <span>Check Milestone</span> <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </form>

      {didSearch && (
        matchedPass ? (
          <div className="studio-partner-tracker-result" role="status" aria-live="polite">
            <div className="studio-partner-tracker-result-heading">
              <h4>Referrals: {matchedPass.referralsCount} / {nextMilestone}</h4>
              <p className="studio-partner-tracker-discount">Next Privilege: +{matchedPass.stackedDiscount + 1}% <span>Stacked Discount</span></p>
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

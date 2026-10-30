'use client'

import { useState, type FormEvent } from 'react'
import { Scissors } from 'lucide-react'
import { addStudioPartner, INITIAL_ACTIVE_PARTNERS, INITIAL_DREAMERS_WELCOMED, useStudioPartners } from './studio-partners'

const privilegeSteps = [
  {
    number: '01',
    title: 'Step 1: Own The Craft',
    condition: '1st studio piece ordered & delivered.',
    detailLabel: 'Unlocks',
    detail: 'Official Studio Partner status & Personal Artisan Code.',
  },
  {
    number: '02',
    title: 'Step 2: Spread The Vision',
    condition: 'Introduce collectors to Kainchi Club.',
    detailLabel: 'Milestones',
    detail: 'Every qualified first-purchase referral is tracked toward your next privilege.',
  },
] as const

export function StudioAllianceProgram() {
  const { partners } = useStudioPartners()
  const [submitStatus, setSubmitStatus] = useState('')
  const [whatsAppUrl, setWhatsAppUrl] = useState('')
  const activePartnerCount = INITIAL_ACTIVE_PARTNERS + partners.filter((partner) => partner.status === 'Active').length
  const dreamersWelcomedCount = INITIAL_DREAMERS_WELCOMED + partners.reduce((total, partner) => total + partner.referralsCount, 0)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const contactDetails = String(new FormData(event.currentTarget).get('partnerContact') ?? '').trim()
    if (!contactDetails) return
    setSubmitStatus('')
    setWhatsAppUrl('')

    try {
      addStudioPartner(contactDetails)
    } catch {
      setSubmitStatus('This browser could not save your signup. Please try again or contact the studio directly.')
      return
    }

    const message = `Hi Kainchi Club! ✂️ I want to register as a Studio Partner under the Co-Ownership Program. Here is my details: ${contactDetails}. Please generate my personal referral code!`
    const url = `https://wa.me/918863075356?text=${encodeURIComponent(message)}`
    setWhatsAppUrl(url)
    setSubmitStatus('Your signup was saved in this browser. If WhatsApp did not open, use the direct chat link below.')
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="studio-alliance" aria-labelledby="studio-alliance-title">
      <div className="studio-alliance-inner">
        <p className="studio-alliance-badge"><Scissors aria-hidden="true" /> Studio Alliance · Co-Ownership Program</p>
        <div className="studio-alliance-intro-row">
          <div className="studio-alliance-intro-copy">
            <h2 id="studio-alliance-title">You refer because this is your company. I am simply the artisan bringing your dreams to thread.</h2>
            <p className="studio-alliance-subtitle">A rare privilege designed for collectors who wear the vision and build the studio alongside us.</p>
          </div>
          <aside className="studio-alliance-live-card" aria-label="Live Studio Community Metric">
            <p className="studio-alliance-live-status"><span className="studio-alliance-live-dot" aria-hidden="true" /> Live Studio Sync <span className="studio-alliance-local-tag">This browser</span></p>
            <p className="studio-alliance-live-metric" aria-live="polite" aria-atomic="true">
              <span key={activePartnerCount} className="studio-alliance-live-count">{activePartnerCount}</span> Active Partners <span className="studio-alliance-live-divider">·</span> <span key={dreamersWelcomedCount} className="studio-alliance-live-count">{dreamersWelcomedCount}+</span> Dreamers Welcomed
            </p>
            <p className="studio-alliance-live-note">Milestones tracked in this browser; ask the studio to confirm and apply any unlocked discount at checkout.</p>
          </aside>
        </div>

        <div className="studio-alliance-steps">
          {privilegeSteps.map((step) => (
            <article className="studio-alliance-card" key={step.number}>
              <span className="studio-alliance-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p className="studio-alliance-label">Condition</p>
              <p className="studio-alliance-copy">{step.condition}</p>
              <p className="studio-alliance-label">{step.detailLabel}</p>
              <p className="studio-alliance-copy">{step.detail}</p>
            </article>
          ))}
          <article className="studio-alliance-card studio-alliance-card-featured">
            <span className="studio-alliance-number">03</span>
            <h3>Step 3: +1% Stacked Privilege</h3>
            <p className="studio-alliance-label">Privilege</p>
            <p className="studio-alliance-copy">For every 10 qualified referrals, unlock an extra +1% lifetime stacked discount on top of any public or festive offers.</p>
            <p className="studio-alliance-label">Status</p>
            <div className="studio-alliance-milestones" aria-label="Referral milestones">
              <span>10 referrals <strong>+1% extra</strong></span>
              <span>20 referrals <strong>+2% extra</strong></span>
            </div>
            <p className="studio-alliance-priority">Permanent Archival Priority</p>
          </article>
        </div>

        <form className="studio-alliance-form" onSubmit={handleSubmit}>
          <label htmlFor="studio-alliance-contact">Enter your WhatsApp Number or Existing Order ID</label>
          <div className="studio-alliance-form-row">
            <input
              id="studio-alliance-contact"
              name="partnerContact"
              type="text"
              autoComplete="off"
              maxLength={80}
              required
              placeholder="e.g. 918863075356 or KC-ORDER-042"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault()
              }}
            />
            <button type="submit">Unlock Studio Partner Pass <span aria-hidden="true">➔</span></button>
          </div>
          <p className="studio-alliance-form-note">Your request is saved only in this browser and is not shared across devices.</p>
          {submitStatus && <p className="studio-alliance-submit-status" role="status">{submitStatus}</p>}
          {whatsAppUrl && <a className="studio-alliance-fallback-link" href={whatsAppUrl} target="_blank" rel="noopener noreferrer">Open the direct WhatsApp chat</a>}
        </form>
      </div>
    </section>
  )
}

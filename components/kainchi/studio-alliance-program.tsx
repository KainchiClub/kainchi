'use client'

import { PartnerPassTracker } from './partner-pass-tracker'

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
  const partnerPassUrl = `https://wa.me/918863075356?text=${encodeURIComponent('Hi Kainchi Club! I would like to apply for a Studio Partner Pass.')}`

  return (
    <section className="studio-alliance" aria-label="Studio Alliance Co-Ownership Program">
      <div className="studio-alliance-inner">
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

        <PartnerPassTracker />

        <a className="studio-partner-pass-apply" href={partnerPassUrl} target="_blank" rel="noopener noreferrer">
          Apply for Studio Partner Pass <span aria-hidden="true">➔</span>
        </a>
      </div>
    </section>
  )
}

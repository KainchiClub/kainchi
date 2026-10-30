'use client'

import { useState } from 'react'
import { Check, Pencil, Plus, Save, X } from 'lucide-react'
import {
  INITIAL_ACTIVE_PARTNERS,
  INITIAL_DREAMERS_WELCOMED,
  updateStudioPartner,
  useStudioPartners,
  type StudioPartner,
} from '@/components/kainchi/studio-partners'

function formatPartnerDate(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}

function discountTier(referralsCount: number) {
  return Math.floor(referralsCount / 10)
}

export function AllianceReferralsPanel() {
  const { partners, isLoaded } = useStudioPartners()
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null)
  const [identifierDraft, setIdentifierDraft] = useState('')
  const [message, setMessage] = useState('')

  const qualifiedReferrals = partners.reduce((total, partner) => total + partner.referralsCount, 0)
  const activePartners = INITIAL_ACTIVE_PARTNERS + partners.filter((partner) => partner.status === 'Active').length
  const dreamersWelcomed = INITIAL_DREAMERS_WELCOMED + qualifiedReferrals
  const topAdvocates = [...partners]
    .filter((partner) => partner.referralsCount > 0)
    .sort((left, right) => right.referralsCount - left.referralsCount || Date.parse(right.date) - Date.parse(left.date))
    .slice(0, 3)

  function beginEdit(partner: StudioPartner) {
    setEditingPartnerId(partner.id)
    setIdentifierDraft(partner.identifier)
    setMessage('')
  }

  function saveEdit(partner: StudioPartner) {
    const identifier = identifierDraft.trim().slice(0, 80)
    if (!identifier) {
      setMessage('Partner identifier cannot be empty.')
      return
    }

    try {
      updateStudioPartner(partner.id, { identifier })
      setEditingPartnerId(null)
      setMessage('Partner identifier updated in this browser.')
    } catch {
      setMessage('The partner record could not be saved in this browser.')
    }
  }

  function incrementReferral(partner: StudioPartner) {
    try {
      updateStudioPartner(partner.id, { referralsCount: partner.referralsCount + 1 })
      setMessage(`Referral count updated for ${partner.identifier}.`)
    } catch {
      setMessage('The referral count could not be saved in this browser.')
    }
  }

  function approvePartner(partner: StudioPartner) {
    try {
      updateStudioPartner(partner.id, { approved: true })
      setMessage(`${partner.identifier} approved.`)
    } catch {
      setMessage('The approval could not be saved in this browser.')
    }
  }

  return (
    <div className="admin-alliance-panel">
      <section className="admin-alliance-overview" aria-label="Alliance and referral statistics">
        <article className="admin-alliance-stat">
          <p>Total Studio Partners Registered</p>
          <strong>{isLoaded ? activePartners : '—'}</strong>
          <span>48 existing partners plus local signups</span>
        </article>
        <article className="admin-alliance-stat">
          <p>Total Active Referrals</p>
          <strong>{isLoaded ? `${dreamersWelcomed}${dreamersWelcomed === INITIAL_DREAMERS_WELCOMED ? '+' : ''}` : '—'}</strong>
          <span>340+ existing dreamers plus local referrals</span>
        </article>
        <article className="admin-alliance-stat admin-alliance-top">
          <div className="admin-alliance-top-heading">
            <p>Top Advocates</p>
            <span aria-hidden="true">01—03</span>
          </div>
          {topAdvocates.length > 0 ? (
            <ol>
              {topAdvocates.map((partner) => (
                <li key={partner.id}>
                  <span>{partner.identifier}</span>
                  <strong>{partner.referralsCount} {partner.referralsCount === 1 ? 'referral' : 'referrals'} · +{discountTier(partner.referralsCount)}%</strong>
                </li>
              ))}
            </ol>
          ) : (
            <span className="admin-alliance-no-advocates">No local referrals recorded yet.</span>
          )}
        </article>
      </section>

      <section className="admin-panel admin-alliance-records" aria-labelledby="admin-alliance-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="admin-alliance-title">Alliance &amp; Referrals</h2>
            <p>Partner records and manual referral updates are stored in this browser only; they are not shared across devices.</p>
          </div>
          <span className="admin-count">{String(partners.length).padStart(2, '0')} LOCAL PARTNERS</span>
        </div>
        {message && <p className="admin-alliance-message" role="status">{message}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table admin-alliance-table">
            <caption className="sr-only">Studio partners with registration date, referral count, stacked discount tier, and admin actions</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Partner Identifier / Phone</th>
                <th scope="col">Qualified Referrals</th>
                <th scope="col">Stacked Discount</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoaded ? (
                <tr><td className="admin-alliance-empty" colSpan={5}>Loading partner records…</td></tr>
              ) : partners.length === 0 ? (
                <tr><td className="admin-alliance-empty" colSpan={5}>No partner signups saved in this browser yet.</td></tr>
              ) : partners.map((partner) => {
                const isEditing = editingPartnerId === partner.id
                return (
                  <tr key={partner.id}>
                    <td>{formatPartnerDate(partner.date)}</td>
                    <td>
                      {isEditing ? (
                        <input
                          className="admin-alliance-edit-input"
                          aria-label={`Partner identifier for ${partner.identifier}`}
                          maxLength={80}
                          value={identifierDraft}
                          onChange={(event) => setIdentifierDraft(event.target.value)}
                        />
                      ) : (
                        <>
                          <strong className="admin-alliance-identifier">{partner.identifier}</strong>
                          <span className="admin-alliance-status">{partner.status}{partner.approved ? ' · Approved' : ''}</span>
                        </>
                      )}
                    </td>
                    <td>{partner.referralsCount}</td>
                    <td><span className="admin-alliance-tier">+{discountTier(partner.referralsCount)}%</span></td>
                    <td>
                      <div className="admin-alliance-actions">
                        {isEditing ? (
                          <>
                            <button className="admin-alliance-action" type="button" onClick={() => saveEdit(partner)}><Save aria-hidden="true" /> Save</button>
                            <button className="admin-alliance-action admin-alliance-action-muted" type="button" onClick={() => setEditingPartnerId(null)}><X aria-hidden="true" /> Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="admin-alliance-action" type="button" onClick={() => incrementReferral(partner)} aria-label={`Increment qualified referrals for ${partner.identifier}`}><Plus aria-hidden="true" /> Referral</button>
                            <button className="admin-alliance-action" type="button" onClick={() => approvePartner(partner)} disabled={partner.approved} aria-label={partner.approved ? `${partner.identifier} is approved` : `Approve ${partner.identifier}`}><Check aria-hidden="true" /> {partner.approved ? 'Approved' : 'Approve'}</button>
                            <button className="admin-alliance-action admin-alliance-action-muted" type="button" onClick={() => beginEdit(partner)} aria-label={`Edit ${partner.identifier}`}><Pencil aria-hidden="true" /> Edit</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

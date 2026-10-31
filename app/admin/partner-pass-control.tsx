'use client'

import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Mail, Plus } from 'lucide-react'
import {
  createPartnerPass,
  incrementPartnerPassReferral,
  usePartnerPasses,
  type PartnerPass,
} from '@/components/kainchi/partner-pass-store'

const STUDIO_EMAIL = 'kainchiclub@gmail.com'

function gmailComposeUrl(to: string, subject: string, body: string) {
  const url = new URL('https://mail.google.com/mail/')
  url.searchParams.set('view', 'cm')
  url.searchParams.set('fs', '1')
  url.searchParams.set('to', to)
  url.searchParams.set('su', subject)
  url.searchParams.set('body', body)
  return url.toString()
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
    : '—'
}

export function PartnerPassControl() {
  const { passes, isLoaded } = usePartnerPasses()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [orderConfirmation, setOrderConfirmation] = useState('')
  const [createdPass, setCreatedPass] = useState<PartnerPass | null>(null)
  const [confirmationForDraft, setConfirmationForDraft] = useState('')
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)

  const customerDraftUrl = createdPass
    ? gmailComposeUrl(
      createdPass.email,
      'Welcome to the Co-Ownership Circle — Your Kainchi Club Partner Pass',
      [
        'KAINCHI CLUB · STUDIO ALLIANCE',
        '',
        "You refer because it's your company. I am simply the artisan bringing your dreams to thread.",
        '',
        'YOUR PERSONAL PASSCODE',
        createdPass.partnerId,
        '',
        'PARTNER STATUS',
        `0 / ${createdPass.milestoneTarget} Referrals toward +1% Lifetime Privilege`,
        '',
        'Every 10 qualified referrals unlocks another +1% lifetime stacked discount.',
        '',
        'Kainchi Club Studio',
      ].join('\n'),
    )
    : ''
  const studioDraftUrl = createdPass
    ? gmailComposeUrl(
      STUDIO_EMAIL,
      `✂️ [New Partner Activated] - ${createdPass.name} (${createdPass.partnerId})`,
      [
        'NEW STUDIO PARTNER ACTIVATED',
        '',
        `Customer: ${createdPass.name}`,
        `Email: ${createdPass.email}`,
        `Phone: ${createdPass.phone}`,
        `Order confirmation: ${confirmationForDraft}`,
        `Partner code: ${createdPass.partnerId}`,
        `Status: ${createdPass.status}`,
      ].join('\n'),
    )
    : ''

  function activatePartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setMessageIsError(false)

    try {
      const orderReference = orderConfirmation.trim().slice(0, 120)
      if (!orderReference) throw new Error('Enter the first-purchase order confirmation.')

      const pass = createPartnerPass({ name, email, phone })
      setCreatedPass(pass)
      setConfirmationForDraft(orderReference)
      setMessage('Partner pass created in this browser. Both Gmail drafts are ready below; review and send them manually.')
      setName('')
      setEmail('')
      setPhone('')
      setOrderConfirmation('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The pass could not be saved in this browser.')
      setMessageIsError(true)
    }
  }

  function addReferral(pass: PartnerPass) {
    try {
      incrementPartnerPassReferral(pass.partnerId)
      setMessage(`Referral recorded for ${pass.partnerId}.`)
      setMessageIsError(false)
    } catch {
      setMessage('The referral could not be saved in this browser.')
      setMessageIsError(true)
    }
  }

  return (
    <section className="admin-panel admin-partner-pass-control" aria-labelledby="admin-partner-pass-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="admin-partner-pass-title">First-Purchase Partner Passes</h2>
          <p>Confirm a first purchase here to generate a unique pass and prepare both notification drafts.</p>
        </div>
        <span className="admin-count">{String(passes.length).padStart(2, '0')} LOCAL PASSES</span>
      </div>

      <p className="admin-partner-pass-notice">
        This no-integration mode stores pass details in this browser only. Gmail drafts are not sent automatically; verify the From address is kainchiclub@gmail.com and send both messages manually.
      </p>

      <form className="admin-partner-pass-form" onSubmit={activatePartner}>
        <label className="admin-field"><span>Customer name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" required /></label>
        <label className="admin-field"><span>Customer email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" required /></label>
        <label className="admin-field"><span>Customer phone</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={32} autoComplete="tel" required /></label>
        <label className="admin-field"><span>First order confirmation</span><input value={orderConfirmation} onChange={(event) => setOrderConfirmation(event.target.value)} maxLength={120} required /></label>
        <button className="button button-crimson admin-partner-pass-submit" type="submit"><Check aria-hidden="true" /> Confirm First Purchase &amp; Generate Pass</button>
      </form>

      {message && <p className={`admin-partner-pass-message${messageIsError ? ' is-error' : ''}`} role={messageIsError ? 'alert' : 'status'}>{message}</p>}

      {createdPass && (
        <div className="admin-partner-pass-created">
          <div className="partner-pass-email-preview">
            <p className="partner-pass-email-kicker">Kainchi Club · Studio Alliance</p>
            <p className="partner-pass-email-quote">You refer because it&apos;s your company. I am simply the artisan bringing your dreams to thread.</p>
            <span>Your personal passcode</span>
            <strong>{createdPass.partnerId}</strong>
            <p>0 / {createdPass.milestoneTarget} Referrals toward +1% Lifetime Privilege</p>
          </div>
          <div className="admin-partner-pass-draft-actions">
            <a className="admin-partner-pass-draft-link" href={studioDraftUrl} target="_blank" rel="noopener noreferrer"><Mail aria-hidden="true" /> Open Studio Notification Draft <ArrowUpRight aria-hidden="true" /></a>
            <a className="admin-partner-pass-draft-link" href={customerDraftUrl} target="_blank" rel="noopener noreferrer"><Mail aria-hidden="true" /> Open Customer Welcome Draft <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
      )}

      <div className="admin-partner-pass-list-heading">
        <div><h3>Qualified Partners</h3><p>Use the referral action to update the same-browser tracker and stacked tier.</p></div>
        <span>{isLoaded ? `${passes.length} records` : 'Loading…'}</span>
      </div>
      {passes.length > 0 ? (
        <div className="admin-partner-pass-list">
          {passes.map((pass) => (
            <article className="admin-partner-pass-row" key={pass.partnerId}>
              <div className="admin-partner-pass-identity">
                <strong>{pass.partnerId}</strong>
                <span>{pass.name} · {pass.email} · {pass.phone}</span>
                <small>{formatDate(pass.createdAt)} · {pass.status}</small>
              </div>
              <div className="admin-partner-pass-progress">
                <strong>{pass.referralsCount} referrals</strong>
                <span>+{pass.stackedDiscount}% stacked discount</span>
              </div>
              <button className="admin-alliance-action" type="button" onClick={() => addReferral(pass)} aria-label={`Add a qualified referral for ${pass.partnerId}`}><Plus aria-hidden="true" /> Referral</button>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-partner-pass-empty">No first-purchase passes have been recorded in this browser.</p>
      )}
    </section>
  )
}

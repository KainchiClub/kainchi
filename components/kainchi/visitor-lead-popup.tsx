'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { addVisitorLead, type VisitorLead } from './visitor-leads'

const SESSION_SHOWN_KEY = 'kainchi_lead_shown'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function hasSeenLeadPrompt() {
  try {
    return window.sessionStorage.getItem(SESSION_SHOWN_KEY) === '1'
  } catch {
    return true
  }
}

function markLeadPromptShown() {
  try {
    window.sessionStorage.setItem(SESSION_SHOWN_KEY, '1')
  } catch {
    return
  }
}

export function VisitorLeadPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [contact, setContact] = useState('')
  const [contactError, setContactError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [savedLead, setSavedLead] = useState<VisitorLead | null>(null)

  useEffect(() => {
    if (hasSeenLeadPrompt()) return

    let hasShown = false
    let idleTimer = 0
    let scrollSettleTimer = 0
    const initialScrollY = window.scrollY
    let lastScrollY = initialScrollY

    const showPrompt = () => {
      if (hasShown) return
      if (document.querySelector('.customizer-overlay, .order-cart-overlay')) {
        scheduleIdlePrompt()
        return
      }

      hasShown = true
      window.clearTimeout(idleTimer)
      window.clearTimeout(scrollSettleTimer)
      markLeadPromptShown()
      setIsVisible(true)
    }

    const scheduleIdlePrompt = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(showPrompt, 4500)
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const hasScrolledPastBounce = Math.abs(currentScrollY - initialScrollY) >= 80
      lastScrollY = currentScrollY
      scheduleIdlePrompt()
      window.clearTimeout(scrollSettleTimer)

      if (!hasScrolledPastBounce) return

      scrollSettleTimer = window.setTimeout(() => {
        const hasSettled = Math.abs(window.scrollY - lastScrollY) < 4
        const remainsPastBounce = Math.abs(window.scrollY - initialScrollY) >= 80
        if (hasSettled && remainsPastBounce) showPrompt()
      }, 1200)
    }

    const handleActivity = () => scheduleIdlePrompt()

    scheduleIdlePrompt()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pointermove', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)

    return () => {
      window.clearTimeout(idleTimer)
      window.clearTimeout(scrollSettleTimer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pointermove', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [])

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setContactError('')
    setSaveError('')

    const normalizedName = name.trim().slice(0, 100)
    const normalizedCity = city.trim().slice(0, 100)
    const normalizedContact = contact.trim().slice(0, 160)
    const emailLooksValid = EMAIL_PATTERN.test(normalizedContact)
    const phoneDigitCount = normalizedContact.replace(/\D/g, '').length

    if (!emailLooksValid && phoneDigitCount < 7) {
      setContactError('Enter a valid phone number or email address.')
      return
    }

    try {
      const lead = addVisitorLead({
        name: normalizedName,
        city: normalizedCity,
        contact: normalizedContact,
        sourcePath: window.location.pathname,
      })
      setSavedLead(lead)
    } catch {
      setSaveError('We couldn’t save your details just now. Please try again or reach us on WhatsApp.')
    }
  }

  if (!isVisible) return null

  const whatsappMessage = savedLead
    ? `Hi Kainchi Club, I just connected with the studio. My name is ${savedLead.name || 'a new visitor'}${savedLead.city ? ` from ${savedLead.city}` : ''}. Please reach out to me at ${savedLead.contact}.`
    : ''
  const whatsappHref = savedLead
    ? `https://wa.me/918863075356?text=${encodeURIComponent(whatsappMessage)}`
    : ''

  return (
    <section className="visitor-lead-card" role="dialog" aria-modal="false" aria-labelledby="visitor-lead-title">
      <div className="visitor-lead-topline">
        <p className="visitor-lead-kicker">KAINCHI CLUB · STUDIO ACCESS</p>
        <button className="visitor-lead-close" type="button" onClick={() => setIsVisible(false)} aria-label="Close lead form"><X aria-hidden="true" /></button>
      </div>
      <h2 id="visitor-lead-title">{savedLead ? 'You’re in the circle.' : 'Join the Inner Circle ✂️'}</h2>
      {savedLead ? (
        <div className="visitor-lead-success" aria-live="polite">
          <p>Thank you for connecting with Kainchi Club! ✨</p>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">Send an optional WhatsApp note <ArrowUpRight aria-hidden="true" /></a>
        </div>
      ) : (
        <>
          <p className="visitor-lead-copy">We’d love to know who’s exploring our studio art. Leave your mark to receive exclusive drops &amp; insider privileges.</p>
          <form className="visitor-lead-form" onSubmit={submitLead} noValidate>
            <label className="sr-only" htmlFor="visitor-lead-name">Name</label>
            <input id="visitor-lead-name" className="visitor-lead-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Your Name" autoComplete="name" />
            <label className="sr-only" htmlFor="visitor-lead-city">City / Place</label>
            <input id="visitor-lead-city" className="visitor-lead-input" value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} placeholder="Your City / State" autoComplete="address-level2" />
            <label className="sr-only" htmlFor="visitor-lead-contact">Phone Number or Email ID</label>
            <input id="visitor-lead-contact" className="visitor-lead-input" value={contact} onChange={(event) => { setContact(event.target.value); setContactError('') }} maxLength={160} placeholder="Phone Number or Email ID" autoComplete="email" aria-invalid={Boolean(contactError)} aria-describedby={contactError ? 'visitor-lead-contact-error' : undefined} required />
            {contactError && <p className="visitor-lead-error" id="visitor-lead-contact-error" role="alert">{contactError}</p>}
            {saveError && <p className="visitor-lead-error" role="alert">{saveError}</p>}
            <button className="visitor-lead-submit" type="submit">Connect with Studio</button>
          </form>
        </>
      )}
    </section>
  )
}

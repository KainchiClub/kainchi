'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const POLICIES = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    summary: 'Your order details stay with the studio for fulfillment.',
    sections: [
      { label: 'Order details.', text: 'Customer name, phone number, and delivery address are used strictly to confirm and dispatch orders.' },
      { label: 'No third-party sharing.', text: 'We do not sell or share these personal details with third parties.' },
    ],
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    summary: 'A clear, direct agreement for ordering from Kainchi Club.',
    sections: [
      { label: 'Order confirmation.', text: 'An order inquiry is not confirmed until availability, size, packaging, price, and payment details are agreed directly with the studio on WhatsApp.' },
      { label: 'Payment and dispatch.', text: 'Payment and dispatch arrangements are confirmed with you before an order is finalized.' },
      { label: 'Genuine platform use.', text: 'Use the website for genuine shopping and studio communication. Attempts to disrupt, misuse, or interfere with the platform are not permitted.' },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery Policy',
    summary: 'Pan-India dispatch, with updates shared directly in WhatsApp.',
    sections: [
      { label: 'Dispatch window.', text: 'Orders are dispatched across India within 3–5 working days after confirmation and payment.' },
      { label: 'Courier partners.', text: 'Shipments are sent through verified courier partners.' },
      { label: 'Tracking updates.', text: 'Live tracking updates are shared through WhatsApp. Delivery timing may vary by destination and courier.' },
    ],
  },
  {
    id: 'returns',
    title: 'Refund, Return & Cancellation Policy',
    summary: 'Returns are subject to the garment condition and request window below.',
    sections: [
      { label: 'Authenticity and condition.', text: 'Garments must be unworn and unwashed, with the original Kainchi Club price and brand tags completely intact. If any tag is broken, torn, or missing, the return or refund will be rejected.' },
      { label: 'Return window.', text: 'Raise a return request within 24 hours of delivery. If you were unavailable during the delivery attempt, place the request within 48–72 hours of package delivery.' },
      { label: 'How to start a return.', text: 'Initiate the request on WhatsApp by scanning the unique barcode on the packaging box. The studio will verify the request and garment condition.' },
      { label: 'Cancellations.', text: 'Contact the studio on WhatsApp as soon as possible to request a cancellation. A cancellation may not be possible after dispatch.' },
    ],
  },
] as const

type PolicyId = (typeof POLICIES)[number]['id']

export function PolicyModals() {
  const [activePolicyId, setActivePolicyId] = useState<PolicyId | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const activePolicy = POLICIES.find((policy) => policy.id === activePolicyId)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (activePolicyId && !dialog.open) {
      dialog.showModal()
      closeButtonRef.current?.focus()
    } else if (!activePolicyId && dialog.open) {
      dialog.close()
    }
  }, [activePolicyId])

  return (
    <div className="footer-policy-links" role="group" aria-label="Store policies">
      {POLICIES.map((policy) => <button
        aria-controls="policy-dialog"
        aria-haspopup="dialog"
        className="footer-policy-link"
        key={policy.id}
        onClick={() => setActivePolicyId(policy.id)}
        type="button"
      >{policy.title}</button>)}
      <dialog
        aria-labelledby={activePolicy ? 'policy-dialog-title' : undefined}
        className="policy-dialog"
        id="policy-dialog"
        onCancel={(event) => { event.preventDefault(); setActivePolicyId(null) }}
        onClose={() => setActivePolicyId(null)}
        onClick={(event) => { if (event.target === dialogRef.current) setActivePolicyId(null) }}
        ref={dialogRef}
      >
        {activePolicy && <div className="policy-dialog-inner">
          <div className="policy-dialog-topline">
            <p>THE KAINCHI CLUB PROMISE</p>
            <button aria-label={`Close ${activePolicy.title}`} className="policy-dialog-close" onClick={() => setActivePolicyId(null)} ref={closeButtonRef} type="button"><X aria-hidden="true" /></button>
          </div>
          <div className="policy-dialog-content">
            <p className="policy-dialog-kicker">Policy details</p>
            <h2 id="policy-dialog-title">{activePolicy.title}</h2>
            <p className="policy-dialog-summary">{activePolicy.summary}</p>
            <div className="policy-dialog-sections">
              {activePolicy.sections.map((section) => <p key={section.label}><strong>{section.label}</strong> {section.text}</p>)}
            </div>
          </div>
          <div className="policy-dialog-footer"><span>Questions? Speak with the studio on WhatsApp.</span><a href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club%2C%20I%20have%20a%20policy%20question." target="_blank" rel="noreferrer">Contact the studio</a></div>
        </div>}
      </dialog>
    </div>
  )
}

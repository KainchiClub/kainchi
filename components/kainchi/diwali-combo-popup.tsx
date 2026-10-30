'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

const SESSION_KEY = 'kainchi_diwali_offer_expiry'
const REMEMBER_DURATION = 24 * 60 * 60 * 1000
const WHATSAPP_MESSAGE = 'Hi Kainchi Club, I am interested in claiming your exclusive Diwali Combo Offer. Please share the details!'
const WHATSAPP_HREF = `https://wa.me/918863075356?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const combos = [
  {
    number: '01',
    title: 'The Street Duo',
    description: '1 Raw Denim Jeans + 1 Heavy Fleece Sweatshirt',
    note: 'Special Festive Price',
  },
  {
    number: '02',
    title: 'Twin Warmth Set',
    description: '2 Premium Fleece Hoodies / Sweatshirts',
    note: 'Any 2 Artworks',
  },
  {
    number: '03',
    title: 'The Heritage Trio',
    description: '1 Vintage Leather Jacket + 1 Fleece Hoodie + 1 Denim Jeans',
    note: 'The Master Collector Set',
  },
]

function hasRememberedOffer() {
  try {
    const expiry = Number(window.sessionStorage.getItem(SESSION_KEY))
    return Number.isFinite(expiry) && expiry > Date.now()
  } catch {
    return true
  }
}

function rememberOffer() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(Date.now() + REMEMBER_DURATION))
  } catch {
    return
  }
}

export function DiwaliComboPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (hasRememberedOffer()) return

    let timer = 0
    const scheduleOffer = () => {
      timer = window.setTimeout(() => {
        if (hasRememberedOffer()) return
        if (document.querySelector('.customizer-overlay, .order-cart-overlay, dialog[open]')) {
          scheduleOffer()
          return
        }

        rememberOffer()
        setIsOpen(true)
      }, 2500)
    }

    scheduleOffer()
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  function closeOffer() {
    setIsOpen(false)
  }

  return (
    <dialog
      ref={dialogRef}
      className="diwali-combo-dialog"
      aria-labelledby="diwali-combo-title"
      aria-describedby="diwali-combo-subtitle"
      onCancel={(event) => {
        event.preventDefault()
        closeOffer()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) closeOffer()
      }}
    >
      <div className="diwali-combo-inner">
        <div className="diwali-combo-topline">
          <p className="diwali-combo-kicker">KAINCHI CLUB · FESTIVE EDITION</p>
          <button className="diwali-combo-close" type="button" onClick={closeOffer} aria-label="Close Diwali offer">
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="diwali-combo-overline">A little something for the season</p>
        <h2 id="diwali-combo-title">🪔 The Studio Diwali Drops — Limited Festival Combos</h2>
        <p className="diwali-combo-subtitle" id="diwali-combo-subtitle">Curated small-batch sets crafted for the season. Claim yours on WhatsApp before studio vaults close.</p>
        <div className="diwali-combo-grid">
          {combos.map((combo) => (
            <article className="diwali-combo-card" key={combo.title}>
              <span className="diwali-combo-number">{combo.number}</span>
              <h3>{combo.title}</h3>
              <p>{combo.description}</p>
              <span className="diwali-combo-note">{combo.note}</span>
            </article>
          ))}
        </div>
        <a className="diwali-combo-cta" href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
          Claim Diwali Offer on WhatsApp <ArrowUpRight aria-hidden="true" />
        </a>
        <p className="diwali-combo-footnote">Small-batch pieces, made with care at the studio.</p>
      </div>
    </dialog>
  )
}

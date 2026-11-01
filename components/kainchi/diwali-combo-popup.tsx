'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import { initialProducts } from './catalog'
import { referenceArtwork } from './hero-showcase'

const SESSION_KEY = 'kainchi_diwali_offer_expiry'
const productImages = new Map(initialProducts.map((product) => [product.id, product.image]))

function productThumbnail(productId: string) {
  return productImages.get(productId)?.replace(/=w\d+$/, '=w240') ?? ''
}
const REMEMBER_DURATION = 24 * 60 * 60 * 1000
const WHATSAPP_NUMBER = '918863075356'
const DEFAULT_WHATSAPP_MESSAGE = 'Hi Kainchi Club, I am interested in claiming your exclusive Diwali Combo Offer. Please share the details!'

function buildWhatsAppHref(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

const combos = [
  {
    id: 'street-duo',
    number: '01',
    title: 'The Street Duo',
    description: '1 Raw Denim Jeans + 1 Heavy Fleece Sweatshirt',
    note: 'Special Festive Price',
    whatsappMessage: 'Hi Kainchi Club! I want to claim the Diwali Special: The Street Duo combo (Jeans + Sweatshirt). Please share available designs and size details!',
    thumbnailImages: [productThumbnail('drive-04'), productThumbnail('drive-02')],
    thumbnailAlt: 'Painted Denim jeans paired with the Orbit Within fleece hoodie',
  },
  {
    id: 'twin-warmth',
    number: '02',
    title: 'Twin Warmth Set',
    description: '2 Premium Fleece Hoodies / Sweatshirts',
    note: 'Any 2 Artworks',
    whatsappMessage: 'Hi Kainchi Club! I want to claim the Diwali Special: Twin Warmth Set (2 Hoodies / Sweatshirts). Please share available options!',
    thumbnailImages: [productThumbnail('drive-02'), productThumbnail('drive-03')],
    thumbnailAlt: 'Orbit Within and Moonlit Valley fleece hoodie artwork previews',
  },
  {
    id: 'heritage-trio',
    number: '03',
    title: 'The Heritage Trio',
    description: '1 Vintage Leather Jacket + 1 Fleece Hoodie + 1 Denim Jeans',
    note: 'The Master Collector Set',
    whatsappMessage: 'Hi Kainchi Club! I want to claim the Diwali Special: The Heritage Trio (Leather Jacket + Hoodie + Denim). Please share how to proceed!',
    thumbnailImages: [referenceArtwork],
    thumbnailAlt: 'Studio collection leather jacket, hoodie, and illustrated denim shown together',
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
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectedCombo = combos.find((combo) => combo.id === selectedComboId)

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
        <div className="diwali-combo-sparkles" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span className="diwali-combo-sparkle" key={index} />)}
        </div>
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
            <a
              aria-current={selectedComboId === combo.id ? 'true' : undefined}
              aria-label={`${combo.title}: select and claim this combo on WhatsApp`}
              className="diwali-combo-card"
              data-selected={selectedComboId === combo.id ? 'true' : undefined}
              href={buildWhatsAppHref(combo.whatsappMessage)}
              key={combo.id}
              onClick={() => setSelectedComboId(combo.id)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="diwali-combo-number">{combo.number}</span>
              <div className="diwali-combo-feature">
                <div className="diwali-combo-thumbnail" role="img" aria-label={combo.thumbnailAlt}>
                  {isOpen && combo.thumbnailImages.map((image, index) => (
                    <Image
                      className="diwali-combo-thumbnail-image"
                      key={`${combo.number}-${index}`}
                      src={resolveDriveImageUrl(image)}
                      alt=""
                      width={240}
                      height={240}
                      sizes="70px"
                      loading="eager"
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                      unoptimized
                      onError={fallbackImageOnError}
                    />
                  ))}
                </div>
                <div className="diwali-combo-copy">
                  <h3>{combo.title}</h3>
                  <p>{combo.description}</p>
                </div>
              </div>
              <span className="diwali-combo-note">{combo.note}</span>
            </a>
          ))}
        </div>
        <a className="diwali-combo-cta" href={buildWhatsAppHref(selectedCombo?.whatsappMessage ?? DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
          Claim Diwali Offer on WhatsApp <ArrowUpRight aria-hidden="true" />
        </a>
        <p className="diwali-combo-footnote">Small-batch pieces, made with care at the studio.</p>
      </div>
    </dialog>
  )
}

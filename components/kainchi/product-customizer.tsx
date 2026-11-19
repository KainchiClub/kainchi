'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Clock, Eye, Layers, Minus, Plus, Ruler, ShoppingBag, Sparkles, X } from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { formatRupees, type CatalogProduct } from './catalog'
import { openSizeGuide } from './storefront-events'
import { FABRIC_COLORS, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, type CartLineDetails, type FabricColor } from './order'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

type StylistPiece = {
  slot: 'Bottoms' | 'Footwear' | 'Accent'
  name: string
  note: string
  estPrice: string
  swatchColor: string
  accentHex: string
  iconGlyph: string
}

function getSmartOutfitPairing(product: CatalogProduct): StylistPiece[] {
  const g = product.garment.toLowerCase()
  const t = product.theme.toLowerCase()

  if (g.includes('jacket') || g.includes('denim') || g.includes('bomber')) {
    return [
      {
        slot: 'Bottoms',
        name: 'Straight-Fit Vintage Washed Denim',
        note: '14 oz raw selvedge silhouette to balance structured outerwear',
        estPrice: 'Studio Pairing',
        swatchColor: '#1f2937',
        accentHex: '#93c5fd',
        iconGlyph: '👖',
      },
      {
        slot: 'Footwear',
        name: 'Distressed Leather Chelsea Boots',
        note: 'Stacked heel dark espresso or matte black leather',
        estPrice: 'Studio Pairing',
        swatchColor: '#291d18',
        accentHex: '#d4af37',
        iconGlyph: '🥾',
      },
      {
        slot: 'Accent',
        name: 'Oxidized Silver Cuff + Crossbody Sling',
        note: 'Hand-brushed sterling finish with matte hardware',
        estPrice: 'Studio Pairing',
        swatchColor: '#18181b',
        accentHex: '#e4e4e7',
        iconGlyph: '⛓️',
      },
    ]
  }

  if (g.includes('shirt') || g.includes('polo')) {
    return [
      {
        slot: 'Bottoms',
        name: 'Pleated Off-White Linen Trousers',
        note: 'Relaxed tailored drape for breathable luxury contrast',
        estPrice: 'Studio Pairing',
        swatchColor: '#f3ede2',
        accentHex: '#8b1e24',
        iconGlyph: '👖',
      },
      {
        slot: 'Footwear',
        name: 'Suede Penny Loafers',
        note: 'Hand-stitched sand or mocha suede low-profile sole',
        estPrice: 'Studio Pairing',
        swatchColor: '#5c4033',
        accentHex: '#f5e29f',
        iconGlyph: '👞',
      },
      {
        slot: 'Accent',
        name: 'Tortoiseshell Frames + Signet Ring',
        note: 'Warm acetate frame with engraved atelier signet',
        estPrice: 'Studio Pairing',
        swatchColor: '#3b2314',
        accentHex: '#d4af37',
        iconGlyph: '🕶️',
      },
    ]
  }

  return [
    {
      slot: 'Bottoms',
      name: t.includes('brahmand') ? 'Baggy Parachute Cargo Pants' : 'Heavyweight Stacked Sweatpants',
      note: '420 GSM relaxed streetwear drape with ankle toggle',
      estPrice: 'Studio Pairing',
      swatchColor: '#141414',
      accentHex: '#d4af37',
      iconGlyph: '👖',
    },
    {
      slot: 'Footwear',
      name: 'Chunky Studio Suede Trainers',
      note: 'Cream midsole with tonal charcoal suede overlays',
      estPrice: 'Studio Pairing',
      swatchColor: '#27272a',
      accentHex: '#f5efe6',
      iconGlyph: '👟',
    },
    {
      slot: 'Accent',
      name: 'Layered Silver Chain + Ribbed Crew Socks',
      note: 'Minimalist studio hardware & combed cotton socks',
      estPrice: 'Studio Pairing',
      swatchColor: '#1c1917',
      accentHex: '#e5e7eb',
      iconGlyph: '🧦',
    },
  ]
}

function getFabricTechSpec(garment: string) {
  const g = garment.toLowerCase()
  if (g.includes('hoodie') || g.includes('sweatshirt')) {
    return { gsm: '430 GSM French Terry', fit: 'Drop-Shoulder Boxy Fit', craft: 'Pre-shrunk, bio-washed, double-stitched seams' }
  }
  if (g.includes('jacket') || g.includes('denim')) {
    return { gsm: '14.5 OZ Heavy Twill / Denim', fit: 'Structured Atelier Cropped Fit', craft: 'Custom hardware, artisanal back-panel artwork' }
  }
  if (g.includes('shirt')) {
    return { gsm: '210 GSM Slub Cotton-Linen', fit: 'Relaxed Camp / Resort Drape', craft: 'High-density embroidery & mother-of-pearl buttons' }
  }
  return { gsm: '240 GSM Combed Ring-Spun Cotton', fit: 'Oversized Streetwear Drop-Shoulder', craft: 'Bio-washed breathable weave, high-definition print' }
}

type ProductCustomizerProps = {
  product: CatalogProduct
  defaultIncludesGiftBox: boolean
  onClose: () => void
  onAddToCart: (details: CartLineDetails) => void
  onOrderNow: (details: CartLineDetails) => void
}

export function ProductCustomizer({ product, defaultIncludesGiftBox, onClose, onAddToCart, onOrderNow }: ProductCustomizerProps) {
  const [size, setSize] = useState('M')
  const [color, setColor] = useState<FabricColor>(FABRIC_COLORS[0])
  const [quantity, setQuantity] = useState(1)
  const [includesGiftBox, setIncludesGiftBox] = useState(defaultIncludesGiftBox)
  const [activeInspectedPiece, setActiveInspectedPiece] = useState<StylistPiece | null>(null)
  const [isFullLookOpen, setIsFullLookOpen] = useState(false)
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)' })

  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const total = product.price * quantity + (includesGiftBox ? GIFT_BOX_PRICE * quantity : 0)
  const soldOut = product.stockStatus === 'sold-out'
  const orderDetails: CartLineDetails = { product, size, color, quantity, includesGiftBox }

  const stylistPieces = useMemo(() => getSmartOutfitPairing(product), [product])
  const techSpec = useMemo(() => getFabricTechSpec(product.garment), [product.garment])

  useEffect(() => {
    closeButtonRef.current?.focus()
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (document.querySelector('.size-guide-dialog[open]')) return
      if (event.key === 'Escape') {
        if (isFullLookOpen) {
          setIsFullLookOpen(false)
          return
        }
        if (activeInspectedPiece) {
          setActiveInspectedPiece(null)
          return
        }
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = document.querySelector('.customizer-dialog')
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', keepFocusInDialog)
    return () => window.removeEventListener('keydown', keepFocusInDialog)
  }, [onClose, isFullLookOpen, activeInspectedPiece])

  function handleVisualMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTiltStyle({
      transform: `perspective(900px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
    })
  }

  function handleVisualMouseLeave() {
    setTiltStyle({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' })
  }

  return (
    <div className="customizer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="customizer-dialog" role="dialog" aria-modal="true" aria-labelledby="customizer-title">
        <div className="customizer-topline">
          <div className="customizer-topline-start">
            <button type="button" className="overlay-back-button" onClick={onClose}><ArrowLeft aria-hidden="true" /> Back to Collection</button>
            <span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Make it yours</span>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="Close customization"><X /></button>
        </div>

        <div className="customizer-layout">
          <div className="customizer-visual-column">
            <div
              className="customizer-product-visual"
              onMouseMove={handleVisualMouseMove}
              onMouseLeave={handleVisualMouseLeave}
              style={{ ...tiltStyle, transition: 'transform 0.22s ease-out', willChange: 'transform' }}
            >
              <Image src={resolveDriveImageUrl(product.image, 900)} alt={`${product.title} custom ${product.garment}`} width={1200} height={1200} sizes="(max-width: 700px) 90vw, 40vw" loading="eager" fetchPriority="high" decoding="async" unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(product.image, 900))} draggable={false} onError={fallbackImageOnError} onContextMenu={(event) => event.preventDefault()} />
              <span className="customizer-image-label">{product.garment}</span>
            </div>
            <p className="customizer-fabric-label" aria-live="polite">Selected Fabric Color: <strong>{color.name}</strong></p>

            {/* GSM & FABRIC TECH PACK CARD */}
            <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(24, 18, 16, 0.05)', border: '1px solid rgba(24, 18, 16, 0.12)', fontSize: '12px', display: 'grid', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#181210' }}>
                <span>✦ ATELIER TECH PACK</span>
                <span style={{ color: '#8b1e24' }}>{techSpec.gsm}</span>
              </div>
              <span style={{ color: '#4a4038' }}><strong>Silhouette:</strong> {techSpec.fit}</span>
              <span style={{ color: '#5c5046' }}>{techSpec.craft}</span>
            </div>
          </div>

          <div className="customizer-options">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <p className="eyebrow eyebrow-dark" style={{ margin: 0 }}>CUSTOM ORDER</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: '#181210', color: '#f5e29f', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <Clock size={11} /> Crafted on Order · 5–7 Days Dispatch
              </span>
            </div>

            <h2 id="customizer-title">{product.title} <span className="customizer-product-code">· {product.productCode}</span></h2>
            <p className="customizer-category">{product.garment} <span>·</span> {product.theme}</p>
            <p style={{ fontSize: '12px', color: '#5c5046', margin: '4px 0 10px', lineHeight: 1.5 }}>
              To eliminate deadstock and ensure fresh print &amp; embroidery precision, this piece is individually crafted after your order is placed.
            </p>

            <fieldset className="option-group">
              <legend>Choose your size <span>S — 3XL</span></legend>
              <div className="size-options">{sizes.map((option) => <button type="button" key={option} className={`size-pill${size === option ? ' active' : ''}`} aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}</div>
              <button type="button" className="size-guide-trigger" onClick={openSizeGuide} aria-haspopup="dialog"><Ruler aria-hidden="true" /> Size Guide</button>
            </fieldset>

            <fieldset className="option-group quantity-group">
              <legend>Quantity <span>Up to {MAX_ORDER_QUANTITY} per design</span></legend>
              <div className="quantity-stepper" aria-label="Choose quantity">
                <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))}><Minus aria-hidden="true" /></button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" aria-label="Increase quantity" disabled={quantity >= MAX_ORDER_QUANTITY} onClick={() => setQuantity((current) => Math.min(MAX_ORDER_QUANTITY, current + 1))}><Plus aria-hidden="true" /></button>
              </div>
            </fieldset>

            <fieldset className="option-group color-group">
              <legend>Choose a color <span>{FABRIC_COLORS.length} premium options</span></legend>
              <div className="color-options">{FABRIC_COLORS.map((option) => <button type="button" key={option.name} className={`color-option${color.name === option.name ? ' active' : ''}`} aria-label={`Select ${option.name} fabric base color`} aria-pressed={color.name === option.name} title={option.name} onClick={() => setColor(option)}><span className="color-swatch" style={{ background: option.sample }}>{color.name === option.name && <Check aria-hidden="true" />}</span><span>{option.name}</span></button>)}</div>
            </fieldset>

            <label className="giftbox-option"><input type="checkbox" checked={includesGiftBox} onChange={(event) => setIncludesGiftBox(event.target.checked)} /><span className="giftbox-check" aria-hidden="true"><Check /></span><span><strong>Collector&apos;s Vault premium packaging</strong><small>Hand-finished, ready to gift <b>(+₹99 per item)</b></small></span></label>
            <div className="customizer-total"><span>Final calculated price</span><strong aria-live="polite">{formatRupees(total)}</strong></div>
            <p className="customizer-whatsapp-tip">Attach your custom artwork reference directly in WhatsApp if needed.</p>
            <div className="customizer-order-actions">
              <button className="button button-outline-dark" type="button" onClick={() => onAddToCart(orderDetails)} disabled={soldOut}><ShoppingBag aria-hidden="true" /> Add to cart</button>
              <button className="button button-crimson" type="button" onClick={() => { onOrderNow(orderDetails); onClose() }} disabled={soldOut}>{soldOut ? 'Sold Out' : 'Order on WhatsApp'}{!soldOut && <ArrowUpRight aria-hidden="true" />}</button>
            </div>
            <p className="customizer-footnote">{soldOut ? 'This piece is currently sold out.' : "Made-to-order atelier piece · We'll confirm dispatch timeline on WhatsApp."}</p>
          </div>
        </div>

        {/* INTERACTIVE AI ATELIER STYLIST WITH EYE VIEW + ARRANGE ALL OUTFITS TOGETHER */}
        <div
          style={{
            marginTop: '18px',
            padding: '16px 18px',
            borderRadius: '16px',
            background: '#181210',
            color: '#f5efe6',
            border: '1px solid rgba(212, 175, 55, 0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d4af37', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} /> AI ATELIER STYLIST · COMPLETE THE LOOK
            </span>
            <button
              type="button"
              onClick={() => setIsFullLookOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(212, 175, 55, 0.55)',
                background: 'rgba(212, 175, 55, 0.14)',
                color: '#f5e29f',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Layers size={13} /> Arrange All Outfits Together
            </button>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {stylistPieces.map((piece) => (
              <div
                key={piece.slot}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong style={{ color: '#d4af37', marginRight: '6px' }}>{piece.slot}:</strong>
                  <span>{piece.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInspectedPiece(piece)}
                  aria-label={`View ${piece.name}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(245, 226, 159, 0.4)',
                    background: 'rgba(245, 226, 159, 0.1)',
                    color: '#f5e29f',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Eye size={13} /> View
                </button>
              </div>
            ))}
          </div>

          {/* SINGLE ITEM SIDE PREVIEW POP-UP */}
          {activeInspectedPiece && (
            <div
              style={{
                marginTop: '12px',
                padding: '14px',
                borderRadius: '12px',
                background: '#241b18',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: activeInspectedPiece.swatchColor,
                    border: `1px solid ${activeInspectedPiece.accentHex}`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '24px',
                    flexShrink: 0,
                  }}
                >
                  {activeInspectedPiece.iconGlyph}
                </div>
                <div>
                  <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4af37' }}>
                    {activeInspectedPiece.slot} · {activeInspectedPiece.estPrice}
                  </span>
                  <h4 style={{ margin: '2px 0', fontSize: '15px', color: '#fff' }}>{activeInspectedPiece.name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#cfc5b8' }}>{activeInspectedPiece.note}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInspectedPiece(null)}
                aria-label="Close preview"
                style={{ background: 'none', border: 'none', color: '#f5efe6', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* FULL 4-LAYER OUTFIT LOOKBOARD MODAL */}
        {isFullLookOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Complete Look Arrangement"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 140,
              background: 'rgba(12, 9, 8, 0.82)',
              backdropFilter: 'blur(6px)',
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsFullLookOpen(false)
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                background: '#faf7f2',
                color: '#181210',
                borderRadius: '20px',
                padding: '22px',
                border: '1px solid rgba(212, 175, 55, 0.55)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8b1e24', fontWeight: 700 }}>
                  KAINCHI ATELIER · CURATED 4-LAYER LOOKBOARD
                </span>
                <button type="button" onClick={() => setIsFullLookOpen(false)} aria-label="Close lookboard" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'stretch' }}>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderRadius: '14px', background: '#181210', color: '#f5efe6' }}>
                  <img
                    src={resolveDriveImageUrl(product.image, 320)}
                    alt={product.title}
                    width={72}
                    height={72}
                    style={{ borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(212,175,55,0.5)' }}
                  />
                  <div>
                    <span style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '0.14em', textTransform: 'uppercase' }}>01 · HERO PIECE ({color.name})</span>
                    <h3 style={{ margin: '2px 0', fontSize: '16px' }}>{product.title}</h3>
                    <span style={{ fontSize: '12px', color: '#cfc5b8' }}>{product.garment} · Size {size}</span>
                  </div>
                </div>

                {stylistPieces.map((piece, idx) => (
                  <div
                    key={piece.slot}
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: '#fff',
                      border: '1px solid rgba(0,0,0,0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{piece.iconGlyph}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#8b1e24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      0{idx + 2} · {piece.slot}
                    </span>
                    <strong style={{ fontSize: '13px' }}>{piece.name}</strong>
                    <span style={{ fontSize: '11px', color: '#5c5046' }}>{piece.note}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsFullLookOpen(false)}
                style={{
                  marginTop: '14px',
                  width: '100%',
                  padding: '11px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#181210',
                  color: '#f5e29f',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Back to Customize {product.title}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

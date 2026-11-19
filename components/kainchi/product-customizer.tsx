'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  Minus,
  Pause,
  Play,
  Ruler,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { formatRupees, type CatalogProduct } from './catalog'
import { openSizeGuide } from './storefront-events'
import { FABRIC_COLORS, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, type CartLineDetails, type FabricColor } from './order'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

type StylistVariant = {
  name: string
  fabricNote: string
  fitTip: string
  imageUrl: string
  swatchHex: string
}

type StylistCategory = {
  slot: 'Bottoms' | 'Footwear' | 'Accent'
  primaryLabel: string
  variants: StylistVariant[]
}

function getSmartOutfitCategories(product: CatalogProduct): StylistCategory[] {
  const g = product.garment.toLowerCase()
  const t = product.theme.toLowerCase()

  if (g.includes('jacket') || g.includes('denim') || g.includes('bomber')) {
    return [
      {
        slot: 'Bottoms',
        primaryLabel: 'Selvedge Denim & Tailored Trousers',
        variants: [
          {
            name: '14 oz Raw Indigo Straight Denim',
            fabricNote: 'Heavyweight Japanese-weave selvedge denim',
            fitTip: 'Creates a crisp structured silhouette under cropped outerwear.',
            imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#1e293b',
          },
          {
            name: 'Charcoal Pleated Wide-Leg Trousers',
            fabricNote: 'Brushed wool-blend twill drape',
            fitTip: 'Elevates casual jackets into a sharp evening atelier look.',
            imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#27272a',
          },
          {
            name: 'Vintage Washed Black Carpenter Pants',
            fabricNote: 'Enzyme-washed 12 oz duck canvas',
            fitTip: 'Adds utilitarian streetwear attitude with relaxed ankle stack.',
            imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#18181b',
          },
        ],
      },
      {
        slot: 'Footwear',
        primaryLabel: 'Leather Boots & Heritage Trainers',
        variants: [
          {
            name: 'Espresso Leather Chelsea Boots',
            fabricNote: 'Full-grain calfskin with stacked leather sole',
            fitTip: 'Clean ankle line that pairs effortlessly with straight denim.',
            imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#3b2314',
          },
          {
            name: 'Matte Black Chunky Derby Shoes',
            fabricNote: 'Brushed box leather with lugged sole',
            fitTip: 'Brings modern runway weight to structured jackets.',
            imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#111111',
          },
          {
            name: 'Off-White Vintage Court Sneakers',
            fabricNote: 'Tumbled leather with suede toe cap',
            fitTip: 'Lightens dark outerwear for effortless daytime wear.',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#f5efe6',
          },
        ],
      },
      {
        slot: 'Accent',
        primaryLabel: 'Atelier Hardware & Eyewear',
        variants: [
          {
            name: 'Brushed Silver Cuff & Signet Ring',
            fabricNote: '925 sterling-finish oxidized metal',
            fitTip: 'Subtle metallic gleam at the wrist without overpowering artwork.',
            imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#a1a1aa',
          },
          {
            name: 'Structured Crossbody Leather Sling',
            fabricNote: 'Pebbled full-grain leather with matte clasp',
            fitTip: 'Keeps daily essentials secure while layering.',
            imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#1c1917',
          },
          {
            name: 'Architectural Acetate Sunglasses',
            fabricNote: 'Hand-polished tortoiseshell frame with UV400 tint',
            fitTip: 'Sharpens the neckline and frames the collar.',
            imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#451a03',
          },
        ],
      },
    ]
  }

  if (g.includes('shirt') || g.includes('polo')) {
    return [
      {
        slot: 'Bottoms',
        primaryLabel: 'Pleated Linen & Tailored Denim',
        variants: [
          {
            name: 'Pleated Off-White Linen Trousers',
            fabricNote: 'Breathable 220 GSM European flax-linen blend',
            fitTip: 'Creates high-contrast resort luxury with dark or embroidered shirts.',
            imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#f3ede2',
          },
          {
            name: 'Tailored Jet-Black Straight Denim',
            fabricNote: '13 oz structured cotton denim, clean hem',
            fitTip: 'Keeps the focus entirely on the shirt’s chest & back artwork.',
            imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#18181b',
          },
          {
            name: 'Sandstone Relaxed Chino Trousers',
            fabricNote: 'Peached organic cotton twill',
            fitTip: 'Warm earthy tone that complements embroidery threads.',
            imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#d6c7b2',
          },
        ],
      },
      {
        slot: 'Footwear',
        primaryLabel: 'Suede Loafers & Minimal Sneakers',
        variants: [
          {
            name: 'Mocha Suede Penny Loafers',
            fabricNote: 'Hand-stitched velvet suede with leather welt',
            fitTip: 'Refined smart-casual finish for dinner or gallery evenings.',
            imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#5c4033',
          },
          {
            name: 'Minimalist Ivory Leather Sneakers',
            fabricNote: 'Full-grain calfskin low-top silhouette',
            fitTip: 'Crisp, clean proportions for all-day comfort.',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#faf7f2',
          },
          {
            name: 'Woven Tan Leather Fisherman Sandals',
            fabricNote: 'Vegetable-tanned artisanal leather straps',
            fitTip: 'Ideal for relaxed summer & vacation resort styling.',
            imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#92400e',
          },
        ],
      },
      {
        slot: 'Accent',
        primaryLabel: 'Sunglasses, Signet & Timepiece',
        variants: [
          {
            name: 'Tortoiseshell Frames + Engraved Signet',
            fabricNote: 'Hand-cured acetate & brushed gold-tone brass',
            fitTip: 'Adds vintage editorial character to open-collar shirts.',
            imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#451a03',
          },
          {
            name: 'Classic Leather-Strap Dress Watch',
            fabricNote: 'Slim champagne dial with stitched espresso strap',
            fitTip: 'Timeless wrist detail when sleeves are rolled once.',
            imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#291d18',
          },
          {
            name: 'Braided Leather & Silver Cuff Stack',
            fabricNote: 'Hand-woven Nappa leather with sterling clasp',
            fitTip: 'Textural contrast against smooth cotton-linen weaves.',
            imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#71717a',
          },
        ],
      },
    ]
  }

  // Default for Heavyweight Oversized Tees, Hoodies & Sweatshirts
  return [
    {
      slot: 'Bottoms',
      primaryLabel: t.includes('brahmand') ? 'Parachute Cargos & Stacked Fleece' : 'Streetwear Cargos & Wide Denim',
      variants: [
        {
          name: 'Heavyweight Charcoal Parachute Cargos',
          fabricNote: '320 GSM cotton-nylon ripstop with ankle toggles',
          fitTip: 'Balances oversized drop-shoulder tees & hoodies effortlessly.',
          imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#18181b',
        },
        {
          name: 'Vintage Stone-Washed Baggy Denim',
          fabricNote: '13.5 oz wide-leg street silhouette',
          fitTip: 'Classic skate & street proportion with bold back prints.',
          imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#334155',
        },
        {
          name: '430 GSM French Terry Stacked Sweatpants',
          fabricNote: 'Matching studio-grade combed loopback cotton',
          fitTip: 'Coordinated monochrome lounge-to-street luxury.',
          imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#27272a',
        },
      ],
    },
    {
      slot: 'Footwear',
      primaryLabel: 'Chunky Suede Trainers & High-Tops',
      variants: [
        {
          name: 'Cream & Charcoal Suede Studio Trainers',
          fabricNote: 'Layered suede panels with cushioned vintage sole',
          fitTip: 'Anchors wide-leg cargos and oversized silhouettes.',
          imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#e7e5e4',
        },
        {
          name: 'Retro Monochrome High-Top Sneakers',
          fabricNote: 'Full-grain leather upper with padded collar',
          fitTip: 'Adds clean vertical structure beneath cuffed hems.',
          imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#18181b',
        },
        {
          name: 'Suede Mule Clogs with Cork Footbed',
          fabricNote: 'Brushed taupe suede with ergonomic contour',
          fitTip: 'Effortless off-duty studio aesthetic.',
          imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#78716c',
        },
      ],
    },
    {
      slot: 'Accent',
      primaryLabel: 'Layered Chains, Caps & Totes',
      variants: [
        {
          name: 'Layered Curb Chain + Ribbed Crew Socks',
          fabricNote: 'Tarnish-resistant stainless steel + combed cotton',
          fitTip: 'Adds crisp metallic highlight at the crew neckline.',
          imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#d4d4d8',
        },
        {
          name: 'Heavy Canvas Atelier Studio Tote',
          fabricNote: '16 oz unbleached cotton duck with reinforced straps',
          fitTip: 'Practical everyday carry with raw editorial texture.',
          imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#f5efe6',
        },
        {
          name: 'Tinted Rectangular Street Frames',
          fabricNote: 'Lightweight acetate with amber studio lenses',
          fitTip: 'Completes the look with unmistakable character.',
          imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
          swatchHex: '#292524',
        },
      ],
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

  // Centered Visual Modal State (with 3-option auto-slider)
  const [inspectedCategory, setInspectedCategory] = useState<StylistCategory | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [isAutoSlidePlaying, setIsAutoSlidePlaying] = useState(true)
  const [isFullLookOpen, setIsFullLookOpen] = useState(false)
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)' })

  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const total = product.price * quantity + (includesGiftBox ? GIFT_BOX_PRICE * quantity : 0)
  const soldOut = product.stockStatus === 'sold-out'
  const orderDetails: CartLineDetails = { product, size, color, quantity, includesGiftBox }

  const stylistCategories = useMemo(() => getSmartOutfitCategories(product), [product])
  const techSpec = useMemo(() => getFabricTechSpec(product.garment), [product.garment])

  // Auto-slide every 3.5 seconds when the Visual Pairing Modal is open
  useEffect(() => {
    if (!inspectedCategory || !isAutoSlidePlaying || inspectedCategory.variants.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % inspectedCategory.variants.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [inspectedCategory, isAutoSlidePlaying])

  useEffect(() => {
    closeButtonRef.current?.focus()
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (document.querySelector('.size-guide-dialog[open]')) return
      if (event.key === 'Escape') {
        if (isFullLookOpen) {
          setIsFullLookOpen(false)
          return
        }
        if (inspectedCategory) {
          setInspectedCategory(null)
          return
        }
        onClose()
        return
      }
      if (inspectedCategory && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault()
        setIsAutoSlidePlaying(false)
        setActiveSlideIndex((prev) =>
          event.key === 'ArrowRight'
            ? (prev + 1) % inspectedCategory.variants.length
            : (prev - 1 + inspectedCategory.variants.length) % inspectedCategory.variants.length,
        )
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
  }, [onClose, isFullLookOpen, inspectedCategory])

  function openCategoryPreview(category: StylistCategory) {
    setActiveSlideIndex(0)
    setIsAutoSlidePlaying(true)
    setInspectedCategory(category)
  }

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

  const activeVariant = inspectedCategory ? inspectedCategory.variants[activeSlideIndex] ?? inspectedCategory.variants[0] : null

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

        {/* INTERACTIVE AI ATELIER STYLIST WITH LARGE VISUAL SLIDER POPUP */}
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
            <div>
              <span style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d4af37', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} /> AI ATELIER STYLIST · VISUAL LOOKBOOK
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#a89b8c' }}>
                Tap &ldquo;View 3 Looks&rdquo; on any row to preview large auto-sliding styling options.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullLookOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(212, 175, 55, 0.55)',
                background: 'rgba(212, 175, 55, 0.16)',
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
            {stylistCategories.map((cat) => (
              <div
                key={cat.slot}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <img
                    src={cat.variants[0].imageUrl}
                    alt={cat.variants[0].name}
                    width={38}
                    height={38}
                    style={{ borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(212,175,55,0.4)', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ color: '#d4af37', marginRight: '6px' }}>{cat.slot}:</strong>
                    <span>{cat.variants[0].name}</span>
                    <small style={{ display: 'block', fontSize: '11px', color: '#a89b8c' }}>
                      +{cat.variants.length - 1} more curated options inside
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCategoryPreview(cat)}
                  aria-label={`Preview ${cat.slot} styling options`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 13px',
                    borderRadius: '999px',
                    border: '1px solid rgba(245, 226, 159, 0.5)',
                    background: 'rgba(245, 226, 159, 0.14)',
                    color: '#f5e29f',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Eye size={14} /> View ({cat.variants.length})
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LARGE CENTERED VISUAL PAIRING POPUP WITH 3-OPTION AUTO-SLIDER */}
        {inspectedCategory && activeVariant && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${inspectedCategory.slot} Visual Lookbook`}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 145,
              background: 'rgba(10, 8, 7, 0.84)',
              backdropFilter: 'blur(8px)',
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setInspectedCategory(null)
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#faf7f2',
                color: '#181210',
                borderRadius: '22px',
                overflow: 'hidden',
                border: '1px solid rgba(212, 175, 55, 0.6)',
                boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
              }}
            >
              {/* Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#181210', color: '#f5efe6' }}>
                <div>
                  <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d4af37', fontWeight: 700, display: 'block' }}>
                    PAIRING FOR {product.title.toUpperCase()}
                  </span>
                  <strong style={{ fontSize: '14px' }}>
                    {inspectedCategory.slot} · Look 0{activeSlideIndex + 1} of 0{inspectedCategory.variants.length}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAutoSlidePlaying((p) => !p)}
                    title={isAutoSlidePlaying ? 'Pause auto-slide' : 'Resume auto-slide'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      border: '1px solid rgba(212,175,55,0.45)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#f5e29f',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {isAutoSlidePlaying ? <Pause size={11} /> : <Play size={11} />}
                    {isAutoSlidePlaying ? 'Auto' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedCategory(null)}
                    aria-label="Close styling popup"
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '999px', color: '#fff', width: '30px', height: '30px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Large 4:5 Editorial Image Container */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 4.2', background: '#1c1614', overflow: 'hidden' }}>
                <img
                  src={activeVariant.imageUrl}
                  alt={activeVariant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.35s ease' }}
                />

                {/* Mini Picture-in-Picture of User's Selected Kainchi Piece for Direct Comparison */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px 6px 6px',
                    borderRadius: '12px',
                    background: 'rgba(24, 18, 16, 0.86)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    color: '#f5efe6',
                  }}
                >
                  <img
                    src={resolveDriveImageUrl(product.image, 160)}
                    alt={product.title}
                    width={36}
                    height={36}
                    style={{ borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div style={{ fontSize: '10px', lineHeight: 1.25 }}>
                    <span style={{ color: '#d4af37', display: 'block', fontWeight: 700 }}>YOUR PIECE</span>
                    <span>{product.title}</span>
                  </div>
                </div>

                {/* Prev / Next Controls */}
                <button
                  type="button"
                  aria-label="Previous look"
                  onClick={() => {
                    setIsAutoSlidePlaying(false)
                    setActiveSlideIndex((prev) => (prev - 1 + inspectedCategory.variants.length) % inspectedCategory.variants.length)
                  }}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.35)',
                    background: 'rgba(24, 18, 16, 0.78)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next look"
                  onClick={() => {
                    setIsAutoSlidePlaying(false)
                    setActiveSlideIndex((prev) => (prev + 1) % inspectedCategory.variants.length)
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.35)',
                    background: 'rgba(24, 18, 16, 0.78)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={18} />
                </button>

                {/* Slide Indicator Dots */}
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', padding: '5px 10px', borderRadius: '999px', background: 'rgba(0,0,0,0.55)' }}>
                  {inspectedCategory.variants.map((v, idx) => (
                    <button
                      key={v.name}
                      type="button"
                      aria-label={`Show option ${idx + 1}: ${v.name}`}
                      onClick={() => {
                        setIsAutoSlidePlaying(false)
                        setActiveSlideIndex(idx)
                      }}
                      style={{
                        width: idx === activeSlideIndex ? '20px' : '8px',
                        height: '8px',
                        borderRadius: '999px',
                        border: 'none',
                        background: idx === activeSlideIndex ? '#f5e29f' : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Editorial Styling Caption */}
              <div style={{ padding: '16px 18px', display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: activeVariant.swatchHex, border: '1px solid rgba(0,0,0,0.25)', flexShrink: 0 }} />
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#181210' }}>{activeVariant.name}</h3>
                </div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#8b1e24' }}>{activeVariant.fabricNote}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#4a4038', lineHeight: 1.5 }}>{activeVariant.fitTip}</p>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoSlidePlaying(false)
                      setActiveSlideIndex((prev) => (prev + 1) % inspectedCategory.variants.length)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '999px',
                      border: '1px solid rgba(24,18,16,0.25)',
                      background: '#fff',
                      color: '#181210',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Next Option ({((activeSlideIndex + 1) % inspectedCategory.variants.length) + 1}/{inspectedCategory.variants.length}) →
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedCategory(null)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '999px',
                      border: 'none',
                      background: '#181210',
                      color: '#f5e29f',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Done Previewing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL 4-LAYER OUTFIT LOOKBOARD MODAL */}
        {isFullLookOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Complete Look Arrangement"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 145,
              background: 'rgba(12, 9, 8, 0.84)',
              backdropFilter: 'blur(8px)',
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
                maxWidth: '540px',
                background: '#faf7f2',
                color: '#181210',
                borderRadius: '22px',
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderRadius: '14px', background: '#181210', color: '#f5efe6' }}>
                  <img
                    src={resolveDriveImageUrl(product.image, 320)}
                    alt={product.title}
                    width={76}
                    height={76}
                    style={{ borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(212,175,55,0.5)' }}
                  />
                  <div>
                    <span style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '0.14em', textTransform: 'uppercase' }}>01 · HERO PIECE ({color.name})</span>
                    <h3 style={{ margin: '2px 0', fontSize: '16px' }}>{product.title}</h3>
                    <span style={{ fontSize: '12px', color: '#cfc5b8' }}>{product.garment} · Size {size}</span>
                  </div>
                </div>

                {stylistCategories.map((cat, idx) => (
                  <div
                    key={cat.slot}
                    style={{
                      padding: '10px',
                      borderRadius: '14px',
                      background: '#fff',
                      border: '1px solid rgba(0,0,0,0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <img
                      src={cat.variants[0].imageUrl}
                      alt={cat.variants[0].name}
                      style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#8b1e24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      0{idx + 2} · {cat.slot}
                    </span>
                    <strong style={{ fontSize: '13px' }}>{cat.variants[0].name}</strong>
                    <span style={{ fontSize: '11px', color: '#5c5046' }}>{cat.variants[0].fabricNote}</span>
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

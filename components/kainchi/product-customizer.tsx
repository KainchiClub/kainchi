'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, X } from 'lucide-react'
import { formatRupees, type CatalogProduct } from './catalog'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']
const giftBoxPrice = 99

const colors = [
  { name: 'Jet Black', sample: '#181715' },
  { name: 'Off-White / Natural Canvas', sample: '#e6dccb' },
  { name: 'Dark Charcoal Grey', sample: '#454340' },
  { name: 'Deep Crimson Red', sample: '#792333' },
  { name: 'Forest Green', sample: '#29483b' },
  { name: 'Chocolate Brown', sample: '#4b2d22' },
  { name: 'Navy Blue', sample: '#26364a' },
  { name: 'Black & Crimson Red split', sample: 'linear-gradient(90deg, #181715 50%, #792333 50%)' },
  { name: 'Off-White & Chocolate Brown split', sample: 'linear-gradient(90deg, #e6dccb 50%, #4b2d22 50%)' },
  { name: 'Charcoal & Vintage White split', sample: 'linear-gradient(90deg, #454340 50%, #f2e9d9 50%)' },
]

function createWhatsAppUrl(product: CatalogProduct, size: string, color: string, includesGiftBox: boolean, total: number) {
  const message = [
    `Hi Kainchi Club, I would like to order ${product.title}.`,
    `Product category: ${product.garment} · ${product.theme}`,
    `Size: ${size}`,
    `Color: ${color}`,
    `Premium gift box & unboxing packaging: ${includesGiftBox ? 'Yes (+₹99)' : 'No'}`,
    `Final total: ${formatRupees(total)}`,
  ].join('\n')

  return `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(message)}`
}

export function ProductCustomizer({ product, onClose }: { product: CatalogProduct; onClose: () => void }) {
  const [size, setSize] = useState('M')
  const [color, setColor] = useState(colors[0])
  const [includesGiftBox, setIncludesGiftBox] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const total = product.price + (includesGiftBox ? giftBoxPrice : 0)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
  }, [onClose])

  return (
    <div className="customizer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="customizer-dialog" role="dialog" aria-modal="true" aria-labelledby="customizer-title">
        <div className="customizer-topline"><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Make it yours</span><button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="Close customization"><X /></button></div>
        <div className="customizer-layout">
          <div className="customizer-product-visual">
            <img src={product.image} alt={`${product.title} custom ${product.garment}`} />
            <span className="customizer-image-label">{product.garment}</span>
            <span className="selected-color-tag"><span className="color-swatch" style={{ background: color.sample }} /><span>ACTIVE SCHEME<br /><strong>{color.name}</strong></span></span>
          </div>
          <div className="customizer-options">
            <p className="eyebrow eyebrow-dark">CUSTOM ORDER</p>
            <h2 id="customizer-title">{product.title}</h2>
            <p className="customizer-category">{product.garment} <span>·</span> {product.theme}</p>

            <fieldset className="option-group">
              <legend>Choose your size <span>S — 3XL</span></legend>
              <div className="size-options">{sizes.map((option) => <button type="button" key={option} className={`size-pill${size === option ? ' active' : ''}`} aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}</div>
            </fieldset>

            <fieldset className="option-group color-group">
              <legend>Choose a color <span>{colors.length} premium options</span></legend>
              <div className="color-options">{colors.map((option) => <button type="button" key={option.name} className={`color-option${color.name === option.name ? ' active' : ''}`} aria-label={option.name} aria-pressed={color.name === option.name} title={option.name} onClick={() => setColor(option)}><span className="color-swatch" style={{ background: option.sample }}>{color.name === option.name && <Check aria-hidden="true" />}</span><span>{option.name}</span></button>)}</div>
            </fieldset>

            <label className="giftbox-option"><input type="checkbox" checked={includesGiftBox} onChange={(event) => setIncludesGiftBox(event.target.checked)} /><span className="giftbox-check" aria-hidden="true"><Check /></span><span><strong>Add Premium Custom Gift Box &amp; Unboxing Packaging</strong><small>Hand-finished, ready to gift <b>(+₹99)</b></small></span></label>
            <div className="customizer-total"><span>Final price</span><strong aria-live="polite">{formatRupees(total)}</strong></div>
            <a className="button button-crimson customizer-order" href={createWhatsAppUrl(product, size, color.name, includesGiftBox, total)} target="_blank" rel="noreferrer">Order on WhatsApp <ArrowUpRight aria-hidden="true" /></a>
            <p className="customizer-footnote">We&apos;ll confirm availability and delivery details in WhatsApp.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { formatRupees, type CatalogProduct } from './catalog'
import { FABRIC_COLORS, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, type CartLineDetails, type FabricColor } from './order'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

type ProductCustomizerProps = {
  product: CatalogProduct
  onClose: () => void
  onAddToCart: (details: CartLineDetails) => void
  onOrderNow: (details: CartLineDetails) => void
}

export function ProductCustomizer({ product, onClose, onAddToCart, onOrderNow }: ProductCustomizerProps) {
  const [size, setSize] = useState('M')
  const [color, setColor] = useState<FabricColor>(FABRIC_COLORS[0])
  const [quantity, setQuantity] = useState(1)
  const [includesGiftBox, setIncludesGiftBox] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const total = product.price * quantity + (includesGiftBox ? GIFT_BOX_PRICE * quantity : 0)
  const orderDetails: CartLineDetails = { product, size, color, quantity, includesGiftBox }

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
            <span className="customizer-color-wash" style={{ background: color.sample }} aria-hidden="true" />
            <span className="customizer-image-label">{product.garment}</span>
            <span className="selected-color-tag"><span className="color-swatch" style={{ background: color.sample }} /><span>BASE COLOR<br /><strong>{color.name}</strong></span></span>
          </div>
          <div className="customizer-options">
            <p className="eyebrow eyebrow-dark">CUSTOM ORDER</p>
            <h2 id="customizer-title">{product.title}</h2>
            <p className="customizer-category">{product.garment} <span>·</span> {product.theme}</p>

            <fieldset className="option-group">
              <legend>Choose your size <span>S — 3XL</span></legend>
              <div className="size-options">{sizes.map((option) => <button type="button" key={option} className={`size-pill${size === option ? ' active' : ''}`} aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}</div>
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
              <p className="fabric-base-tag" aria-live="polite">Fabric Base Color: <strong>{color.name}</strong> (Print detail remains visible)</p>
            </fieldset>

            <label className="giftbox-option"><input type="checkbox" checked={includesGiftBox} onChange={(event) => setIncludesGiftBox(event.target.checked)} /><span className="giftbox-check" aria-hidden="true"><Check /></span><span><strong>Add Premium Custom Gift Box &amp; Unboxing Packaging</strong><small>Hand-finished, ready to gift <b>(+₹99 per item)</b></small></span></label>
            <div className="customizer-total"><span>Final calculated price</span><strong aria-live="polite">{formatRupees(total)}</strong></div>
            <div className="customizer-order-actions">
              <button className="button button-outline-dark" type="button" onClick={() => onAddToCart(orderDetails)}><ShoppingBag aria-hidden="true" /> Add to cart</button>
              <button className="button button-crimson" type="button" onClick={() => { onOrderNow(orderDetails); onClose() }}>Order on WhatsApp <ArrowUpRight aria-hidden="true" /></button>
            </div>
            <p className="customizer-footnote">We&apos;ll confirm availability and delivery details in WhatsApp.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

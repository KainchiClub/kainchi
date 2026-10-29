'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowUpRight, Check, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { formatRupees, type CatalogProduct } from './catalog'
import { FABRIC_COLORS, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, type CartLineDetails, type FabricColor } from './order'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

const teeMask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="white" d="M140 210 245 175 335 205 440 275 375 370 335 335 335 675 145 675 145 335 105 370 40 275z"/><path fill="white" d="M640 210 745 175 835 205 940 275 875 370 835 335 835 675 645 675 645 335 605 370 540 275z"/></svg>'
const teeBoardMask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="white" d="M355 200 405 180 455 200 515 245 485 305 455 290 455 640 325 640 325 290 295 305 275 245z"/></svg>'
const bomberBoardMask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="white" d="M355 200 410 180 465 200 525 250 490 335 460 310 460 650 310 650 310 310 280 335 245 250z"/></svg>'
const hoodieMask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="white" d="M190 245 220 195 280 180 340 195 370 245 430 275 485 335 410 425 365 385 365 720 135 720 135 385 90 425 15 335 70 275z"/><path fill="white" d="M690 245 720 195 780 180 840 195 870 245 930 275 985 335 910 425 865 385 865 720 635 720 635 385 590 425 515 335 570 275z"/></svg>'
const jeansMask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="white" d="M130 190 385 190 365 385 335 790 250 790 215 465 170 790 85 790 115 385z"/><path fill="white" d="M630 190 885 190 865 385 835 790 750 790 715 465 670 790 585 790 615 385z"/></svg>'

function garmentMaskUrl(product: CatalogProduct) {
  const isOuterwear = ['Fleece Hoodie', 'Zip-up Hoodie', 'Bomber Jacket', 'Denim Jacket', 'Printed Sweatshirt'].includes(product.garment)
  const mask = product.id === 'drive-05'
    ? teeBoardMask
    : product.id === 'drive-06'
      ? bomberBoardMask
      : product.garment === 'Denim Jeans'
      ? jeansMask
      : isOuterwear
        ? hoodieMask
        : teeMask
  return `url("data:image/svg+xml,${encodeURIComponent(mask)}")`
}

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
  const soldOut = product.stockStatus === 'sold-out'
  const maskStyle: CSSProperties = { background: color.sample, maskImage: garmentMaskUrl(product), WebkitMaskImage: garmentMaskUrl(product) }
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
            <div className="customizer-image-stage">
              <img src={product.image} alt={`${product.title} custom ${product.garment}`} />
              <span className="customizer-fabric-tint" style={maskStyle} aria-hidden="true" />
              <span className="customizer-image-label">{product.garment}</span>
            </div>
            <p className="customizer-fabric-label" aria-live="polite">Viewing Base Fabric: <strong>{color.name}</strong></p>
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
              <p className="fabric-base-tag">Print detail remains visible above the selected fabric base.</p>
            </fieldset>

            <label className="giftbox-option"><input type="checkbox" checked={includesGiftBox} onChange={(event) => setIncludesGiftBox(event.target.checked)} /><span className="giftbox-check" aria-hidden="true"><Check /></span><span><strong>Add Premium Custom Gift Box &amp; Unboxing Packaging</strong><small>Hand-finished, ready to gift <b>(+₹99 per item)</b></small></span></label>
            <div className="customizer-total"><span>Final calculated price</span><strong aria-live="polite">{formatRupees(total)}</strong></div>
            <div className="customizer-order-actions">
              <button className="button button-outline-dark" type="button" onClick={() => onAddToCart(orderDetails)} disabled={soldOut}><ShoppingBag aria-hidden="true" /> Add to cart</button>
              <button className="button button-crimson" type="button" onClick={() => { onOrderNow(orderDetails); onClose() }} disabled={soldOut}>{soldOut ? 'Sold Out' : 'Order on WhatsApp'}{!soldOut && <ArrowUpRight aria-hidden="true" />}</button>
            </div>
            <p className="customizer-footnote">{soldOut ? 'This piece is currently sold out.' : "We'll confirm availability and delivery details in WhatsApp."}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

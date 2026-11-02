'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Minus, Plus, Ruler, ShoppingBag, X } from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { formatRupees, type CatalogProduct } from './catalog'
import { FitSizeGuide } from './fit-size-guide'
import { FABRIC_COLORS, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, type CartLineDetails, type FabricColor } from './order'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

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
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sizeGuideDialogRef = useRef<HTMLDialogElement>(null)
  const sizeGuideCloseButtonRef = useRef<HTMLButtonElement>(null)
  const total = product.price * quantity + (includesGiftBox ? GIFT_BOX_PRICE * quantity : 0)
  const soldOut = product.stockStatus === 'sold-out'
  const orderDetails: CartLineDetails = { product, size, color, quantity, includesGiftBox }

  useEffect(() => {
    closeButtonRef.current?.focus()
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (document.querySelector('.size-guide-dialog[open]')) return
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

  useEffect(() => {
    const dialog = sizeGuideDialogRef.current
    if (!dialog) return

    if (isSizeGuideOpen && !dialog.open) {
      dialog.showModal()
      sizeGuideCloseButtonRef.current?.focus()
    } else if (!isSizeGuideOpen && dialog.open) {
      dialog.close()
    }
  }, [isSizeGuideOpen])

  return (
    <div className="customizer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="customizer-dialog" role="dialog" aria-modal="true" aria-labelledby="customizer-title">
        <div className="customizer-topline"><div className="customizer-topline-start"><button type="button" className="overlay-back-button" onClick={onClose}><ArrowLeft aria-hidden="true" /> Back to Collection</button><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Make it yours</span></div><button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="Close customization"><X /></button></div>
        <div className="customizer-layout">
          <div className="customizer-visual-column">
            <div className="customizer-product-visual">
              <Image src={resolveDriveImageUrl(product.image, 900)} alt={`${product.title} custom ${product.garment}`} width={1200} height={1200} sizes="(max-width: 700px) 90vw, 40vw" loading="eager" fetchPriority="high" decoding="async" unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(product.image, 900))} draggable={false} onError={fallbackImageOnError} onContextMenu={(event) => event.preventDefault()} />
              <span className="customizer-image-label">{product.garment}</span>
            </div>
            <p className="customizer-fabric-label" aria-live="polite">Selected Fabric Color: <strong>{color.name}</strong></p>
          </div>
          <div className="customizer-options">
            <p className="eyebrow eyebrow-dark">CUSTOM ORDER</p>
            <h2 id="customizer-title">{product.title} <span className="customizer-product-code">· {product.productCode}</span></h2>
            <p className="customizer-category">{product.garment} <span>·</span> {product.theme}</p>

            <fieldset className="option-group">
              <legend>Choose your size <span>S — 3XL</span></legend>
              <div className="size-options">{sizes.map((option) => <button type="button" key={option} className={`size-pill${size === option ? ' active' : ''}`} aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}</div>
              <button type="button" className="size-guide-trigger" onClick={() => setIsSizeGuideOpen(true)}><Ruler aria-hidden="true" /> Size &amp; Fit Guide</button>
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
            <div className="customizer-order-actions">
              <button className="button button-outline-dark" type="button" onClick={() => onAddToCart(orderDetails)} disabled={soldOut}><ShoppingBag aria-hidden="true" /> Add to cart</button>
              <button className="button button-crimson" type="button" onClick={() => { onOrderNow(orderDetails); onClose() }} disabled={soldOut}>{soldOut ? 'Sold Out' : 'Order on WhatsApp'}{!soldOut && <ArrowUpRight aria-hidden="true" />}</button>
            </div>
            <p className="customizer-footnote">{soldOut ? 'This piece is currently sold out.' : "We'll confirm availability and delivery details in WhatsApp."}</p>
          </div>
        </div>
      </section>
      <dialog
        ref={sizeGuideDialogRef}
        className="size-guide-dialog"
        aria-labelledby="size-guide-title"
        onCancel={(event) => { event.preventDefault(); setIsSizeGuideOpen(false) }}
        onClose={() => setIsSizeGuideOpen(false)}
      >
        <div className="size-guide-inner">
          <div className="size-guide-topline">
            <div>
              <p className="size-guide-kicker">KAINCHI CLUB · FIT NOTES</p>
              <h2 id="size-guide-title">Size &amp; Fit Guide</h2>
            </div>
            <button ref={sizeGuideCloseButtonRef} aria-label="Close size and fit guide" className="size-guide-close" onClick={() => setIsSizeGuideOpen(false)} type="button"><X aria-hidden="true" /></button>
          </div>
          <p className="size-guide-intro">All measurements are garment measurements in inches. <span className="size-guide-mobile-tip">Swipe tables sideways on smaller screens.</span></p>
          <FitSizeGuide variant="dark" />
          <section className="size-guide-category" aria-labelledby="size-guide-denim">
            <h3 id="size-guide-denim">Streetwear Denim Jeans</h3>
            <div className="size-guide-table-wrap">
              <table className="size-guide-table size-guide-denim-table">
                <caption className="sr-only">Streetwear denim jean waist sizes and fit notes</caption>
                <thead><tr><th scope="col">Waist (in)</th><th scope="col">Standard length</th><th scope="col">Fit</th></tr></thead>
                <tbody>
                  <tr><th scope="row">30</th><td>41–42 in</td><td>Relaxed Straight Fit</td></tr>
                  <tr><th scope="row">32</th><td>41–42 in</td><td>Relaxed Straight Fit</td></tr>
                  <tr><th scope="row">34</th><td>41–42 in</td><td>Relaxed Straight Fit</td></tr>
                  <tr><th scope="row">36</th><td>41–42 in</td><td>Relaxed Straight Fit</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          <p className="size-guide-tip"><strong>Pro tip</strong> Choose Standard / Regular Fit for a closer silhouette or Signature Streetwear Oversized for the relaxed drop-shoulder drape.</p>
        </div>
      </dialog>
    </div>
  )
}

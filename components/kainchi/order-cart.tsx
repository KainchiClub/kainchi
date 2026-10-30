'use client'

import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowUpRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatRupees } from './catalog'
import { FREE_GIFT_THRESHOLD, FREE_GIFT_VALUE, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, getCartLineTotal, getCartTotal, hasFreeGiftUnlocked, type CartLineItem } from './order'

type OrderCartProps = {
  items: CartLineItem[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onQuantityChange: (cartId: string, quantity: number) => void
  onGiftBoxChange: (cartId: string, includesGiftBox: boolean) => void
  onRemove: (cartId: string) => void
  onCheckout: () => void
}

export function OrderCart({ items, isOpen, onOpenChange, onQuantityChange, onGiftBoxChange, onRemove, onCheckout }: OrderCartProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const giftBoxCount = items.reduce((total, item) => total + (item.includesGiftBox ? item.quantity : 0), 0)
  const total = getCartTotal(items)
  const giftUnlocked = hasFreeGiftUnlocked(items)
  const amountUntilGift = Math.max(0, FREE_GIFT_THRESHOLD - total)

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
        return
      }
      if (event.key !== 'Tab') return
      const dialog = document.querySelector('.order-cart-dialog')
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
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
  }, [isOpen, onOpenChange])

  return (
    <>
      {items.length > 0 && !isOpen && (
        <button className="order-cart-trigger" type="button" onClick={() => onOpenChange(true)} aria-label={`View order, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}>
          <ShoppingBag aria-hidden="true" />
          <span>View order</span>
          <span className="order-cart-count" aria-live="polite">{itemCount}</span>
        </button>
      )}
      {isOpen && (
        <div className="order-cart-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false) }}>
          <section className="order-cart-dialog" role="dialog" aria-modal="true" aria-labelledby="order-cart-title">
            <div className="order-cart-header">
              <div>
                <button type="button" className="overlay-back-button" onClick={() => onOpenChange(false)}><ArrowLeft aria-hidden="true" /> Back to Collection</button>
                <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Order in progress</p>
                <h2 id="order-cart-title">Your order <span>({itemCount})</span></h2>
              </div>
              <button ref={closeButtonRef} className="icon-button" type="button" onClick={() => onOpenChange(false)} aria-label="Close order cart"><X /></button>
            </div>
            {items.length > 0 ? (
              <>
                <div className="order-cart-lines">
                  {items.map((item) => (
                    <article className="order-cart-line" key={item.cartId}>
                      <img src={item.product.image} alt="" draggable={false} onContextMenu={(event) => event.preventDefault()} />
                      <div className="order-cart-line-details">
                        <p className="order-cart-theme">{item.product.theme}</p>
                        <h3>{item.product.title}</h3>
                        <p>{item.product.garment} · {item.color.name} · Size {item.size}</p>
                        <label className="order-cart-giftbox">
                          <input type="checkbox" checked={item.includesGiftBox} onChange={(event) => onGiftBoxChange(item.cartId, event.target.checked)} />
                          <span>Collector&apos;s Vault premium packaging (+{formatRupees(GIFT_BOX_PRICE)} per item)</span>
                        </label>
                      </div>
                      <div className="order-cart-line-controls">
                        <div className="order-cart-quantity" aria-label={`Quantity for ${item.product.title}`}>
                          <button type="button" aria-label={`Decrease ${item.product.title} quantity`} disabled={item.quantity <= 1} onClick={() => onQuantityChange(item.cartId, Math.max(1, item.quantity - 1))}><Minus aria-hidden="true" /></button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button type="button" aria-label={`Increase ${item.product.title} quantity`} disabled={item.quantity >= MAX_ORDER_QUANTITY} onClick={() => onQuantityChange(item.cartId, Math.min(MAX_ORDER_QUANTITY, item.quantity + 1))}><Plus aria-hidden="true" /></button>
                        </div>
                        <strong className="order-cart-line-total">{formatRupees(getCartLineTotal(item))}</strong>
                        <button className="order-cart-remove" type="button" aria-label={`Remove ${item.product.title} from order`} onClick={() => onRemove(item.cartId)}><Trash2 aria-hidden="true" /><span>Remove</span></button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className={`order-cart-promo ${giftUnlocked ? 'is-unlocked' : ''}`} role="status" aria-live="polite">
                  <span className="order-cart-promo-symbol" aria-hidden="true">{giftUnlocked ? '🎉' : '🛒'}</span>
                  <p>{giftUnlocked ? <>Gift Unlocked: <strong>FREE KAINCHI SPECIAL GIFT (WORTH {formatRupees(FREE_GIFT_VALUE)})</strong> has been added to your order!</> : <>Spend <strong>{formatRupees(amountUntilGift)}</strong> more to unlock a <strong>FREE Special Gift (Worth {formatRupees(FREE_GIFT_VALUE)})</strong>!</>}</p>
                </div>
                <div className="order-cart-summary">
                  <p><span>Premium packaging upgrade</span><strong>{giftBoxCount > 0 ? `${formatRupees(GIFT_BOX_PRICE)} × ${giftBoxCount}` : 'Standard included'}</strong></p>
                  <p className="order-cart-total"><span>Total payable</span><strong>{formatRupees(total)}</strong></p>
                </div>
                <div className="order-cart-actions">
                  <button className="button button-crimson" type="button" onClick={onCheckout}>Order on WhatsApp <ArrowUpRight aria-hidden="true" /></button>
                  <button className="button button-outline-dark" type="button" onClick={() => onOpenChange(false)}>Continue shopping</button>
                </div>
              </>
            ) : (
              <div className="order-cart-empty">
                <ShoppingBag aria-hidden="true" />
                <p>Your order is empty.</p>
                <button className="button button-outline-dark" type="button" onClick={() => onOpenChange(false)}>Continue shopping</button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}

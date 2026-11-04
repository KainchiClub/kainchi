'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { formatRupees } from './catalog'
import { GIFT_BOX_PRICE, WHATSAPP_PHONE, getCartLineTotal, getCartTotal, type CartLineItem } from './order'

type DeliveryFields = {
  fullName: string
  address: string
  cityState: string
  pincode: string
}

type FieldErrors = Partial<Record<keyof DeliveryFields, string>>

const emptyFields: DeliveryFields = { fullName: '', address: '', cityState: '', pincode: '' }
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/

function validate(fields: DeliveryFields): FieldErrors {
  const errors: FieldErrors = {}
  if (fields.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (fields.address.trim().length < 8) errors.address = 'Please enter your full delivery address and landmark.'
  if (fields.cityState.trim().length < 3) errors.cityState = 'Please enter your city and state.'
  if (!PINCODE_PATTERN.test(fields.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.'
  return errors
}

export function createDeliveryOrderMessage(items: readonly CartLineItem[], fields: DeliveryFields) {
  const productBlocks = items.map((item) => [
    `- Product: ${item.product.title}${item.product.productCode ? ` (${item.product.productCode})` : ''}`,
    `- Size: ${item.size}`,
    `- Color: ${item.color.name}`,
    ...(item.quantity > 1 ? [`- Quantity: ${item.quantity}`] : []),
    ...(item.includesGiftBox ? [`- Packaging: Collector's Vault (+${formatRupees(GIFT_BOX_PRICE)} per item)`] : []),
    `- Price: ${formatRupees(getCartLineTotal(item))}`,
  ].join('\n'))

  return [
    'Hello Kainchi Club Studio, I would like to place an order for:',
    productBlocks.join('\n\n'),
    ...(items.length > 1 ? ['', `- Order Total: ${formatRupees(getCartTotal(items))}`] : []),
    '',
    'Shipping Details:',
    `- Name: ${fields.fullName.trim()}`,
    `- Address: ${fields.address.trim().replace(/\s*\n\s*/g, ', ')}`,
    `- City/State: ${fields.cityState.trim()}`,
    `- Pincode: ${fields.pincode.trim()}`,
    '',
    'Please share payment QR / UPI details to confirm my order.',
  ].join('\n')
}

function openWhatsApp(url: string) {
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) window.location.href = url
}

type DeliveryDetailsModalProps = {
  items: CartLineItem[] | null
  onClose: () => void
}

export function DeliveryDetailsModal({ items, onClose }: DeliveryDetailsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const [fields, setFields] = useState<DeliveryFields>(emptyFields)
  const [errors, setErrors] = useState<FieldErrors>({})
  const isOpen = Boolean(items && items.length > 0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      setErrors({})
      dialog.showModal()
      firstFieldRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function updateField(name: keyof DeliveryFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!items?.length) return
    const nextErrors = validate(fields)
    setErrors(nextErrors)
    const firstInvalid = (Object.keys(nextErrors) as (keyof DeliveryFields)[])[0]
    if (firstInvalid) {
      dialogRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    const message = createDeliveryOrderMessage(items, fields)
    openWhatsApp(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`)
    onClose()
  }

  const total = items ? getCartTotal(items) : 0
  const itemCount = items?.reduce((count, item) => count + item.quantity, 0) ?? 0

  return (
    <dialog
      ref={dialogRef}
      className="delivery-dialog"
      aria-labelledby="delivery-title"
      aria-describedby="delivery-subtitle"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClose={() => { if (isOpen) onClose() }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <form className="delivery-inner" onSubmit={handleSubmit} noValidate>
        <div className="size-guide-topline">
          <div>
            <p className="size-guide-kicker">KAINCHI CLUB · CHECKOUT</p>
            <h2 id="delivery-title">Delivery Details</h2>
          </div>
          <button aria-label="Close delivery details" className="size-guide-close" onClick={onClose} type="button"><X aria-hidden="true" /></button>
        </div>
        <p className="size-guide-intro" id="delivery-subtitle">One step. We&apos;ll send your order straight to the studio on WhatsApp.</p>

        {items && items.length > 0 && (
          <ul className="delivery-summary" aria-label="Order summary">
            {items.map((item) => (
              <li key={item.cartId}>
                <span className="delivery-summary-name">{item.product.title}<small>Size {item.size} · {item.color.name}{item.quantity > 1 ? ` · Qty ${item.quantity}` : ''}</small></span>
                <span className="delivery-summary-price">{formatRupees(getCartLineTotal(item))}</span>
              </li>
            ))}
            {items.length > 1 && <li className="delivery-summary-total"><span>Total · {itemCount} pieces</span><span>{formatRupees(total)}</span></li>}
          </ul>
        )}

        <div className="delivery-fields">
          <label className="delivery-field">
            <span>Full Name <abbr title="required" aria-hidden="true">*</abbr></span>
            <input ref={firstFieldRef} name="fullName" type="text" autoComplete="name" required maxLength={80} value={fields.fullName} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'delivery-error-fullName' : undefined} onChange={(event) => updateField('fullName', event.target.value)} placeholder="e.g. Aarav Sharma" />
            {errors.fullName && <small className="delivery-error" id="delivery-error-fullName">{errors.fullName}</small>}
          </label>
          <label className="delivery-field">
            <span>Delivery Address &amp; Landmark <abbr title="required" aria-hidden="true">*</abbr></span>
            <textarea name="address" autoComplete="street-address" required rows={3} maxLength={300} value={fields.address} aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'delivery-error-address' : undefined} onChange={(event) => updateField('address', event.target.value)} placeholder="House / flat, street, area, nearby landmark" />
            {errors.address && <small className="delivery-error" id="delivery-error-address">{errors.address}</small>}
          </label>
          <div className="delivery-field-row">
            <label className="delivery-field">
              <span>City &amp; State <abbr title="required" aria-hidden="true">*</abbr></span>
              <input name="cityState" type="text" autoComplete="address-level2" required maxLength={80} value={fields.cityState} aria-invalid={Boolean(errors.cityState)} aria-describedby={errors.cityState ? 'delivery-error-cityState' : undefined} onChange={(event) => updateField('cityState', event.target.value)} placeholder="e.g. New Delhi, Delhi" />
              {errors.cityState && <small className="delivery-error" id="delivery-error-cityState">{errors.cityState}</small>}
            </label>
            <label className="delivery-field">
              <span>Pincode <abbr title="required" aria-hidden="true">*</abbr></span>
              <input name="pincode" type="text" inputMode="numeric" autoComplete="postal-code" required maxLength={6} pattern="[1-9][0-9]{5}" value={fields.pincode} aria-invalid={Boolean(errors.pincode)} aria-describedby={errors.pincode ? 'delivery-error-pincode' : undefined} onChange={(event) => updateField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit" />
              {errors.pincode && <small className="delivery-error" id="delivery-error-pincode">{errors.pincode}</small>}
            </label>
          </div>
        </div>

        <button className="delivery-submit" type="submit">
          Proceed to WhatsApp (+91 88630 75356) <ArrowUpRight aria-hidden="true" />
        </button>
        <p className="delivery-footnote">Payment is confirmed on WhatsApp via UPI / QR. Your details are only used to ship your order.</p>
      </form>
    </dialog>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Copy, QrCode, Smartphone, X } from 'lucide-react'
import { formatRupees } from './catalog'
import { GIFT_BOX_PRICE, WHATSAPP_PHONE, getCartLineTotal, getCartTotal, type CartLineItem } from './order'
import {
  getBrowserSupabaseClient,
  getStoredCustomerSession,
  pickNextNonRepeatGift,
  setStoredCustomerSession,
  triggerStudioNotification,
} from '@/lib/kainchi-crm'

const GATEWAY_CLOUD_SETTINGS_KEY = 'kainchi-store-gateway-cloud-v1'

type DeliveryFields = {
  fullName: string
  address: string
  cityState: string
  pincode: string
  utrNumber: string
}

type FieldErrors = Partial<Record<keyof DeliveryFields, string>>

const emptyFields: DeliveryFields = { fullName: '', address: '', cityState: '', pincode: '', utrNumber: '' }
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/

function validate(fields: DeliveryFields): FieldErrors {
  const errors: FieldErrors = {}
  if (fields.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (fields.address.trim().length < 8) errors.address = 'Please enter your full delivery address and landmark.'
  if (fields.cityState.trim().length < 3) errors.cityState = 'Please enter your city and state.'
  if (!PINCODE_PATTERN.test(fields.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.'
  return errors
}

export function createDeliveryOrderMessage(
  items: readonly CartLineItem[],
  fields: DeliveryFields,
  brandName = 'Kainchi Club Studio',
) {
  const productBlocks = items.map((item) => [
    `- Product: ${item.product.title}${item.product.productCode ? ` (${item.product.productCode})` : ''}`,
    `- Size: ${item.size}`,
    `- Color: ${item.color.name}`,
    ...(item.quantity > 1 ? [`- Quantity: ${item.quantity}`] : []),
    ...(item.includesGiftBox ? [`- Packaging: Collector's Vault (+${formatRupees(GIFT_BOX_PRICE)} per item)`] : []),
    `- Price: ${formatRupees(getCartLineTotal(item))}`,
  ].join('\n'))

  const utr = fields.utrNumber.trim()

  return [
    `Hello ${brandName}, I would like to place an order for:`,
    productBlocks.join('\n\n'),
    ...(items.length > 1 ? ['', `- Order Total: ${formatRupees(getCartTotal(items))}`] : []),
    '',
    'Shipping Details:',
    `- Name: ${fields.fullName.trim()}`,
    `- Address: ${fields.address.trim().replace(/\s*\n\s*/g, ', ')}`,
    `- City/State: ${fields.cityState.trim()}`,
    `- Pincode: ${fields.pincode.trim()}`,
    '',
    utr
      ? `Payment Status: Paid via UPI (UTR / Ref: ${utr})`
      : 'Please share payment QR / UPI details to confirm my order.',
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
  const [configuredUpiId, setConfiguredUpiId] = useState('')
  const [configuredBrand, setConfiguredBrand] = useState('KAINCHI CLUB')
  const [configuredWhatsapp, setConfiguredWhatsapp] = useState(WHATSAPP_PHONE)
  const [showQrBox, setShowQrBox] = useState(true)
  const [copiedUpi, setCopiedUpi] = useState(false)

  const isOpen = Boolean(items && items.length > 0)

  useEffect(() => {
    if (!isOpen) return
    const member = getStoredCustomerSession()
    if (member?.full_name) {
      setFields((current) => (current.fullName.trim() ? current : { ...current, fullName: member.full_name }))
    }
    try {
      const raw = window.localStorage.getItem(GATEWAY_CLOUD_SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.upiId === 'string') setConfiguredUpiId(parsed.upiId.trim())
        if (typeof parsed.brandName === 'string' && parsed.brandName.trim()) setConfiguredBrand(parsed.brandName.trim())
        if (typeof parsed.whatsappNumber === 'string' && parsed.whatsappNumber.trim()) {
          setConfiguredWhatsapp(parsed.whatsappNumber.replace(/\D/g, '') || WHATSAPP_PHONE)
        }
      }
    } catch {}
  }, [isOpen])

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

  const total = items ? getCartTotal(items) : 0
  const itemCount = items?.reduce((count, item) => count + item.quantity, 0) ?? 0

  const upiDeepLink = useMemo(() => {
    if (!configuredUpiId || total <= 0) return ''
    const params = new URLSearchParams({
      pa: configuredUpiId,
      pn: configuredBrand,
      am: total.toFixed(2),
      cu: 'INR',
      tn: `${configuredBrand} Order`,
    })
    return `upi://pay?${params.toString()}`
  }, [configuredUpiId, configuredBrand, total])

  const upiQrImageUrl = useMemo(() => {
    if (!upiDeepLink) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(upiDeepLink)}`
  }, [upiDeepLink])

  function handleCopyUpi() {
    if (!configuredUpiId) return
    navigator.clipboard?.writeText(configuredUpiId).catch(() => {})
    setCopiedUpi(true)
    window.setTimeout(() => setCopiedUpi(false), 2000)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!items?.length) return
    const nextErrors = validate(fields)
    setErrors(nextErrors)
    const firstInvalid = (Object.keys(nextErrors) as (keyof DeliveryFields)[])[0]
    if (firstInvalid) {
      dialogRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    const message = createDeliveryOrderMessage(items, fields, configuredBrand)
    const member = getStoredCustomerSession()
    const nextOrderSequence = (member?.total_orders ?? 0) + 1
    const assignedGift = pickNextNonRepeatGift(nextOrderSequence, member?.last_gift_sent)
    const supabase = getBrowserSupabaseClient()

    if (supabase) {
      try {
        if (member) {
          const updatedOrders = nextOrderSequence
          const updatedSpent = Number(member.total_spent || 0) + total
          await supabase
            .from('customers')
            .update({
              total_orders: updatedOrders,
              total_spent: updatedSpent,
              last_gift_sent: assignedGift,
              last_order_at: new Date().toISOString(),
            })
            .eq('email', member.email)

          setStoredCustomerSession({
            ...member,
            total_orders: updatedOrders,
            total_spent: updatedSpent,
            last_gift_sent: assignedGift,
          })
        }

        await supabase.from('orders').insert({
          customer_email: member?.email ?? null,
          customer_phone: member?.phone ?? null,
          order_sequence: nextOrderSequence,
          gift_assigned: assignedGift,
          delivery_status: 'Processing',
        })
      } catch {}
    }

    await triggerStudioNotification({
      eventType: 'order_placed',
      customerName: fields.fullName.trim(),
      customerEmail: member?.email ?? '',
      customerPhone: member?.phone ?? '',
      orderSummary: message,
      orderTotal: total,
      orderSequence: nextOrderSequence,
      giftAssigned: assignedGift,
    })

    openWhatsApp(`https://wa.me/${configuredWhatsapp}?text=${encodeURIComponent(message)}`)
    onClose()
  }

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
            <p className="size-guide-kicker">{configuredBrand} · CHECKOUT</p>
            <h2 id="delivery-title">Delivery &amp; Express Payment</h2>
          </div>
          <button aria-label="Close delivery details" className="size-guide-close" onClick={onClose} type="button"><X aria-hidden="true" /></button>
        </div>
        <p className="size-guide-intro" id="delivery-subtitle">
          {configuredUpiId
            ? 'Pay instantly via UPI / QR or confirm your order straight on WhatsApp.'
            : "One step. We'll send your order straight to the studio on WhatsApp."}
        </p>

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

        {configuredUpiId && total > 0 && (
          <div
            style={{
              margin: '14px 0',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              background: 'rgba(212, 175, 55, 0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: '#8b1e24' }}>
                Instant Bank UPI · {formatRupees(total)}
              </span>
              <button
                type="button"
                onClick={() => setShowQrBox((s) => !s)}
                style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <QrCode size={13} /> {showQrBox ? 'Hide QR' : 'Show QR'}
              </button>
            </div>

            {showQrBox && upiQrImageUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                <img
                  src={upiQrImageUrl}
                  alt={`UPI QR Code for ${formatRupees(total)}`}
                  width={156}
                  height={156}
                  style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.12)', background: '#fff', padding: '6px' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  <a
                    href={upiDeepLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '9999px',
                      background: '#111111',
                      color: '#f5e29f',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Smartphone size={14} /> Pay {formatRupees(total)} via UPI App
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(0,0,0,0.2)',
                      background: '#fff',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                    {copiedUpi ? 'Copied UPI ID' : configuredUpiId}
                  </button>
                </div>
              </div>
            )}

            <label className="delivery-field" style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '12px' }}>UPI Transaction ID / 12-Digit UTR (Optional if paid above)</span>
              <input
                name="utrNumber"
                type="text"
                maxLength={32}
                value={fields.utrNumber}
                onChange={(event) => updateField('utrNumber', event.target.value)}
                placeholder="e.g. 432198765432"
              />
            </label>
          </div>
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
          {fields.utrNumber.trim()
            ? 'Confirm Paid Order on WhatsApp'
            : `Proceed to WhatsApp (+${configuredWhatsapp})`} <ArrowUpRight aria-hidden="true" />
        </button>
        <p className="delivery-footnote">
          {configuredUpiId
            ? 'Direct bank UPI transfer with instant WhatsApp receipt. Your details are only used to ship your order.'
            : 'Payment is confirmed on WhatsApp via UPI / QR. Your details are only used to ship your order.'}
        </p>
      </form>
    </dialog>
  )
}

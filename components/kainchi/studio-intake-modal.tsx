'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { WHATSAPP_PHONE } from './order'
import { requestStudioIntake, STUDIO_INTAKE_EVENT, type StudioIntakeRequest } from './studio-intake'

const garmentOptions = [
  'Oversized Boxy Tee',
  'Heavy Fleece Hoodie',
  'Vintage Denim Jeans',
  'Bomber/Leather Jacket',
] as const

const colorOptions = [
  'Vintage Washed Black',
  'Deep Crimson',
  'Natural Raw Cream',
  'Distressed Indigo',
] as const

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'] as const

const budgetOptions = [
  'Under ₹2,000',
  '₹2,000 to ₹4,000',
  "₹4,000+ Luxury Collector's Tier",
] as const

type IntakeFields = {
  garment: string
  color: string
  size: string
  budget: string
}

const emptyFields: IntakeFields = { garment: '', color: '', size: '', budget: '' }

function initialFieldsFor(request: StudioIntakeRequest): IntakeFields {
  const firstItem = request.items?.[0]
  if (!firstItem) return emptyFields

  const garment = firstItem.garment.toLowerCase()
  const mappedGarment = /jean/.test(garment)
    ? 'Vintage Denim Jeans'
    : /tee|t-shirt|shirt/.test(garment)
      ? 'Oversized Boxy Tee'
      : /hoodie|fleece|sweatshirt/.test(garment)
        ? 'Heavy Fleece Hoodie'
        : /jacket|bomber|leather/.test(garment)
          ? 'Bomber/Leather Jacket'
          : ''

  const color = firstItem.color.toLowerCase()
  const mappedColor = /crimson|red/.test(color)
    ? 'Deep Crimson'
    : /cream|white|off-white/.test(color)
      ? 'Natural Raw Cream'
      : /indigo|navy|blue/.test(color)
        ? 'Distressed Indigo'
        : /black|charcoal/.test(color)
          ? 'Vintage Washed Black'
          : ''

  const size = sizeOptions.includes(firstItem.size as (typeof sizeOptions)[number])
    ? firstItem.size
    : ''
  const budget = firstItem.price < 2000
    ? budgetOptions[0]
    : firstItem.price <= 4000
      ? budgetOptions[1]
      : budgetOptions[2]

  return { garment: mappedGarment, color: mappedColor, size, budget }
}

function isWhatsAppUrl(value: string) {
  try {
    const url = new URL(value)
    return ['wa.me', 'api.whatsapp.com', 'www.whatsapp.com'].includes(url.hostname)
  } catch {
    return false
  }
}

function getSafeWhatsAppUrl(value?: string) {
  if (value && isWhatsAppUrl(value)) return value
  const message = 'Hi Kainchi Club, I would like to chat with the studio directly.'
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}

function makeIntakeMessage(fields: IntakeFields, request: StudioIntakeRequest) {
  const productNames = [...new Set((request.items ?? []).map((item) => item.productName.trim()).filter(Boolean))]
  const productSuffix = productNames.length > 0 ? ` / ${productNames.join(', ')}` : ''

  return [
    '--------------------------------------------------',
    '✂️ *KAINCHI CLUB — STUDIO INTAKE SUMMARY* ✂️',
    '--------------------------------------------------',
    `• Interested In: ${fields.garment}${productSuffix}`,
    `• Color Choice: ${fields.color}`,
    `• Size: ${fields.size}`,
    `• Budget Range: ${fields.budget}`,
    '',
    '"Hi Kainchi Club, I have submitted my styling preferences via the studio portal. Please share available matching pieces and payment confirmation steps!"',
    '--------------------------------------------------',
  ].join('\n')
}

export function StudioIntakeModal() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const garmentSelectRef = useRef<HTMLSelectElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [request, setRequest] = useState<StudioIntakeRequest>({})
  const [fields, setFields] = useState<IntakeFields>(emptyFields)

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const nextRequest = (event as CustomEvent<StudioIntakeRequest>).detail ?? {}
      setRequest(nextRequest)
      setFields(initialFieldsFor(nextRequest))
      setIsOpen(true)
    }

    const interceptWhatsAppLinks = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return

      const anchor = event.target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || !isWhatsAppUrl(anchor.href)) return
      if (anchor.closest('.studio-intake-dialog, .diwali-combo-dialog, .diwali-welcome-popup, .diwali-welcome-dialog, .collector-vault, .visitor-lead-card')) return

      event.preventDefault()
      event.stopImmediatePropagation()
      requestStudioIntake({ directUrl: anchor.href })
    }

    window.addEventListener(STUDIO_INTAKE_EVENT, handleRequest)
    window.addEventListener('click', interceptWhatsAppLinks, true)

    return () => {
      window.removeEventListener(STUDIO_INTAKE_EVENT, handleRequest)
      window.removeEventListener('click', interceptWhatsAppLinks, true)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
      garmentSelectRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const hasCompleteIntake = Object.values(fields).every(Boolean)

  function updateField(field: keyof IntakeFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
  }

  function proceedToWhatsApp() {
    if (!hasCompleteIntake) return

    const message = makeIntakeMessage(fields, request)
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="studio-intake-dialog"
      aria-labelledby="studio-intake-title"
      aria-describedby="studio-intake-subtitle"
      onClose={() => setIsOpen(false)}
    >
      <div className="studio-intake-inner">
        <div className="studio-intake-topline">
          <p className="studio-intake-kicker">KAINCHI CLUB · STUDIO INTAKE</p>
          <button className="studio-intake-close" type="button" aria-label="Close studio intake" onClick={() => dialogRef.current?.close()}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="studio-intake-heading">
          <h2 id="studio-intake-title"><span aria-hidden="true">✂️ </span>Personalize Your Studio Request</h2>
          <p id="studio-intake-subtitle">Help our artisans match the exact piece, fit, and style for you.</p>
        </div>

        <div className="studio-intake-fields">
          <label className="studio-intake-field" htmlFor="studio-intake-garment">
            <span>Garment Category</span>
            <select
              ref={garmentSelectRef}
              id="studio-intake-garment"
              value={fields.garment}
              onChange={(event) => updateField('garment', event.target.value)}
            >
              <option value="">Choose a category</option>
              {garmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="studio-intake-field" htmlFor="studio-intake-color">
            <span>Preferred Color / Wash</span>
            <select id="studio-intake-color" value={fields.color} onChange={(event) => updateField('color', event.target.value)}>
              <option value="">Choose a color or wash</option>
              {colorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <fieldset className="studio-intake-field studio-intake-size-field">
            <legend>Fit &amp; Size</legend>
            <div className="studio-intake-size-options">
              {sizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`studio-intake-size-option${fields.size === option ? ' selected' : ''}`}
                  aria-pressed={fields.size === option}
                  onClick={() => updateField('size', option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <details className="studio-intake-size-guide">
              <summary>Size Guide</summary>
              <div className="studio-intake-size-guide-content">
                <p>Garment measurements in inches. Choose your usual size for a relaxed fit.</p>
                <div className="studio-intake-size-table-wrap">
                  <table>
                    <caption className="sr-only">Kainchi Club tee and hoodie measurements in inches</caption>
                    <thead><tr><th scope="col">Size</th><th scope="col">Tee chest</th><th scope="col">Tee length</th><th scope="col">Hoodie chest</th><th scope="col">Hoodie length</th></tr></thead>
                    <tbody>
                      <tr><th scope="row">S</th><td>42</td><td>28</td><td>44</td><td>27</td></tr>
                      <tr><th scope="row">M</th><td>44</td><td>29</td><td>46</td><td>28</td></tr>
                      <tr><th scope="row">L</th><td>46</td><td>30</td><td>48</td><td>29</td></tr>
                      <tr><th scope="row">XL</th><td>48</td><td>31</td><td>50</td><td>30</td></tr>
                      <tr><th scope="row">XXL</th><td>50</td><td>32</td><td>52</td><td>31</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="studio-intake-size-note">For denim, jacket, or a closer fit, the studio can confirm measurements before checkout.</p>
              </div>
            </details>
          </fieldset>

          <label className="studio-intake-field" htmlFor="studio-intake-budget">
            <span>Target Price Range</span>
            <select id="studio-intake-budget" value={fields.budget} onChange={(event) => updateField('budget', event.target.value)}>
              <option value="">Choose a budget range</option>
              {budgetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="studio-intake-actions">
          <button className="studio-intake-proceed" type="button" onClick={proceedToWhatsApp} disabled={!hasCompleteIntake}>
            Proceed to Studio WhatsApp ➔
          </button>
          <a
            className="studio-intake-skip"
            href={getSafeWhatsAppUrl(request.directUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => dialogRef.current?.close()}
          >
            Skip &amp; chat directly on WhatsApp
          </a>
        </div>
        {!hasCompleteIntake && <p className="studio-intake-hint">Choose all four preferences to prepare your studio note.</p>}
      </div>
    </dialog>
  )
}

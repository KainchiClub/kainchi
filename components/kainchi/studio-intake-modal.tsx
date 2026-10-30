'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { WHATSAPP_PHONE } from './order'
import { requestStudioIntake, STUDIO_INTAKE_EVENT, type StudioIntakeRequest } from './studio-intake'

const garmentOptions = [
  'Oversized Tee',
  'Heavy Fleece Hoodie',
  'Sweatshirt',
  'Denim Jeans',
  'Bomber/Leather Jacket',
  'Combo Set',
] as const

const colorOptions = [
  'Vintage Washed Black',
  'Deep Crimson',
  'Raw Cream/Beige',
  'Distressed Indigo',
  'Custom Color',
] as const

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'] as const

const budgetOptions = [
  'Under ₹2,000',
  '₹2,000 - ₹3,500',
  '₹3,500 - ₹5,000',
  '₹5,000+ Luxury Collector Tier',
] as const

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const acceptedImageExtensions = /\.(jpe?g|png|webp)$/i
const maxReferencePhotos = 5
const maxReferencePhotoSize = 10 * 1024 * 1024

type IntakeFields = {
  garments: string[]
  colors: string[]
  customColor: string
  sizes: string[]
  budget: string
}

type ReferencePhoto = {
  id: string
  file: File
  previewUrl: string
}

const emptyFields: IntakeFields = { garments: [], colors: [], customColor: '', sizes: [], budget: '' }

function garmentOptionFor(garment: string, productName: string) {
  const value = `${garment} ${productName}`.toLowerCase()
  if (/combo|trio|set/.test(value)) return 'Combo Set'
  if (/denim|jean/.test(value)) return 'Denim Jeans'
  if (/bomber|jacket|leather/.test(value)) return 'Bomber/Leather Jacket'
  if (/sweatshirt/.test(value)) return 'Sweatshirt'
  if (/hoodie|fleece/.test(value)) return 'Heavy Fleece Hoodie'
  if (/tee|t-shirt|shirt/.test(value)) return 'Oversized Tee'
  return ''
}

function colorOptionFor(color: string) {
  const value = color.toLowerCase()
  if (/crimson|red/.test(value)) return 'Deep Crimson'
  if (/cream|beige|white|off-white/.test(value)) return 'Raw Cream/Beige'
  if (/indigo|navy|blue/.test(value)) return 'Distressed Indigo'
  if (/black|charcoal/.test(value)) return 'Vintage Washed Black'
  return ''
}

function budgetOptionFor(price: number) {
  if (price < 2000) return budgetOptions[0]
  if (price <= 3500) return budgetOptions[1]
  if (price <= 5000) return budgetOptions[2]
  return budgetOptions[3]
}

function initialFieldsFor(request: StudioIntakeRequest): IntakeFields {
  const items = request.items ?? []
  const garments = [...new Set(items.map((item) => garmentOptionFor(item.garment, item.productName)).filter(Boolean))]
  const colors = [...new Set(items.map((item) => colorOptionFor(item.color)).filter(Boolean))]
  const sizes = [...new Set(items.map((item) => item.size).filter((size) => sizeOptions.includes(size as (typeof sizeOptions)[number])))]

  return {
    garments,
    colors,
    customColor: '',
    sizes,
    budget: items.length > 0 ? budgetOptionFor(items[0].price) : '',
  }
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

function makeIntakeMessage(fields: IntakeFields, request: StudioIntakeRequest, photoCount: number) {
  const productNames = [...new Set((request.items ?? []).map((item) => item.productName.trim()).filter(Boolean))]
  const productSuffix = productNames.length > 0 ? ` — ${productNames.join(', ')}` : ''
  const selectedColors = fields.colors.map((color) => (
    color === 'Custom Color' && fields.customColor.trim()
      ? `Custom Color: ${fields.customColor.trim()}`
      : color
  ))
  const photoReminder = `📎 ${photoCount} custom reference ${photoCount === 1 ? 'photo' : 'photos'} ready to send`

  return [
    '--------------------------------------------------',
    '✂️ *KAINCHI CLUB — CUSTOM STUDIO INTAKE* ✂️',
    '--------------------------------------------------',
    `• Selected Garments: ${fields.garments.join(', ')}${productSuffix}`,
    `• Color/Wash Preferences: ${selectedColors.join(', ')}`,
    `• Sizes Required: ${fields.sizes.join(', ')}`,
    `• Budget Range: ${fields.budget}`,
    `• Reference Photos: ${photoReminder} (attach them here for discussion)`,
    '',
    '"Hi Kainchi Club! I have prepared my custom requirements and reference ideas. Sharing them here for review!"',
    '--------------------------------------------------',
  ].join('\n')
}

export function StudioIntakeModal() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstGarmentRef = useRef<HTMLButtonElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<ReferencePhoto[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [request, setRequest] = useState<StudioIntakeRequest>({})
  const [fields, setFields] = useState<IntakeFields>(emptyFields)
  const [photos, setPhotos] = useState<ReferencePhoto[]>([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
  }, [])

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const nextRequest = (event as CustomEvent<StudioIntakeRequest>).detail ?? {}
      setRequest(nextRequest)
      setFields(initialFieldsFor(nextRequest))
      setUploadStatus('')
      setIsDragging(false)
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
      firstGarmentRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const hasCompleteIntake = fields.garments.length > 0
    && fields.colors.length > 0
    && fields.sizes.length > 0
    && Boolean(fields.budget)
    && (!fields.colors.includes('Custom Color') || Boolean(fields.customColor.trim()))

  function toggleOption(field: 'garments' | 'colors' | 'sizes', value: string) {
    setFields((current) => {
      const selected = current[field].includes(value)
      const nextValues = selected
        ? current[field].filter((option) => option !== value)
        : [...current[field], value]
      return { ...current, [field]: nextValues }
    })
  }

  function addPhotos(files: File[]) {
    const imageFiles = files.filter((file) => acceptedImageTypes.has(file.type) || acceptedImageExtensions.test(file.name))
    const invalidTypeCount = files.length - imageFiles.length
    const sizeValidFiles = imageFiles.filter((file) => file.size <= maxReferencePhotoSize)
    const oversizedCount = imageFiles.length - sizeValidFiles.length
    const availableSlots = Math.max(0, maxReferencePhotos - photosRef.current.length)
    const acceptedFiles = sizeValidFiles.slice(0, availableSlots)
    const skippedForLimit = sizeValidFiles.length - acceptedFiles.length
    const addedPhotos = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    if (addedPhotos.length > 0) {
      const nextPhotos = [...photosRef.current, ...addedPhotos]
      photosRef.current = nextPhotos
      setPhotos(nextPhotos)
    }

    const messages = [
      addedPhotos.length > 0 ? `${addedPhotos.length} photo${addedPhotos.length === 1 ? '' : 's'} added.` : '',
      invalidTypeCount > 0 ? `${invalidTypeCount} file${invalidTypeCount === 1 ? '' : 's'} skipped. Use JPG, PNG, or WEBP images.` : '',
      oversizedCount > 0 ? 'Each photo must be 10MB or smaller.' : '',
      skippedForLimit > 0 ? 'You can attach up to 5 photos.' : '',
    ].filter(Boolean)

    setUploadStatus(messages.join(' '))
  }

  function removePhoto(photoId: string) {
    const removedPhoto = photosRef.current.find((photo) => photo.id === photoId)
    if (removedPhoto) URL.revokeObjectURL(removedPhoto.previewUrl)

    const nextPhotos = photosRef.current.filter((photo) => photo.id !== photoId)
    photosRef.current = nextPhotos
    setPhotos(nextPhotos)
    setUploadStatus('Reference photo removed.')
  }

  function proceedToWhatsApp() {
    if (!hasCompleteIntake) return

    const message = makeIntakeMessage(fields, request, photos.length)
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
          <fieldset className="studio-intake-field studio-intake-choice-field">
            <legend>Garment Category</legend>
            <div className="studio-intake-choice-options">
              {garmentOptions.map((option, index) => (
                <button
                  key={option}
                  ref={index === 0 ? firstGarmentRef : undefined}
                  type="button"
                  className={`studio-intake-choice${fields.garments.includes(option) ? ' selected' : ''}`}
                  aria-pressed={fields.garments.includes(option)}
                  onClick={() => toggleOption('garments', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="studio-intake-field studio-intake-choice-field">
            <legend>Preferred Color / Wash</legend>
            <div className="studio-intake-choice-options">
              {colorOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`studio-intake-choice${fields.colors.includes(option) ? ' selected' : ''}`}
                  aria-pressed={fields.colors.includes(option)}
                  onClick={() => toggleOption('colors', option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {fields.colors.includes('Custom Color') && (
              <label className="studio-intake-custom-color" htmlFor="studio-intake-custom-color">
                <span>Describe your custom color</span>
                <input
                  id="studio-intake-custom-color"
                  type="text"
                  maxLength={48}
                  value={fields.customColor}
                  placeholder="e.g. rust brown or washed olive"
                  onChange={(event) => setFields((current) => ({ ...current, customColor: event.target.value }))}
                />
              </label>
            )}
          </fieldset>

          <fieldset className="studio-intake-field studio-intake-size-field">
            <legend>Fit &amp; Size</legend>
            <div className="studio-intake-size-options">
              {sizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`studio-intake-size-option${fields.sizes.includes(option) ? ' selected' : ''}`}
                  aria-pressed={fields.sizes.includes(option)}
                  onClick={() => toggleOption('sizes', option)}
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
            <span>Price Range</span>
            <select id="studio-intake-budget" value={fields.budget} onChange={(event) => setFields((current) => ({ ...current, budget: event.target.value }))}>
              <option value="">Choose a budget range</option>
              {budgetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <section className="studio-intake-upload" aria-labelledby="studio-intake-upload-title">
          <div className="studio-intake-upload-heading">
            <h3 id="studio-intake-upload-title"><span aria-hidden="true">📎 </span>Attach Custom References / Art Ideas (Up to 5 photos)</h3>
            <span className="studio-intake-photo-count">{photos.length}/{maxReferencePhotos}</span>
          </div>
          <label
            className={`studio-intake-dropzone${isDragging ? ' dragging' : ''}${photos.length >= maxReferencePhotos ? ' full' : ''}`}
            htmlFor="studio-intake-photos"
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              addPhotos(Array.from(event.dataTransfer.files))
            }}
          >
            <span className="studio-intake-dropzone-title">Drop photos here or tap to upload</span>
            <span className="studio-intake-dropzone-note">JPG, PNG, or WEBP · up to 10MB each</span>
          </label>
          <input
            ref={photoInputRef}
            className="sr-only"
            id="studio-intake-photos"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            disabled={photos.length >= maxReferencePhotos}
            aria-label="Attach up to five JPG, PNG, or WEBP reference photos"
            onChange={(event) => {
              addPhotos(Array.from(event.currentTarget.files ?? []))
              event.currentTarget.value = ''
            }}
          />
          {photos.length > 0 && (
            <ul className="studio-intake-photo-list" aria-label="Attached reference photo previews">
              {photos.map((photo, index) => (
                <li className="studio-intake-photo" key={photo.id}>
                  <img src={photo.previewUrl} alt={`Reference photo ${index + 1}: ${photo.file.name}`} />
                  <button type="button" aria-label={`Remove ${photo.file.name}`} onClick={() => removePhoto(photo.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
          {uploadStatus && <p className="studio-intake-upload-status" role="status" aria-live="polite">{uploadStatus}</p>}
          <p className="studio-intake-upload-note">Photos will be prepared for your studio inquiry. Tap below to share them directly with our artisan on WhatsApp. After WhatsApp opens, attach the photos from your device.</p>
        </section>

        <div className="studio-intake-actions">
          <button className="studio-intake-proceed" type="button" onClick={proceedToWhatsApp} disabled={!hasCompleteIntake}>
            Proceed to Studio WhatsApp →
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
        {!hasCompleteIntake && (
          <p className="studio-intake-hint">
            {fields.colors.includes('Custom Color') && !fields.customColor.trim()
              ? 'Describe your custom color and choose at least one garment, size, and price range.'
              : 'Choose at least one garment, color, size, and price range to prepare your studio note.'}
          </p>
        )}
      </div>
    </dialog>
  )
}

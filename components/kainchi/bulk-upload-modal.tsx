'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { ArrowUpRight, Check, FileImage, Plus, Upload, X } from 'lucide-react'
import { ARTWORK_THEMES, formatRupees, GARMENT_TYPES, type ArtworkTheme, type GarmentType } from './catalog'

export type BatchArtwork = {
  file: File
  title: string
  price: number
}

export type BatchUpload = {
  garment: GarmentType
  theme: ArtworkTheme
  items: BatchArtwork[]
}

type UploadDraft = {
  id: string
  file: File
  title: string
  priceOverride: string
  previewUrl: string
}

type BulkUploadModalProps = {
  onClose: () => void
  onPublish: (batch: BatchUpload) => void
}

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function BulkUploadModal({ onClose, onPublish }: BulkUploadModalProps) {
  const [drafts, setDrafts] = useState<UploadDraft[]>([])
  const [garment, setGarment] = useState<GarmentType>('Fleece Hoodie')
  const [theme, setTheme] = useState<ArtworkTheme>('Nature & Scenic')
  const [basePrice, setBasePrice] = useState('2499')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previewUrls = useRef(new Set<string>())

  useEffect(() => {
    closeButtonRef.current?.focus()
    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = document.querySelector('.bulk-upload-modal')
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]):not(.visually-hidden), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
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
    return () => {
      window.removeEventListener('keydown', keepFocusInDialog)
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [onClose])

  function addFiles(files: File[]) {
    const nextDrafts: UploadDraft[] = []
    const errors: string[] = []

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: not an image`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: over 10 MB`)
        return
      }
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      nextDrafts.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        title: titleFromFilename(file.name),
        priceOverride: '',
        previewUrl,
      })
    })

    if (nextDrafts.length) setDrafts((current) => [...current, ...nextDrafts])
    setError(errors.length ? `Skipped ${errors.slice(0, 3).join(' · ')}${errors.length > 3 ? ` · and ${errors.length - 3} more` : ''}` : '')
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(event.dataTransfer.files))
  }

  function updateDraft(id: string, property: 'title' | 'priceOverride', value: string) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, [property]: value } : draft))
  }

  function removeDraft(id: string) {
    setDrafts((current) => {
      const draft = current.find((item) => item.id === id)
      if (draft) {
        URL.revokeObjectURL(draft.previewUrl)
        previewUrls.current.delete(draft.previewUrl)
      }
      return current.filter((item) => item.id !== id)
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const defaultPrice = Number(basePrice)
    if (!drafts.length) {
      setError('Choose at least one product photo to publish.')
      return
    }
    if (!Number.isFinite(defaultPrice) || defaultPrice <= 0) {
      setError('Enter a valid batch price greater than zero.')
      return
    }
    const invalidPrice = drafts.find((draft) => draft.priceOverride && (!Number.isFinite(Number(draft.priceOverride)) || Number(draft.priceOverride) <= 0))
    if (invalidPrice) {
      setError(`Enter a valid individual price for ${invalidPrice.title || invalidPrice.file.name}.`)
      return
    }

    onPublish({
      garment,
      theme,
      items: drafts.map((draft) => ({
        file: draft.file,
        title: draft.title.trim() || titleFromFilename(draft.file.name),
        price: draft.priceOverride ? Number(draft.priceOverride) : defaultPrice,
      })),
    })
  }

  return (
    <div className="upload-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="upload-modal bulk-upload-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title" aria-describedby="bulk-upload-description">
        <div className="modal-topline"><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Kainchi studio / catalog manager</span><button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="Close bulk upload"><X /></button></div>
        <div className="modal-heading"><p className="eyebrow eyebrow-dark">BULK UPLOAD ARTWORKS / PRODUCTS</p><h2 id="bulk-upload-title">A whole new <em>collection.</em></h2><p id="bulk-upload-description">Drop in a batch of artwork photos. Each one becomes its own product and artwork card.</p></div>
        <form className="bulk-upload-form" onSubmit={submit}>
          <input ref={fileInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={onFilesSelected} aria-label="Choose multiple artwork and product photos" />
          <button type="button" className={`bulk-dropzone${isDragging ? ' dragging' : ''}`} onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}>
            <span className="dropzone-icon"><Upload aria-hidden="true" /></span><strong>Drop your product photos here</strong><span>Select 10, 20, 50 or more at once · JPG, PNG or WEBP · up to 10 MB each</span><span className="button button-outline-dark dropzone-button"><Plus aria-hidden="true" /> Choose multiple photos</span>
          </button>

          <div className="batch-config">
            <div className="batch-config-heading"><span>Batch configuration</span><span>Applied to every photo</span></div>
            <div className="batch-config-grid">
              <label className="form-field"><span>Garment type</span><select value={garment} onChange={(event) => setGarment(event.target.value as GarmentType)}>{GARMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label className="form-field"><span>Theme / sub-category</span><select value={theme} onChange={(event) => setTheme(event.target.value as ArtworkTheme)}>{ARTWORK_THEMES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="form-field"><span>Base selling price</span><div className="price-input-wrap"><span>₹</span><input type="number" min="1" step="1" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} aria-label="Batch base selling price in rupees" /></div></label>
            </div>
          </div>

          <div className="upload-queue-heading"><div><strong>Selected photos</strong><span aria-live="polite">{drafts.length} {drafts.length === 1 ? 'item' : 'items'} ready</span></div>{drafts.length > 0 && <button type="button" className="queue-add-button" onClick={() => fileInput.current?.click()}><Plus aria-hidden="true" /> Add more</button>}</div>
          {drafts.length > 0 ? <div className="upload-queue">{drafts.map((draft, index) => <article className="upload-queue-row" key={draft.id}><img src={draft.previewUrl} alt={`Preview of ${draft.file.name}`} loading="lazy" /><span className="queue-index">{String(index + 1).padStart(2, '0')}</span><label className="queue-name"><span>Product name</span><input value={draft.title} onChange={(event) => updateDraft(draft.id, 'title', event.target.value)} aria-label={`Product name for ${draft.file.name}`} /></label><label className="queue-price"><span>Price</span><span className="price-input-wrap"><span>₹</span><input type="number" min="1" step="1" placeholder={String(Number(basePrice) || 0)} value={draft.priceOverride} onChange={(event) => updateDraft(draft.id, 'priceOverride', event.target.value)} aria-label={`Individual price for ${draft.title || draft.file.name}; leave empty to use batch price`} /></span></label><span className="queue-inherited-price">{draft.priceOverride ? 'Custom price' : `Batch: ${formatRupees(Number(basePrice) || 0)}`}</span><button className="queue-remove" type="button" onClick={() => removeDraft(draft.id)} aria-label={`Remove ${draft.file.name}`}><X aria-hidden="true" /></button></article>)}</div> : <div className="queue-empty"><FileImage aria-hidden="true" /><span>Your selected product photos will appear here.</span></div>}

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><p>Published cards appear in both the collection and artwork library immediately.</p><button className="button button-crimson" type="submit" disabled={!drafts.length}><Check aria-hidden="true" /> Publish {drafts.length || ''} {drafts.length === 1 ? 'product' : 'products'} <ArrowUpRight aria-hidden="true" /></button></div>
        </form>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, ImagePlus, LoaderCircle, Link2, Upload, X } from 'lucide-react'
import { ARTWORK_THEMES, GARMENT_TYPES, getNextArticleCode, getNextProductCode, getSmartPrice, type ArtworkTheme, type CatalogProduct, type GarmentType } from '@/components/kainchi/catalog'
import { fallbackImageOnError, IMAGE_FALLBACK, resolveDriveImageUrl } from '@/lib/utils'

const MAX_WIDTH = 1600
const RETIRED_SKU_KEY = 'kainchi-retired-sku-vault-v1'
const UPLOAD_GARMENT_TYPES: readonly UploadGarmentType[] = [...GARMENT_TYPES, 'Co-ords']
type ArtDensity = 'Minimal Art' | 'Medium Art' | 'Heavy Art'
type UploadGarmentType = GarmentType | 'Co-ords'
type RetiredSku = { articleCode: string; title: string; deletedAt: string; image: string; overrideApprovedAt?: string }
type UploadItem = {
  id: string
  name: string
  preview: string
  sourceImage: string
  isLocalPreview: boolean
  title: string
  garment: UploadGarmentType
  theme: ArtworkTheme
  density: ArtDensity
  price: string
  status: 'optimizing' | 'ready' | 'error'
  size?: number
  error?: string
}

function readRetiredSkus(): RetiredSku[] { try { const value = JSON.parse(window.localStorage.getItem(RETIRED_SKU_KEY) ?? '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
function writeRetiredSkus(items: RetiredSku[]) { window.localStorage.setItem(RETIRED_SKU_KEY, JSON.stringify(items)) }

function classifyArtwork(label: string) {
  const filename = label.toLowerCase().replace(/[_-]+/g, ' ')
  const garment: UploadGarmentType = /co ord|coord|coordinated|matching set/.test(filename) ? 'Co-ords'
    : /jeans|denim/.test(filename) ? 'Denim Jeans'
      : /hoodie|pullover/.test(filename) ? 'Fleece Hoodie'
        : /heavy boxy|boxy tee/.test(filename) ? 'Heavy Boxy Tee'
          : /embroider|shirt|linen|overshirt/.test(filename) ? 'Shirts'
            : 'Oversized T-Shirt'
  const theme: ArtworkTheme = /lion|tiger|wild|animal|fauna|forest|leopard|wolf|bengal|floral|garden|mountain/.test(filename) ? 'Nature & Scenic'
    : /mahadev|shiv|trishul|sacred|ganesh|devi|spiritual|temple|divine/.test(filename) ? 'Divine & Spiritual'
      : /car|auto|racing|race|motor|speed|velocity|bike|street/.test(filename) ? 'Streetwear'
        : /cosmic|space|star|moon|astral|satellite|orbit|celestial|galaxy/.test(filename) ? 'Brahmand'
          : /embroider|thread|stitch|needle|sew|patch/.test(filename) ? 'Embroidery / Threadwork'
            : 'Abstract'
  const density: ArtDensity = /minimal|subtle|single pocket|single chest|small chest/.test(filename) ? 'Minimal Art'
    : /full back|full-back|all over|all-over|multi thread|multi-thread|dense|heavy art|canvas print/.test(filename) ? 'Heavy Art'
      : 'Medium Art'

  return { garment, theme, density }
}

function getSuggestedPrice(garment: UploadGarmentType, density: ArtDensity, theme: ArtworkTheme, title: string) {
  if (garment === 'Shirts') return 1699
  if (garment === 'Denim Jeans' || garment === 'Co-ords') return 2999
  if (garment.includes('Hoodie')) return density === 'Minimal Art' ? 2499 : density === 'Medium Art' ? 2799 : 2999
  if (garment === 'Heavy Boxy Tee' || garment === 'Oversized T-Shirt') return density === 'Minimal Art' ? 799 : 1199
  return getSmartPrice({ garment, theme, title })
}

function titleFromFilename(name: string) { return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() }
function readImage(file: File) { return new Promise<HTMLImageElement>((resolve, reject) => { const url = URL.createObjectURL(file); const image = new Image(); image.crossOrigin = 'anonymous'; image.onload = () => { URL.revokeObjectURL(url); resolve(image) }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')) }; image.src = url }) }
async function optimize(file: File) { const image = await readImage(file); const scale = Math.min(1, MAX_WIDTH / image.width); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable'); context.drawImage(image, 0, 0, canvas.width, canvas.height); return { dataUrl: canvas.toDataURL('image/webp', 0.85), width: canvas.width, height: canvas.height } }

function isAllowedDriveImage(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' && ['drive.google.com', 'docs.google.com', 'lh3.googleusercontent.com'].includes(url.hostname)
  } catch {
    return false
  }
}

export function BulkInventoryManager({ products, setProducts }: { products: CatalogProduct[]; setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>> }) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [retiredSkus, setRetiredSkus] = useState<RetiredSku[]>([])
  const [activeView, setActiveView] = useState<'manager' | 'vault'>('manager')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [overrideSku, setOverrideSku] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [driveName, setDriveName] = useState('')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrls = useRef(new Set<string>())

  useEffect(() => setRetiredSkus(readRetiredSkus()), [])
  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    const accepted = files.filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
    const rejectedCount = files.length - accepted.length
    if (!accepted.length) {
      setMessage(files.length ? 'Choose image files smaller than 10 MB.' : '')
      return
    }

    const queued = accepted.map((file) => {
      const preview = URL.createObjectURL(file)
      previewUrls.current.add(preview)
      const fileTitle = titleFromFilename(file.name)
      const hints = classifyArtwork(fileTitle)
      const title = !fileTitle || /^\d+$/.test(fileTitle) ? 'Studio Archive Artwork' : fileTitle
      return {
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        name: file.name,
        preview,
        sourceImage: '',
        isLocalPreview: true,
        title,
        ...hints,
        price: String(getSuggestedPrice(hints.garment, hints.density, hints.theme, title)),
        status: 'optimizing' as const,
      }
    })
    setItems((current) => [...current, ...queued])
    setMessage(rejectedCount ? `${rejectedCount} file${rejectedCount === 1 ? '' : 's'} skipped. Images must be under 10 MB.` : '')

    for (let index = 0; index < queued.length; index += 1) {
      const item = queued[index]
      try {
        const result = await optimize(accepted[index])
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'ready', sourceImage: result.dataUrl, size: Math.round(result.dataUrl.length * 0.75 / 1024) } : entry))
      } catch {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'error', error: 'Image optimization failed. Remove it and try another file.' } : entry))
      }
    }
  }

  function addDriveImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAllowedDriveImage(driveUrl)) {
      setMessage('Enter a valid HTTPS Google Drive image link or lh3.googleusercontent.com image URL.')
      return
    }
    const preview = resolveDriveImageUrl(driveUrl, 800)
    if (preview === IMAGE_FALLBACK) {
      setMessage('That Drive link does not contain a usable image ID. Check the sharing link and try again.')
      return
    }
    const driveLink = new URL(driveUrl.trim())
    const fileLabel = driveName.trim() || driveLink.searchParams.get('filename')?.trim() || ''
    const title = fileLabel || 'Studio Archive Artwork'
    const hints = classifyArtwork(fileLabel)
    setItems((current) => [...current, {
      id: `drive-${crypto.randomUUID()}`,
      name: fileLabel || 'Google Drive image',
      preview,
      sourceImage: preview,
      isLocalPreview: false,
      title,
      ...hints,
      price: String(getSuggestedPrice(hints.garment, hints.density, hints.theme, title)),
      status: 'ready',
    }])
    setDriveUrl('')
    setDriveName('')
    setMessage('Drive image added for review. Suggestions use its filename or the label you provided.')
  }

  function updateItem(id: string, updates: Partial<Pick<UploadItem, 'title' | 'garment' | 'theme' | 'density' | 'price'>>) {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, ...updates }
      if (updates.garment || updates.density) next.price = String(getSuggestedPrice(next.garment, next.density, next.theme, next.title))
      return next
    }))
  }

  function removeItem(item: UploadItem) {
    if (item.isLocalPreview) {
      URL.revokeObjectURL(item.preview)
      previewUrls.current.delete(item.preview)
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id))
    setMessage('')
  }

  function publish() {
    const ready = items.filter((item) => item.status === 'ready' && item.sourceImage)
    if (!ready.length || ready.length !== items.length) {
      setMessage('Wait for every image to finish processing, or remove any failed image before publishing.')
      return
    }
    const invalid = ready.find((item) => !item.title.trim() || !Number.isSafeInteger(Number(item.price)) || Number(item.price) < 1 || Number(item.price) > 1_000_000)
    if (invalid) {
      setMessage(`Check the title and whole-number price for ${invalid.name}.`)
      return
    }

    const additions: CatalogProduct[] = []
    let vault = [...retiredSkus]
    ready.forEach((item, index) => {
      const title = item.title.trim()
      const currentCatalog = [...products, ...additions]
      const approvedOverride = index === 0 && overrideSku && vault.find((sku) => sku.articleCode === overrideSku && sku.overrideApprovedAt)
      const articleCode = approvedOverride ? overrideSku : getNextArticleCode(currentCatalog, vault.map((sku) => sku.articleCode))
      vault = vault.filter((sku) => sku.articleCode !== articleCode)
      additions.push({ id: `bulk-${crypto.randomUUID()}`, title, articleCode, productCode: getNextProductCode(currentCatalog, item.garment, title), garment: item.garment, theme: item.theme, price: Number(item.price), image: item.sourceImage, stockStatus: 'in-stock', uploaded: true })
    })
    writeRetiredSkus(vault)
    setRetiredSkus(vault)
    setProducts((current) => [...current, ...additions])
    items.forEach((item) => {
      if (!item.isLocalPreview) return
      URL.revokeObjectURL(item.preview)
      previewUrls.current.delete(item.preview)
    })
    setItems([])
    setMessage(`${additions.length} reviewed ${additions.length === 1 ? 'item' : 'items'} published to the master catalog and archive.`)
  }

  function retireProduct(product: CatalogProduct) {
    if (pendingDelete !== product.id) { setPendingDelete(product.id); setMessage(`Confirm deletion of ${product.articleCode ?? product.productCode ?? product.title}.`); return }
    const retired = [...retiredSkus, { articleCode: product.articleCode ?? getNextArticleCode(products, retiredSkus.map((sku) => sku.articleCode)), title: product.title, deletedAt: new Date().toISOString(), image: product.image }]
    writeRetiredSkus(retired); setRetiredSkus(retired); setProducts((current) => current.filter((item) => item.id !== product.id)); setPendingDelete(null); setMessage(`${product.articleCode ?? product.title} retired and removed from the active catalog.`)
  }

  function approveOverride(sku: RetiredSku) {
    if (!window.confirm(`Owner override: release ${sku.articleCode} for deliberate reassignment?`)) return
    const next = retiredSkus.map((item) => item.articleCode === sku.articleCode ? { ...item, overrideApprovedAt: new Date().toISOString() } : item)
    writeRetiredSkus(next); setRetiredSkus(next); setOverrideSku(sku.articleCode); setMessage(`${sku.articleCode} is approved for one deliberate reassignment.`)
  }

  const readyCount = items.filter((item) => item.status === 'ready').length
  const optimizingCount = items.filter((item) => item.status === 'optimizing').length

  return <section className="admin-panel bulk-inventory-manager" aria-labelledby="bulk-inventory-title">
    <div className="admin-panel-heading"><div><h2 id="bulk-inventory-title">Bulk Inventory &amp; Artwork Manager</h2><p>Review deterministic filename and Drive-label suggestions before catalog publishing.</p></div><span className="admin-count">{items.length} IN REVIEW</span></div>
    <div className="bulk-inventory-tabs" role="tablist" aria-label="Inventory manager views"><button type="button" role="tab" aria-selected={activeView === 'manager'} className={activeView === 'manager' ? 'is-active' : ''} onClick={() => setActiveView('manager')}>Active Inventory</button><button type="button" role="tab" aria-selected={activeView === 'vault'} className={activeView === 'vault' ? 'is-active' : ''} onClick={() => setActiveView('vault')}>Retired SKU Vault ({retiredSkus.length})</button></div>
    {activeView === 'manager' ? <>
      <div className="bulk-inventory-ingestion">
        <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={addFiles} />
        <button className="bulk-inventory-dropzone" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" /><strong>Select product photos</strong><span>Upload multiple JPG, PNG or WEBP images · up to 10 MB each</span></button>
        <form className="bulk-drive-form" onSubmit={addDriveImage}>
          <label><span>Google Drive image URL</span><input type="url" value={driveUrl} onChange={(event) => setDriveUrl(event.target.value)} placeholder="https://drive.google.com/file/d/..." required /></label>
          <label><span>Filename or product label <small>(optional)</small></span><input value={driveName} onChange={(event) => setDriveName(event.target.value)} maxLength={100} placeholder="e.g. minimal chest hoodie" /></label>
          <button className="button button-outline-dark" type="submit"><Link2 aria-hidden="true" /> Add Drive image</button>
        </form>
        <p className="bulk-inventory-rule-note">Suggestions come from the filename or label, not visual AI. Confirm each garment, theme, art density, and price below.</p>
      </div>
      {items.length > 0 && <p className="bulk-inventory-progress" aria-live="polite">{optimizingCount > 0 ? <><LoaderCircle aria-hidden="true" /> Processing {optimizingCount} photo{optimizingCount === 1 ? '' : 's'} for review…</> : `${readyCount} of ${items.length} images ready for approval`}</p>}
      {items.length > 0 && <div className="bulk-inventory-review-list">{items.map((item, index) => <article className="bulk-inventory-review-card" key={item.id}>
        <div className="bulk-inventory-review-photo"><img src={item.preview} alt={`Preview of ${item.title}`} onError={fallbackImageOnError} /><span>{String(index + 1).padStart(2, '0')}</span></div>
        <div className="bulk-inventory-review-content">
          <div className="bulk-inventory-review-heading"><div><strong>Classification review</strong><span>{item.status === 'optimizing' ? 'Processing image…' : item.status === 'error' ? item.error : item.size ? `${item.size} KB optimized image` : 'Drive image ready'}</span></div><button type="button" onClick={() => removeItem(item)} aria-label={`Remove ${item.name}`}><X aria-hidden="true" /></button></div>
          <div className="bulk-inventory-review-fields">
            <label><span>Product name</span><input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} maxLength={100} /></label>
            <label><span>Category</span><select value={item.theme} onChange={(event) => updateItem(item.id, { theme: event.target.value as ArtworkTheme })}>{ARTWORK_THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}</select></label>
            <label><span>Garment type</span><select value={item.garment} onChange={(event) => updateItem(item.id, { garment: event.target.value as UploadGarmentType })}>{UPLOAD_GARMENT_TYPES.map((garment) => <option key={garment} value={garment}>{garment}</option>)}</select></label>
            <label><span>Art density</span><select value={item.density} onChange={(event) => updateItem(item.id, { density: event.target.value as ArtDensity })}><option>Minimal Art</option><option>Medium Art</option><option>Heavy Art</option></select></label>
            <label><span>Price (₹)</span><input type="number" min="1" max="1000000" step="1" value={item.price} onChange={(event) => updateItem(item.id, { price: event.target.value })} /></label>
          </div>
          <p className="bulk-inventory-review-hint">Suggested price updates when garment type or art density changes. Heavy hoodies auto-price at ₹2,999 within the ₹2,999–₹3,499 band; jeans and co-ords start at ₹2,999. Edit the price for an owner override.</p>
        </div>
      </article>)}</div>}
      {message && <p className="admin-partner-pass-message" role="status">{message}</p>}
      <div className="bulk-inventory-actions"><button className="button button-outline-dark" type="button" onClick={() => inputRef.current?.click()}><ImagePlus aria-hidden="true" /> Add more photos</button><button className="button button-crimson" type="button" disabled={!items.length || readyCount !== items.length} onClick={publish}><Check aria-hidden="true" /> Approve &amp; Publish to Master Catalog</button></div>
      <div className="bulk-active-inventory"><h3>Active SKU Inventory</h3>{products.filter((product) => product.uploaded).map((product) => <article className="bulk-active-item" key={product.id}><img src={resolveDriveImageUrl(product.image)} alt="" onError={fallbackImageOnError} /><div><strong>{product.articleCode ?? 'Legacy article — assign on next edit'}</strong><span>{product.title} · {product.theme}</span></div><button type="button" className={pendingDelete === product.id ? 'is-confirming' : ''} onClick={() => retireProduct(product)}>{pendingDelete === product.id ? 'Confirm Delete' : 'Delete Piece'}</button></article>)}</div>
    </> : <div className="retired-sku-vault"><h3>Protected Retired SKU Vault</h3><p>Retired codes remain reserved and will never be reused unless the owner deliberately approves a reassignment.</p>{retiredSkus.length ? retiredSkus.map((sku) => <article className="retired-sku-item" key={sku.articleCode}><div><strong>{sku.articleCode}</strong><span>{sku.title} · Deleted {new Date(sku.deletedAt).toLocaleString()}</span></div>{sku.overrideApprovedAt ? <em>Override approved</em> : <button type="button" onClick={() => approveOverride(sku)}>Manually Reassign SKU to New Piece</button>}</article>) : <p>No retired article codes.</p>}</div>}
  </section>
}

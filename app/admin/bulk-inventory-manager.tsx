'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Check, ImagePlus, LoaderCircle, Upload, X } from 'lucide-react'
import { ARTWORK_THEMES, GARMENT_TYPES, getNextArticleCode, getNextProductCode, getSmartPrice, type ArtworkTheme, type CatalogProduct, type GarmentType } from '@/components/kainchi/catalog'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'

const MAX_WIDTH = 1600
const RETIRED_SKU_KEY = 'kainchi-retired-sku-vault-v1'
type RetiredSku = { articleCode: string; title: string; deletedAt: string; image: string; overrideApprovedAt?: string }

function readRetiredSkus(): RetiredSku[] { try { const value = JSON.parse(window.localStorage.getItem(RETIRED_SKU_KEY) ?? '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
function writeRetiredSkus(items: RetiredSku[]) { window.localStorage.setItem(RETIRED_SKU_KEY, JSON.stringify(items)) }
function classifyArtwork(filename: string) {
  const label = filename.toLowerCase()
  const garment: GarmentType = /leather|biker|rider|moto|jacket/.test(label) ? 'Leather Jacket' : /hoodie|pullover/.test(label) ? 'Fleece Hoodie' : /sweat|crewneck/.test(label) ? 'Printed Sweatshirt' : /shirt|linen|overshirt/.test(label) ? 'Shirts' : /denim|jeans/.test(label) ? 'Denim Jacket' : 'Oversized T-Shirt'
  if (/lion|tiger|wild|animal|fauna|forest|leopard|wolf|bengal/.test(label)) return { garment, theme: 'Nature & Scenic' as ArtworkTheme, title: 'Bengal Sovereign Crest' }
  if (/mahadev|shiv|trishul|sacred|ganesh|devi|spiritual|temple|divine/.test(label)) return { garment, theme: 'Divine & Spiritual' as ArtworkTheme, title: 'The Sacred Trishul Archive' }
  if (/car|auto|racing|race|motor|speed|velocity|bike/.test(label)) return { garment, theme: 'Streetwear' as ArtworkTheme, title: 'Cosmic Velocity Study' }
  if (/cosmic|space|star|moon|astral|satellite|orbit|celestial|galaxy/.test(label)) return { garment, theme: 'Brahmand' as ArtworkTheme, title: 'Celestial Orbit Archive' }
  if (/embroider|thread|stitch|needle|sew|patch|floral/.test(label)) return { garment, theme: 'Embroidery / Threadwork' as ArtworkTheme, title: 'Minimalist Threadwork Study' }
  return { garment, theme: 'Abstract' as ArtworkTheme, title: 'Studio Archive Artwork' }
}
const QUALITY = 0.85

type UploadItem = { id: string; name: string; preview: string; title: string; suggestedGarment: GarmentType; suggestedTheme: ArtworkTheme; status: 'queued' | 'optimizing' | 'ready' | 'error'; size?: number; dataUrl?: string; error?: string }

function titleFromFilename(name: string) { return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() }
function readImage(file: File) { return new Promise<HTMLImageElement>((resolve, reject) => { const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { URL.revokeObjectURL(url); resolve(image) }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')) }; image.src = url }) }
async function optimize(file: File) { const image = await readImage(file); const scale = Math.min(1, MAX_WIDTH / image.width); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable'); context.drawImage(image, 0, 0, canvas.width, canvas.height); return { dataUrl: canvas.toDataURL('image/webp', QUALITY), width: canvas.width, height: canvas.height } }

export function BulkInventoryManager({ products, setProducts }: { products: CatalogProduct[]; setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>> }) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [retiredSkus, setRetiredSkus] = useState<RetiredSku[]>([])
  const [activeView, setActiveView] = useState<'manager' | 'vault'>('manager')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [garment, setGarment] = useState<GarmentType>('Fleece Hoodie')
  const [theme, setTheme] = useState<ArtworkTheme>('Nature & Scenic')
  const [overrideSku, setOverrideSku] = useState('')
  const [price, setPrice] = useState('2499')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setRetiredSkus(readRetiredSkus()), [])

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
    event.target.value = ''
    if (!files.length) return
    const queued = files.map((file) => { const classification = classifyArtwork(file.name); const filenameTitle = titleFromFilename(file.name); const numericOnly = !filenameTitle || /^\d+$/.test(filenameTitle); return { id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, name: file.name, preview: URL.createObjectURL(file), title: numericOnly ? classification.title : filenameTitle, suggestedGarment: classification.garment, suggestedTheme: classification.theme, status: 'queued' as const } })
    setItems((current) => [...current, ...queued])
    setProcessing(true)
    for (const item of queued) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'optimizing' } : entry))
      try {
        const result = await optimize(files[queued.indexOf(item)])
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'ready', dataUrl: result.dataUrl, size: Math.round(result.dataUrl.length * 0.75 / 1024) } : entry))
      } catch {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'error', error: 'Optimization failed' } : entry))
      }
    }
    setProcessing(false)
  }

  function publish() {
    const validPrice = Number(price)
    const ready = items.filter((item) => item.status === 'ready' && item.dataUrl)
    if (!ready.length || !Number.isSafeInteger(validPrice) || validPrice < 1) { setMessage('Choose images and wait for optimization to finish.'); return }
    const additions: CatalogProduct[] = []
    let vault = [...retiredSkus]
    ready.forEach((item, index) => {
      const title = item.title || 'Studio Archive Artwork'
      const currentCatalog = [...products, ...additions]
      const approvedOverride = index === 0 && overrideSku && vault.find((sku) => sku.articleCode === overrideSku && sku.overrideApprovedAt)
      const articleCode = approvedOverride ? overrideSku : getNextArticleCode(currentCatalog, vault.map((sku) => sku.articleCode))
      vault = vault.filter((sku) => sku.articleCode !== articleCode)
      const assignedGarment = item.suggestedGarment || garment
      const assignedTheme = item.suggestedTheme || theme
      additions.push({ id: `bulk-${crypto.randomUUID()}`, title, articleCode, productCode: getNextProductCode(currentCatalog, assignedGarment, title), garment: assignedGarment, theme: assignedTheme, price: getSmartPrice({ garment: assignedGarment, theme: assignedTheme, title }), image: item.dataUrl!, stockStatus: 'in-stock', uploaded: true })
    })
    writeRetiredSkus(vault)
    setRetiredSkus(vault)
    setProducts((current) => [...current, ...additions])
    ready.forEach((item) => URL.revokeObjectURL(item.preview))
    setItems([])
    setMessage(`${additions.length} assets published to the catalog and archive.`)
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

  useEffect(() => () => items.forEach((item) => URL.revokeObjectURL(item.preview)), [items])
  const readyCount = items.filter((item) => item.status === 'ready').length
  const optimizingCount = items.filter((item) => item.status === 'optimizing').length

  return <section className="admin-panel bulk-inventory-manager" aria-labelledby="bulk-inventory-title">
    <div className="admin-panel-heading"><div><h2 id="bulk-inventory-title">Bulk Inventory &amp; Artwork Manager</h2><p>Client-side optimizer: max 1600px, WebP quality 0.85, default status In Stock.</p></div><span className="admin-count">{items.length} QUEUED</span></div>
    <div className="bulk-inventory-tabs" role="tablist" aria-label="Inventory manager views"><button type="button" role="tab" aria-selected={activeView === 'manager'} className={activeView === 'manager' ? 'is-active' : ''} onClick={() => setActiveView('manager')}>Active Inventory</button><button type="button" role="tab" aria-selected={activeView === 'vault'} className={activeView === 'vault' ? 'is-active' : ''} onClick={() => setActiveView('vault')}>Retired SKU Vault ({retiredSkus.length})</button></div>
    {activeView === 'manager' ? <>
    <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={addFiles} />
    <button className="bulk-inventory-dropzone" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" /><strong>Select 40–50 photos</strong><span>JPG, PNG, HEIC or WEBP · up to 10 MB each</span></button>
    <div className="bulk-inventory-config"><label>Garment<select value={garment} onChange={(event) => setGarment(event.target.value as GarmentType)}>{GARMENT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Category<select value={theme} onChange={(event) => setTheme(event.target.value as ArtworkTheme)}>{ARTWORK_THEMES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Price (₹)<input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} /></label></div>
    {items.length > 0 && <p className="bulk-inventory-progress" aria-live="polite">{processing ? <><LoaderCircle aria-hidden="true" /> Optimizing {items.length - readyCount} of {items.length}…</> : `${readyCount} of ${items.length} ready to publish`}</p>}
    {items.length > 0 && <div className="bulk-inventory-queue">{items.map((item) => <div className="bulk-inventory-item" key={item.id}><img src={resolveDriveImageUrl(item.preview)} alt="" onError={fallbackImageOnError} /><div><strong>{item.title}</strong><span>{item.status === 'optimizing' ? 'Optimizing…' : item.status === 'ready' ? `${item.size} KB WebP ready` : item.status === 'error' ? item.error : 'Queued'}</span></div><button type="button" onClick={() => { URL.revokeObjectURL(item.preview); setItems((current) => current.filter((entry) => entry.id !== item.id)) }} aria-label={`Remove ${item.name}`}><X aria-hidden="true" /></button></div>)}</div>}
    {message && <p className="admin-partner-pass-message" role="status">{message}</p>}
    <div className="bulk-inventory-actions"><button className="button button-outline-dark" type="button" onClick={() => inputRef.current?.click()}><ImagePlus aria-hidden="true" /> Add more</button><button className="button button-crimson" type="button" disabled={processing || readyCount === 0} onClick={publish}><Check aria-hidden="true" /> Publish All to Catalog</button></div>
    <div className="bulk-active-inventory"><h3>Active SKU Inventory</h3>{products.filter((product) => product.uploaded).map((product) => <article className="bulk-active-item" key={product.id}><img src={resolveDriveImageUrl(product.image)} alt="" onError={fallbackImageOnError} /><div><strong>{product.articleCode ?? 'Legacy article — assign on next edit'}</strong><span>{product.title} · {product.theme}</span></div><button type="button" className={pendingDelete === product.id ? 'is-confirming' : ''} onClick={() => retireProduct(product)}>{pendingDelete === product.id ? 'Confirm Delete' : 'Delete Piece'}</button></article>)}</div>
    </> : <div className="retired-sku-vault"><h3>Protected Retired SKU Vault</h3><p>Retired codes remain reserved and will never be reused unless the owner deliberately approves a reassignment.</p>{retiredSkus.length ? retiredSkus.map((sku) => <article className="retired-sku-item" key={sku.articleCode}><div><strong>{sku.articleCode}</strong><span>{sku.title} · Deleted {new Date(sku.deletedAt).toLocaleString()}</span></div>{sku.overrideApprovedAt ? <em>Override approved</em> : <button type="button" onClick={() => approveOverride(sku)}>Manually Reassign SKU to New Piece</button>}</article>) : <p>No retired article codes.</p>}</div>}
  </section>
}

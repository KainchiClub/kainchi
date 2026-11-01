'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Check, ImagePlus, LoaderCircle, Upload, X } from 'lucide-react'
import { ARTWORK_THEMES, GARMENT_TYPES, getNextProductCode, type ArtworkTheme, type CatalogProduct, type GarmentType } from '@/components/kainchi/catalog'

const MAX_WIDTH = 1600
const QUALITY = 0.85

type UploadItem = { id: string; name: string; preview: string; title: string; status: 'queued' | 'optimizing' | 'ready' | 'error'; size?: number; dataUrl?: string; error?: string }

function titleFromFilename(name: string) { return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() }
function readImage(file: File) { return new Promise<HTMLImageElement>((resolve, reject) => { const url = URL.createObjectURL(file); const image = new Image(); image.onload = () => { URL.revokeObjectURL(url); resolve(image) }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')) }; image.src = url }) }
async function optimize(file: File) { const image = await readImage(file); const scale = Math.min(1, MAX_WIDTH / image.width); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable'); context.drawImage(image, 0, 0, canvas.width, canvas.height); return { dataUrl: canvas.toDataURL('image/webp', QUALITY), width: canvas.width, height: canvas.height } }

export function BulkInventoryManager({ products, setProducts }: { products: CatalogProduct[]; setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>> }) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [garment, setGarment] = useState<GarmentType>('Fleece Hoodie')
  const [theme, setTheme] = useState<ArtworkTheme>('Nature & Scenic')
  const [price, setPrice] = useState('2499')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
    event.target.value = ''
    if (!files.length) return
    const queued = files.map((file) => ({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, name: file.name, preview: URL.createObjectURL(file), title: titleFromFilename(file.name), status: 'queued' as const }))
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
    ready.forEach((item) => {
      const title = item.title || 'New Studio Artwork'
      const currentCatalog = [...products, ...additions]
      additions.push({ id: `bulk-${crypto.randomUUID()}`, title, productCode: getNextProductCode(currentCatalog, garment, title), garment, theme, price: validPrice, image: item.dataUrl!, stockStatus: 'in-stock', uploaded: true })
    })
    setProducts((current) => [...current, ...additions])
    ready.forEach((item) => URL.revokeObjectURL(item.preview))
    setItems([])
    setMessage(`${additions.length} assets published to the catalog and archive.`)
  }

  useEffect(() => () => items.forEach((item) => URL.revokeObjectURL(item.preview)), [items])
  const readyCount = items.filter((item) => item.status === 'ready').length
  const optimizingCount = items.filter((item) => item.status === 'optimizing').length

  return <section className="admin-panel bulk-inventory-manager" aria-labelledby="bulk-inventory-title">
    <div className="admin-panel-heading"><div><h2 id="bulk-inventory-title">Bulk Inventory &amp; Artwork Manager</h2><p>Client-side optimizer: max 1600px, WebP quality 0.85, default status In Stock.</p></div><span className="admin-count">{items.length} QUEUED</span></div>
    <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={addFiles} />
    <button className="bulk-inventory-dropzone" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" /><strong>Select 40–50 photos</strong><span>JPG, PNG, HEIC or WEBP · up to 10 MB each</span></button>
    <div className="bulk-inventory-config"><label>Garment<select value={garment} onChange={(event) => setGarment(event.target.value as GarmentType)}>{GARMENT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Category<select value={theme} onChange={(event) => setTheme(event.target.value as ArtworkTheme)}>{ARTWORK_THEMES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Price (₹)<input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} /></label></div>
    {items.length > 0 && <p className="bulk-inventory-progress" aria-live="polite">{processing ? <><LoaderCircle aria-hidden="true" /> Optimizing {items.length - readyCount} of {items.length}…</> : `${readyCount} of ${items.length} ready to publish`}</p>}
    {items.length > 0 && <div className="bulk-inventory-queue">{items.map((item) => <div className="bulk-inventory-item" key={item.id}><img src={item.preview} alt="" /><div><strong>{item.title}</strong><span>{item.status === 'optimizing' ? 'Optimizing…' : item.status === 'ready' ? `${item.size} KB WebP ready` : item.status === 'error' ? item.error : 'Queued'}</span></div><button type="button" onClick={() => { URL.revokeObjectURL(item.preview); setItems((current) => current.filter((entry) => entry.id !== item.id)) }} aria-label={`Remove ${item.name}`}><X aria-hidden="true" /></button></div>)}</div>}
    {message && <p className="admin-partner-pass-message" role="status">{message}</p>}
    <div className="bulk-inventory-actions"><button className="button button-outline-dark" type="button" onClick={() => inputRef.current?.click()}><ImagePlus aria-hidden="true" /> Add more</button><button className="button button-crimson" type="button" disabled={processing || readyCount === 0} onClick={publish}><Check aria-hidden="true" /> Publish All to Catalog</button></div>
  </section>
}

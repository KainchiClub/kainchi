'use client'

import { useActionState, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUpRight, LockKeyhole, Plus, Save, ShieldCheck, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCatalogProducts } from '@/components/kainchi/catalog-store'
import { ARTWORK_THEMES, getNextProductCode, type CatalogProduct } from '@/components/kainchi/catalog'
import { signOutAdmin, unlockAdmin } from './actions'
import { VisitorLeadsPanel } from './visitor-leads-panel'
import { FeedbackModerationPanel } from './feedback-moderation-panel'
import { FAQManagementPanel } from './faq-management-panel'
import { AllianceReferralsPanel } from './alliance-referrals-panel'
import { PartnerPassControl } from './partner-pass-control'
import { StudioWalletControl } from './studio-wallet-control'
import { BulkInventoryManager } from './bulk-inventory-manager'
import { SmartPricingEngine } from './smart-pricing-engine'
import { IMAGE_FALLBACK, fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import { BannerSlidesPanel } from './banner-slides-panel'
import { CustomInquiriesPanel } from './custom-inquiries-panel'

const initialLoginState = { error: '' }
const RETIRED_SKU_KEY = 'kainchi-retired-sku-vault-v1'
const GATEWAY_CLOUD_SETTINGS_KEY = 'kainchi-store-gateway-cloud-v1'

const ADMIN_TABS = [
  { id: 'catalog', label: 'Artwork' },
  { id: 'inventory', label: 'Bulk Inventory & Artwork Manager' },
  { id: 'payments-cloud', label: 'Payments & Cloud' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'faqs', label: 'Manage FAQs' },
  { id: 'leads', label: 'Studio leads' },
  { id: 'inquiries', label: 'Custom Inquiries' },
  { id: 'alliance', label: 'Alliance & Referrals' },
  { id: 'wallet', label: 'Studio Wallet' },
  { id: 'banner-slides', label: 'Banner Slides' },
] as const
type AdminTab = (typeof ADMIN_TABS)[number]['id']

const GARMENT_OPTIONS = [
  'Oversized T-Shirt',
  'Heavyweight Hoodie',
  'Artisanal Shirt',
  'Heavyweight Sweatshirt',
  'Signature Denim Jacket',
  'Luxury Co-ord Set',
  'Artisanal Polo',
] as const

interface StoreGatewaySettings {
  brandName: string
  whatsappNumber: string
  upiId: string
  razorpayKeyId: string
  instagramUrl: string
  facebookUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
}

const DEFAULT_GATEWAY_SETTINGS: StoreGatewaySettings = {
  brandName: 'KAINCHI CLUB',
  whatsappNumber: '918863075356',
  upiId: '',
  razorpayKeyId: '',
  instagramUrl: '',
  facebookUrl: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
}

function normalizeImageInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:image/')) return trimmed
  if (trimmed.startsWith('/')) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return null
    if (['drive.google.com', 'docs.google.com', 'lh3.googleusercontent.com'].includes(url.hostname)) {
      const resolvedImage = resolveDriveImageUrl(trimmed)
      return resolvedImage === IMAGE_FALLBACK ? null : resolvedImage
    }
    return trimmed
  } catch {
    return null
  }
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Invalid image'))
      img.onload = () => {
        const maxDim = 900
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/webp', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function AdminPortal({ isUnlocked }: { isUnlocked: boolean }) {
  const [loginState, loginAction, isLoginPending] = useActionState(unlockAdmin, initialLoginState)
  const [products, setProducts] = useCatalogProducts()
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('catalog')
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [productCodeDrafts, setProductCodeDrafts] = useState<Record<string, string>>({})
  const [productCodeErrors, setProductCodeErrors] = useState<Record<string, string>>({})

  // Multi-Photo Product Creation State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<(typeof ARTWORK_THEMES)[number]>(ARTWORK_THEMES[0])
  const [garmentType, setGarmentType] = useState<string>(GARMENT_OPTIONS[0])
  const [price, setPrice] = useState('1699')
  const [photoSlots, setPhotoSlots] = useState<string[]>(['', '', '', ''])
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  // Payments & Cloud Settings State
  const [gatewaySettings, setGatewaySettings] = useState<StoreGatewaySettings>(DEFAULT_GATEWAY_SETTINGS)
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GATEWAY_CLOUD_SETTINGS_KEY)
      if (raw) {
        setGatewaySettings({ ...DEFAULT_GATEWAY_SETTINGS, ...JSON.parse(raw) })
      }
    } catch {}
  }, [])

  function handleAdminTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = ADMIN_TABS.findIndex((tab) => tab.id === activeAdminTab)
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ADMIN_TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + ADMIN_TABS.length) % ADMIN_TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = ADMIN_TABS.length - 1
    else return

    event.preventDefault()
    const nextTab = ADMIN_TABS[nextIndex]
    setActiveAdminTab(nextTab.id)
    document.getElementById(`admin-tab-${nextTab.id}`)?.focus()
  }

  function updatePrice(productId: string, rawValue: string) {
    setPriceDrafts((current) => ({ ...current, [productId]: rawValue }))
    if (!/^\d+$/.test(rawValue)) return

    const nextPrice = Number(rawValue)
    if (!Number.isSafeInteger(nextPrice) || nextPrice < 1 || nextPrice > 1_000_000) return

    setProducts((current) => current.map((product) => (product.id === productId ? { ...product, price: nextPrice } : product)))
  }

  function updateProductCode(productId: string, rawValue: string) {
    const productCode = rawValue.trim().toUpperCase()
    setProductCodeDrafts((current) => ({ ...current, [productId]: productCode }))

    if (!productCode) {
      setProductCodeErrors((current) => ({ ...current, [productId]: 'A product code is required.' }))
      return
    }

    const isDuplicate = products.some((product) => product.id !== productId && product.productCode?.toUpperCase() === productCode)
    if (isDuplicate) {
      setProductCodeErrors((current) => ({ ...current, [productId]: 'That code is already assigned to another item.' }))
      return
    }

    setProductCodeErrors((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
    setProducts((current) => current.map((product) => (product.id === productId ? { ...product, productCode } : product)))
  }

  function resetProductCodeDraft(productId: string) {
    setProductCodeDrafts((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
    setProductCodeErrors((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  function resetPriceDraft(productId: string) {
    setPriceDrafts((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  function updateStockStatus(product: CatalogProduct, status: 'in-stock' | 'sold-out' | 'retired') {
    if (status === 'retired') {
      const retired = (() => {
        try {
          return JSON.parse(window.localStorage.getItem(RETIRED_SKU_KEY) ?? '[]') as Array<Record<string, string>>
        } catch {
          return []
        }
      })()
      retired.push({ articleCode: product.articleCode ?? product.productCode ?? product.id, title: product.title, deletedAt: new Date().toISOString(), image: product.image })
      window.localStorage.setItem(RETIRED_SKU_KEY, JSON.stringify(retired))
      setProducts((current) => current.filter((item) => item.id !== product.id))
      return
    }
    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, stockStatus: status } : item)))
  }

  async function handlePhotoFileSelect(slotIndex: number, file?: File) {
    if (!file) return
    try {
      const dataUrl = await compressImageToDataUrl(file)
      setPhotoSlots((prev) => {
        const next = [...prev]
        next[slotIndex] = dataUrl
        return next
      })
    } catch {
      setAddError('Could not process that image file. Please try another photo.')
    }
  }

  function addCatalogItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddError('')
    setAddSuccess('')

    const resolvedPhotos = photoSlots.map(normalizeImageInput).filter((u): u is string => Boolean(u))
    const itemPrice = Number(price)
    if (!title.trim()) {
      setAddError('Enter a product title.')
      return
    }
    if (!Number.isSafeInteger(itemPrice) || itemPrice < 1 || itemPrice > 1_000_000) {
      setAddError('Enter a whole-number price between ₹1 and ₹10,00,000.')
      return
    }
    if (resolvedPhotos.length === 0) {
      setAddError('Upload at least 1 photo or paste a valid HTTPS Google Drive / image link.')
      return
    }

    const newProduct: CatalogProduct = {
      id: `owner-${crypto.randomUUID()}`,
      title: title.trim(),
      productCode: getNextProductCode(products, garmentType, title.trim()),
      garment: garmentType,
      theme: category,
      price: itemPrice,
      image: resolvedPhotos[0],
      gallery: resolvedPhotos,
      stockStatus: 'in-stock',
      uploaded: true,
    } as CatalogProduct

    setProducts((current) => [...current, newProduct])
    setTitle('')
    setPrice('1699')
    setPhotoSlots(['', '', '', ''])
    setAddSuccess(`"${newProduct.title}" published with ${resolvedPhotos.length} photo(s)!`)
  }

  function handleSaveGatewaySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      window.localStorage.setItem(GATEWAY_CLOUD_SETTINGS_KEY, JSON.stringify(gatewaySettings))
      setSettingsSavedMsg('Payment Gateway, Brand & Cloud settings saved successfully!')
      window.setTimeout(() => setSettingsSavedMsg(''), 4000)
    } catch {
      setSettingsSavedMsg('Could not save settings in this browser.')
    }
  }

  if (!isUnlocked) {
    return (
      <section className="admin-page-main" aria-labelledby="admin-page-title">
        <div className="admin-notice">
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Owner access</p>
          <h1 id="admin-page-title">Admin Portal</h1>
          <p>Enter your owner PIN to manage product codes, prices, and stock availability.</p>
          <form className="admin-login-form" action={loginAction}>
            <label htmlFor="admin-pin">Owner PIN</label>
            <input id="admin-pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="current-password" required aria-describedby={loginState.error ? 'admin-login-error' : undefined} />
            {loginState.error && <p className="admin-login-error" id="admin-login-error" role="alert">{loginState.error}</p>}
            <button className="button button-crimson" type="submit" disabled={isLoginPending}><LockKeyhole aria-hidden="true" />{isLoginPending ? 'Checking PIN…' : 'Unlock Portal'}</button>
          </form>
          <Link className="button button-outline-dark" href="/#collection">Return to the storefront <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-page-main admin-page-main-wide" aria-labelledby="admin-page-title">
      <div className="admin-dashboard">
        <header className="admin-dashboard-header">
          <div>
            <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Owner access</p>
            <h1 id="admin-page-title">Admin Portal</h1>
            <p>Manage the artwork catalog, multi-photo uploads, payments, feedback, FAQs, and studio leads.</p>
          </div>
          <div className="admin-dashboard-actions">
            <Link className="button button-outline-dark" href="/#collection">View storefront <ArrowUpRight aria-hidden="true" /></Link>
            <form action={signOutAdmin}><button className="button button-crimson" type="submit"><ShieldCheck aria-hidden="true" /> Sign Out</button></form>
          </div>
        </header>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {ADMIN_TABS.map((tab) => (
            <button
              aria-controls={`admin-panel-${tab.id}`}
              aria-selected={activeAdminTab === tab.id}
              className="admin-tab"
              id={`admin-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              onKeyDown={handleAdminTabKeyDown}
              role="tab"
              tabIndex={activeAdminTab === tab.id ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-tab-panel" id="admin-panel-catalog" role="tabpanel" aria-labelledby="admin-tab-catalog" tabIndex={0} hidden={activeAdminTab !== 'catalog'}>
          <SmartPricingEngine products={products} setProducts={setProducts} />
          <section className="admin-panel" aria-labelledby="catalog-table-title">
            <div className="admin-panel-heading">
              <div><h2 id="catalog-table-title">Artwork catalog</h2><p>{products.length} items · product codes, prices, and stock are saved in this browser</p></div>
              <span className="admin-count">{String(products.length).padStart(2, '0')} ITEMS</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="sr-only">All catalog artworks with editable product codes, base prices, and stock status</caption>
                <thead><tr><th scope="col">Thumbnail</th><th scope="col">Product Title</th><th scope="col">Product Code</th><th scope="col">Category</th><th scope="col">Base Price</th><th scope="col">Stock Status</th></tr></thead>
                <tbody>
                  {products.map((product) => {
                    const stockStatus = product.stockStatus ?? 'in-stock'
                    return (
                      <tr key={product.id}>
                        <td><img className="admin-thumbnail" src={resolveDriveImageUrl(product.image)} alt="" loading="lazy" draggable={false} onError={fallbackImageOnError} onContextMenu={(event) => event.preventDefault()} /></td>
                        <td><strong className="admin-product-title">{product.title}</strong><span className="admin-product-garment">{product.garment}</span></td>
                        <td><label className="admin-product-code-field"><span className="sr-only">Product code for {product.title}</span><input type="text" maxLength={24} autoCapitalize="characters" spellCheck={false} value={productCodeDrafts[product.id] ?? product.productCode ?? ''} onChange={(event) => updateProductCode(product.id, event.target.value)} onBlur={() => resetProductCodeDraft(product.id)} aria-invalid={Boolean(productCodeErrors[product.id])} aria-describedby={productCodeErrors[product.id] ? `admin-code-error-${product.id}` : undefined} />{productCodeErrors[product.id] && <span className="admin-product-code-error" id={`admin-code-error-${product.id}`} role="alert">{productCodeErrors[product.id]}</span>}</label></td>
                        <td>{product.theme}</td>
                        <td><label className="admin-price-field"><span aria-hidden="true">₹</span><span className="sr-only">Base price for {product.title}</span><input type="number" min="1" max="1000000" step="1" value={priceDrafts[product.id] ?? String(product.price)} onChange={(event) => updatePrice(product.id, event.target.value)} onBlur={() => resetPriceDraft(product.id)} /></label></td>
                        <td><label className="admin-stock-select"><span className="sr-only">Stock status for {product.title}</span><select value={stockStatus} onChange={(event) => updateStockStatus(product, event.target.value as 'in-stock' | 'sold-out' | 'retired')}><option value="in-stock">In Stock</option><option value="sold-out">Out of Stock</option><option value="retired">Retire / Delete SKU</option></select></label></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel admin-add-panel" aria-labelledby="add-item-title">
            <div className="admin-panel-heading"><div><h2 id="add-item-title">Add New Item (Multi-Photo Studio Upload)</h2><p>Upload up to 4 angles directly from your device or paste Google Drive links.</p></div></div>
            <form className="admin-add-form" onSubmit={addCatalogItem}>
              <label className="admin-field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
              <label className="admin-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as (typeof ARTWORK_THEMES)[number])}>{ARTWORK_THEMES.map((theme) => <option value={theme} key={theme}>{theme}</option>)}</select></label>
              <label className="admin-field"><span>Garment Fit</span><select value={garmentType} onChange={(event) => setGarmentType(event.target.value)}>{GARMENT_OPTIONS.map((g) => <option value={g} key={g}>{g}</option>)}</select></label>
              <label className="admin-field"><span>Price</span><span className="admin-price-field"><span aria-hidden="true">₹</span><input type="number" min="1" max="1000000" step="1" value={price} onChange={(event) => setPrice(event.target.value)} required /></span></label>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '10px', marginTop: '6px' }}>
                {['Photo 1 — Main Front View *', 'Photo 2 — Back / Over-Shoulder View', 'Photo 3 — Embroidery / Fabric Detail', 'Photo 4 — Packaging / Lookbook Shot'].map((slotLabel, idx) => (
                  <div key={slotLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={photoSlots[idx].startsWith('data:image/') ? 'Uploaded photo ready ✓' : photoSlots[idx]}
                      onChange={(event) => {
                        const next = [...photoSlots]
                        next[idx] = event.target.value
                        setPhotoSlots(next)
                      }}
                      placeholder={`${slotLabel} (Paste Drive URL or click Upload)`}
                      style={{ flex: 1, minWidth: '220px' }}
                    />
                    <label className="button button-outline-dark" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '12px' }}>
                      <Upload size={14} aria-hidden="true" /> Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handlePhotoFileSelect(idx, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button className="button button-crimson admin-add-button" type="submit"><Plus aria-hidden="true" /> Add New Item</button>
            </form>
            {addError && <p className="admin-login-error" role="alert">{addError}</p>}
            {addSuccess && <p style={{ color: '#15803d', fontSize: '13px', marginTop: '8px', fontWeight: 500 }} role="status">{addSuccess}</p>}
            <p className="admin-storage-note">Uploaded photos are automatically compressed and saved to the storefront catalog immediately.</p>
          </section>
        </div>

        <div className="admin-tab-panel" id="admin-panel-inventory" role="tabpanel" aria-labelledby="admin-tab-inventory" tabIndex={0} hidden={activeAdminTab !== 'inventory'}>
          <BulkInventoryManager products={products} setProducts={setProducts} />
        </div>

        <div className="admin-tab-panel" id="admin-panel-payments-cloud" role="tabpanel" aria-labelledby="admin-tab-payments-cloud" tabIndex={0} hidden={activeAdminTab !== 'payments-cloud'}>
          <section className="admin-panel" aria-labelledby="gateway-cloud-title">
            <div className="admin-panel-heading">
              <div>
                <h2 id="gateway-cloud-title">Payment Gateway, White-Label Brand &amp; Cloud Sync</h2>
                <p>Configure direct Bank UPI / Razorpay keys, brand details, and optional Supabase cloud database credentials.</p>
              </div>
            </div>
            <form className="admin-add-form" onSubmit={handleSaveGatewaySettings}>
              <label className="admin-field">
                <span>Brand / Store Name</span>
                <input value={gatewaySettings.brandName} onChange={(e) => setGatewaySettings({ ...gatewaySettings, brandName: e.target.value })} />
              </label>
              <label className="admin-field">
                <span>WhatsApp Order Number</span>
                <input value={gatewaySettings.whatsappNumber} onChange={(e) => setGatewaySettings({ ...gatewaySettings, whatsappNumber: e.target.value })} placeholder="918863075356" />
              </label>
              <label className="admin-field">
                <span>Direct Bank UPI ID (Instant Bank Transfer)</span>
                <input value={gatewaySettings.upiId} onChange={(e) => setGatewaySettings({ ...gatewaySettings, upiId: e.target.value })} placeholder="e.g. kainchiclub@okaxis" />
              </label>
              <label className="admin-field">
                <span>Razorpay Live Key ID (Optional)</span>
                <input value={gatewaySettings.razorpayKeyId} onChange={(e) => setGatewaySettings({ ...gatewaySettings, razorpayKeyId: e.target.value })} placeholder="rzp_live_xxxxxxxxxxxx" />
              </label>
              <label className="admin-field">
                <span>Instagram URL</span>
                <input type="url" value={gatewaySettings.instagramUrl} onChange={(e) => setGatewaySettings({ ...gatewaySettings, instagramUrl: e.target.value })} placeholder="https://instagram.com/kainchiclub" />
              </label>
              <label className="admin-field">
                <span>Facebook URL</span>
                <input type="url" value={gatewaySettings.facebookUrl} onChange={(e) => setGatewaySettings({ ...gatewaySettings, facebookUrl: e.target.value })} placeholder="https://facebook.com/kainchiclub" />
              </label>
              <label className="admin-field">
                <span>Supabase Project URL (Cloud Sync)</span>
                <input type="url" value={gatewaySettings.supabaseUrl} onChange={(e) => setGatewaySettings({ ...gatewaySettings, supabaseUrl: e.target.value })} placeholder="https://xxxx.supabase.co" />
              </label>
              <label className="admin-field">
                <span>Supabase Anon Public Key</span>
                <input type="password" value={gatewaySettings.supabaseAnonKey} onChange={(e) => setGatewaySettings({ ...gatewaySettings, supabaseAnonKey: e.target.value })} placeholder="eyJhbGciOi..." />
              </label>
              <button className="button button-crimson admin-add-button" type="submit">
                <Save aria-hidden="true" /> Save Payment &amp; Cloud Settings
              </button>
            </form>
            {settingsSavedMsg && <p style={{ color: '#15803d', fontSize: '13px', marginTop: '10px', fontWeight: 500 }} role="status">{settingsSavedMsg}</p>}
          </section>
        </div>

        <div className="admin-tab-panel" id="admin-panel-feedback" role="tabpanel" aria-labelledby="admin-tab-feedback" tabIndex={0} hidden={activeAdminTab !== 'feedback'}>
          <FeedbackModerationPanel />
        </div>
        <div className="admin-tab-panel" id="admin-panel-faqs" role="tabpanel" aria-labelledby="admin-tab-faqs" tabIndex={0} hidden={activeAdminTab !== 'faqs'}>
          <FAQManagementPanel />
        </div>
        <div className="admin-tab-panel" id="admin-panel-leads" role="tabpanel" aria-labelledby="admin-tab-leads" tabIndex={0} hidden={activeAdminTab !== 'leads'}>
          <VisitorLeadsPanel />
        </div>
        <div className="admin-tab-panel" id="admin-panel-inquiries" role="tabpanel" aria-labelledby="admin-tab-inquiries" tabIndex={0} hidden={activeAdminTab !== 'inquiries'}>
          <CustomInquiriesPanel />
        </div>
        <div className="admin-tab-panel" id="admin-panel-alliance" role="tabpanel" aria-labelledby="admin-tab-alliance" tabIndex={0} hidden={activeAdminTab !== 'alliance'}>
          <AllianceReferralsPanel />
          <PartnerPassControl />
        </div>
        <div className="admin-tab-panel" id="admin-panel-wallet" role="tabpanel" aria-labelledby="admin-tab-wallet" tabIndex={0} hidden={activeAdminTab !== 'wallet'}>
          <StudioWalletControl />
        </div>
        <div className="admin-tab-panel" id="admin-panel-banner-slides" role="tabpanel" aria-labelledby="admin-tab-banner-slides" tabIndex={0} hidden={activeAdminTab !== 'banner-slides'}>
          <BannerSlidesPanel />
        </div>
      </div>
    </section>
  )
}

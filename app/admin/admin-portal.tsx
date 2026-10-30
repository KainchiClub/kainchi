'use client'

import { useActionState, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUpRight, LockKeyhole, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useCatalogProducts } from '@/components/kainchi/catalog-store'
import { ARTWORK_THEMES, type CatalogProduct } from '@/components/kainchi/catalog'
import { signOutAdmin, unlockAdmin } from './actions'
import { VisitorLeadsPanel } from './visitor-leads-panel'
import { FeedbackModerationPanel } from './feedback-moderation-panel'
import { FAQManagementPanel } from './faq-management-panel'

const initialLoginState = { error: '' }
const ADMIN_TABS = [
  { id: 'catalog', label: 'Artwork' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'faqs', label: 'Manage FAQs' },
  { id: 'leads', label: 'Studio leads' },
] as const
type AdminTab = (typeof ADMIN_TABS)[number]['id']

function normalizeDriveImageUrl(value: string) {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:') return null

    if (url.hostname === 'drive.google.com' || url.hostname === 'docs.google.com') {
      const fileId = url.pathname.match(/\/d\/([^/]+)/)?.[1] ?? url.searchParams.get('id')
      return fileId ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1200` : null
    }

    return url.hostname === 'lh3.googleusercontent.com' ? url.toString() : null
  } catch {
    return null
  }
}

export function AdminPortal({ isUnlocked }: { isUnlocked: boolean }) {
  const [loginState, loginAction, isLoginPending] = useActionState(unlockAdmin, initialLoginState)
  const [products, setProducts] = useCatalogProducts()
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('catalog')
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<(typeof ARTWORK_THEMES)[number]>(ARTWORK_THEMES[0])
  const [price, setPrice] = useState('1699')
  const [imageUrl, setImageUrl] = useState('')
  const [addError, setAddError] = useState('')

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

    setProducts((current) => current.map((product) => product.id === productId ? { ...product, price: nextPrice } : product))
  }

  function resetPriceDraft(productId: string) {
    setPriceDrafts((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  function toggleStock(product: CatalogProduct) {
    setProducts((current) => current.map((item) => item.id === product.id
      ? { ...item, stockStatus: item.stockStatus === 'sold-out' ? 'in-stock' : 'sold-out' }
      : item))
  }

  function addCatalogItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddError('')

    const image = normalizeDriveImageUrl(imageUrl)
    const itemPrice = Number(price)
    if (!title.trim()) {
      setAddError('Enter a product title.')
      return
    }
    if (!Number.isSafeInteger(itemPrice) || itemPrice < 1 || itemPrice > 1_000_000) {
      setAddError('Enter a whole-number price between ₹1 and ₹10,00,000.')
      return
    }
    if (!image) {
      setAddError('Use a valid HTTPS Google Drive image link or lh3.googleusercontent.com image URL.')
      return
    }

    const newProduct: CatalogProduct = {
      id: `owner-${crypto.randomUUID()}`,
      title: title.trim(),
      garment: 'Oversized T-Shirt',
      theme: category,
      price: itemPrice,
      image,
      stockStatus: 'in-stock',
      uploaded: true,
    }

    setProducts((current) => [...current, newProduct])
    setTitle('')
    setPrice('1699')
    setImageUrl('')
  }

  if (!isUnlocked) {
    return (
      <section className="admin-page-main" aria-labelledby="admin-page-title">
        <div className="admin-notice">
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Owner access</p>
          <h1 id="admin-page-title">Admin Portal</h1>
          <p>Enter your owner PIN to manage artwork prices and stock availability.</p>
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
            <p>Manage the artwork catalog, feedback, FAQs, and captured studio leads.</p>
          </div>
          <div className="admin-dashboard-actions">
            <Link className="button button-outline-dark" href="/#collection">View storefront <ArrowUpRight aria-hidden="true" /></Link>
            <form action={signOutAdmin}><button className="button button-crimson" type="submit"><ShieldCheck aria-hidden="true" /> Sign Out</button></form>
          </div>
        </header>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {ADMIN_TABS.map((tab) => <button
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
          >{tab.label}</button>)}
        </div>

        <div className="admin-tab-panel" id="admin-panel-catalog" role="tabpanel" aria-labelledby="admin-tab-catalog" tabIndex={0} hidden={activeAdminTab !== 'catalog'}>
          <section className="admin-panel" aria-labelledby="catalog-table-title">
            <div className="admin-panel-heading">
              <div><h2 id="catalog-table-title">Artwork catalog</h2><p>{products.length} items · prices and stock update on the storefront in this browser</p></div>
              <span className="admin-count">{String(products.length).padStart(2, '0')} ITEMS</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="sr-only">All catalog artworks with editable base prices and stock status</caption>
                <thead><tr><th scope="col">Thumbnail</th><th scope="col">Product Title</th><th scope="col">Category</th><th scope="col">Base Price</th><th scope="col">Stock Status</th></tr></thead>
                <tbody>
                  {products.map((product) => {
                    const soldOut = product.stockStatus === 'sold-out'
                    return <tr key={product.id}>
                      <td><img className="admin-thumbnail" src={product.image} alt="" loading="lazy" draggable={false} onContextMenu={(event) => event.preventDefault()} /></td>
                      <td><strong className="admin-product-title">{product.title}</strong><span className="admin-product-garment">{product.garment}</span></td>
                      <td>{product.theme}</td>
                      <td><label className="admin-price-field"><span aria-hidden="true">₹</span><span className="sr-only">Base price for {product.title}</span><input type="number" min="1" max="1000000" step="1" value={priceDrafts[product.id] ?? String(product.price)} onChange={(event) => updatePrice(product.id, event.target.value)} onBlur={() => resetPriceDraft(product.id)} /></label></td>
                      <td><button className={`admin-stock-toggle${soldOut ? ' sold-out' : ''}`} type="button" aria-pressed={!soldOut} onClick={() => toggleStock(product)}>{soldOut ? 'Sold Out' : 'In Stock'}</button></td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel admin-add-panel" aria-labelledby="add-item-title">
            <div className="admin-panel-heading"><div><h2 id="add-item-title">Add New Item</h2><p>New items appear in the storefront catalog immediately.</p></div></div>
            <form className="admin-add-form" onSubmit={addCatalogItem}>
              <label className="admin-field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
              <label className="admin-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as (typeof ARTWORK_THEMES)[number])}>{ARTWORK_THEMES.map((theme) => <option value={theme} key={theme}>{theme}</option>)}</select></label>
              <label className="admin-field"><span>Price</span><span className="admin-price-field"><span aria-hidden="true">₹</span><input type="number" min="1" max="1000000" step="1" value={price} onChange={(event) => setPrice(event.target.value)} required /></span></label>
              <label className="admin-field admin-image-url-field"><span>Drive Image URL</span><input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://drive.google.com/file/d/..." required /></label>
              <button className="button button-crimson admin-add-button" type="submit"><Plus aria-hidden="true" /> Add New Item</button>
            </form>
            {addError && <p className="admin-login-error" role="alert">{addError}</p>}
            <p className="admin-storage-note">Saved to this browser&apos;s local storage. The new item uses the Oversized T-Shirt garment type.</p>
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
      </div>
    </section>
  )
}

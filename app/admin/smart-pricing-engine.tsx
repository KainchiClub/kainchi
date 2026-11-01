'use client'

import { useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { getSmartPrice, getSmartPricingTier, type CatalogProduct } from '@/components/kainchi/catalog'

export function SmartPricingEngine({ products, setProducts }: { products: CatalogProduct[]; setProducts: React.Dispatch<React.SetStateAction<CatalogProduct[]>> }) {
  const [message, setMessage] = useState('')
  function syncPrices() {
    setProducts((current) => current.map((product) => ({ ...product, price: getSmartPrice(product) })))
    setMessage(`Synced ${products.length} catalog prices to the garment tier engine. Manual overrides remain available in Artwork.`)
  }
  return <section className="admin-panel smart-pricing-engine" aria-labelledby="smart-pricing-title">
    <div className="admin-panel-heading"><div><p className="eyebrow eyebrow-dark"><Sparkles aria-hidden="true" /> Visual engine</p><h2 id="smart-pricing-title">Smart Pricing &amp; Visual Engine</h2><p>Tiering uses garment type plus visual intent tags for minimal versus intricate coverage.</p></div></div>
    <div className="smart-pricing-tiers"><article><strong>T-Shirts</strong><span>₹799 — ₹1,199</span><small>Minimal chest → intricate archival print</small></article><article><strong>Sweatshirts</strong><span>₹1,699 — ₹2,599</span><small>Subtle print → dense artwork</small></article><article><strong>Hoodies</strong><span>₹1,999 — ₹2,999</span><small>Standard fleece → heavyweight archive</small></article><article><strong>Leather / Biker Jackets</strong><span>₹4,499 — ₹6,999</span><small>Handcrafted → distressed artisan</small></article></div>
    <div className="smart-pricing-preview"><span>Current catalog coverage</span>{products.slice(0, 8).map((product) => <span key={product.id} className="smart-pricing-chip">{product.title}: {getSmartPricingTier(product)} · ₹{getSmartPrice(product).toLocaleString('en-IN')}</span>)}</div>
    <button className="button button-crimson" type="button" onClick={syncPrices}><RefreshCw aria-hidden="true" /> Refresh &amp; Sync Pricing Engine</button>
    {message && <p className="admin-partner-pass-message" role="status">{message}</p>}
  </section>
}

'use client'

import { useState } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { ARTWORK_THEMES, type CatalogProduct } from './catalog'

export function ArtworkLibrary({ products, onCustomize, onBulkUpload, recentUploadCount }: { products: CatalogProduct[]; onCustomize: (product: CatalogProduct) => void; onBulkUpload: () => void; recentUploadCount: number }) {
  const [activeTheme, setActiveTheme] = useState('All artwork')
  const filters = ['All artwork', ...ARTWORK_THEMES]
  const visibleProducts = activeTheme === 'All artwork' ? products : products.filter((product) => product.theme === activeTheme)

  return (
    <section className="artwork-section section-wrap" id="artwork" aria-labelledby="artwork-title">
      <div className="artwork-heading">
        <div><p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The artwork library</p><h2 id="artwork-title">Wear a little <em>wonder.</em></h2><p className="section-intro">Original ideas, printed with care. Find the one that feels like you.</p></div>
        <button className="button button-outline-dark" type="button" onClick={onBulkUpload}><Plus aria-hidden="true" /> Bulk upload artworks / products</button>
      </div>
      <div className="art-filters" role="group" aria-label="Filter artwork by theme">{filters.map((filter) => <button type="button" key={filter} className={`filter-pill${activeTheme === filter ? ' active' : ''}`} aria-pressed={activeTheme === filter} onClick={() => setActiveTheme(filter)}>{filter}</button>)}</div>
      {recentUploadCount > 0 && <p className="upload-success" role="status"><span className="success-mark" aria-hidden="true">✓</span>{recentUploadCount} {recentUploadCount === 1 ? 'new product has' : 'new products have'} been added to both grids.</p>}
      {visibleProducts.length > 0 ? <div className="art-grid">{visibleProducts.map((product, index) => <article className="art-card" key={product.id}>
        <button className="art-image-link" type="button" onClick={() => onCustomize(product)} aria-label={`Customize ${product.title}`}>
          <span className="art-image-wrap"><img className="art-image" src={product.image} alt={`${product.title} — ${product.garment} in the ${product.theme} theme`} loading={index > 5 ? 'lazy' : 'eager'} /><span className="art-card-sticker">{product.uploaded ? 'JUST ADDED' : 'KAINCHI ORIGINAL'}</span><span className="art-image-arrow"><ArrowUpRight aria-hidden="true" /></span></span>
        </button>
        <div className="art-card-meta"><p className="art-theme">{product.theme}</p><h3>{product.title}</h3><span className="art-garment">{product.garment} · ₹{new Intl.NumberFormat('en-IN').format(product.price)}</span></div>
        <button className="product-order" type="button" onClick={() => onCustomize(product)}>Order on WhatsApp <ArrowUpRight aria-hidden="true" /></button>
      </article>)}</div> : <div className="art-empty"><p>No pieces in this theme just yet.</p><button className="text-link" type="button" onClick={onBulkUpload}>Add the first one <Plus aria-hidden="true" /></button></div>}
      <div className="artwork-footnote"><span>AN OPEN CANVAS</span><span>Show us what you&apos;ve been making. <button type="button" onClick={onBulkUpload}>Add to the archive <ArrowUpRight aria-hidden="true" /></button></span></div>
    </section>
  )
}

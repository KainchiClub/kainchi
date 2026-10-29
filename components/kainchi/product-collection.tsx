'use client'

import { ArrowUpRight, MoveUpRight } from 'lucide-react'
import { formatRupees, type CatalogProduct } from './catalog'

export function ProductCollection({ products, onCustomize }: { products: CatalogProduct[]; onCustomize: (product: CatalogProduct) => void }) {
  return (
    <section className="collection-section section-wrap" id="collection" aria-labelledby="collection-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The essentials</p>
          <h2 id="collection-title">Your next <em>favourite.</em></h2>
          <p className="section-intro">Good fabric is just the beginning. Pick your piece, then make it yours.</p>
        </div>
      </div>
      <div className="product-grid">
        {products.map((product, index) => {
          const soldOut = product.stockStatus === 'sold-out'
          return <article className="product-card" key={product.id}>
            <button className="product-image-link" type="button" onClick={() => onCustomize(product)} aria-label={`View ${product.title}`}>
              <span className="product-image"><img src={product.image} alt={`${product.title} — ${product.garment}, ${product.theme} artwork`} loading={index > 5 ? 'lazy' : 'eager'} /><span className={`stock-badge${soldOut ? ' sold-out' : ''}`} aria-label={`Stock status: ${soldOut ? 'Sold Out' : 'In Stock'}`}>{soldOut ? 'Sold Out' : 'In Stock'}</span><span className="product-number">{String(index + 1).padStart(2, '0')}</span><span className="product-image-arrow"><MoveUpRight aria-hidden="true" /></span></span>
            </button>
            <div className="product-meta"><p className="product-theme">{product.theme}</p><h3>{product.title}</h3><p className="product-garment">{product.garment}</p><span className="product-price">{formatRupees(product.price)}</span></div>
            <button className="product-order" type="button" onClick={() => onCustomize(product)} disabled={soldOut}>{soldOut ? 'Sold Out' : 'Order on WhatsApp'}{!soldOut && <ArrowUpRight aria-hidden="true" />}</button>
          </article>
        })}
      </div>
      <div className="collection-note"><span>{String(products.length).padStart(2, '0')} PIECES</span><span>Designed to be worn. Made to be remembered.</span><a href="#artwork">Find your print <ArrowUpRight aria-hidden="true" /></a></div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Archive, ArrowUpRight, Search, X } from 'lucide-react'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import { ARTWORK_THEMES, type CatalogProduct } from './catalog'

const ARCHIVE_PAGE_SIZE = 12
const STICKER_ARTWORK_IDS = ['drive-14', 'drive-06', 'drive-39', 'drive-22', 'drive-38', 'drive-08']

export function ArtworkLibrary({ products, onCustomize }: { products: CatalogProduct[]; onCustomize: (product: CatalogProduct) => void }) {
  const [activeTheme, setActiveTheme] = useState('All artwork')
  const [searchTerm, setSearchTerm] = useState('')
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [visibleLimit, setVisibleLimit] = useState(ARCHIVE_PAGE_SIZE)
  const filters = ['All artwork', ...ARTWORK_THEMES]
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase()
    return products.filter((product) => {
      const matchesTheme = activeTheme === 'All artwork' || product.theme === activeTheme
      const searchableText = `${product.title} ${product.theme} ${product.garment}`.toLocaleLowerCase()
      return matchesTheme && (!query || searchableText.includes(query))
    })
  }, [activeTheme, products, searchTerm])
  const visibleProducts = filteredProducts.slice(0, visibleLimit)
  const stickerArtworks = STICKER_ARTWORK_IDS.flatMap((id) => {
    const artwork = products.find((product) => product.id === id)
    return artwork ? [artwork] : []
  })

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    setVisibleLimit(ARCHIVE_PAGE_SIZE)
    if (value.trim()) setIsArchiveOpen(true)
  }

  function toggleArchive() {
    if (isArchiveOpen) {
      setIsArchiveOpen(false)
      setActiveTheme('All artwork')
      setSearchTerm('')
      setVisibleLimit(ARCHIVE_PAGE_SIZE)
      return
    }
    setIsArchiveOpen(true)
  }

  return (
    <section className="artwork-section section-wrap" id="artwork" aria-labelledby="artwork-title">
      <div className="artwork-heading">
        <div>
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Original artwork</p>
          <h2 id="artwork-title">Find your <em>piece</em></h2>
          <p className="section-intro">Search all {products.length} original designs by name, theme, or garment.</p>
        </div>
        <div className="artwork-sticker-collage" role="img" aria-label={`A collage of Kainchi Club originals: ${stickerArtworks.map((artwork) => artwork.title).join(', ')}`}>
          {stickerArtworks.map((artwork, index) => <span className="artwork-sticker" data-sticker={index + 1} key={artwork.id}>
            <Image src={resolveDriveImageUrl(artwork.image)} alt="" aria-hidden="true" width={500} height={500} loading="lazy" fetchPriority="low" decoding="async" unoptimized draggable={false} onError={fallbackImageOnError} />
          </span>)}
        </div>
      </div>
      <div className="artwork-tools">
        <label className="artwork-search" htmlFor="artwork-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search the artwork archive</span>
          <input id="artwork-search" type="search" value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search prints, themes, or garments" />
        </label>
        <button className="button button-outline-dark artwork-archive-toggle" type="button" aria-expanded={isArchiveOpen} aria-controls="artwork-archive-results" onClick={toggleArchive}>
          {isArchiveOpen ? <X aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {isArchiveOpen ? 'Close archive' : `Browse all ${products.length}`}
        </button>
      </div>
      {!isArchiveOpen && <div className="art-archive-invite">
        <span className="archive-invite-mark" aria-hidden="true">{String(products.length).padStart(2, '0')}</span>
        <p>Every print, one place. Open the archive to explore all themes, garments, and original designs.</p>
        <span className="archive-invite-index">THEME INDEX · {ARTWORK_THEMES.length} THEMES</span>
      </div>}
      <div id="artwork-archive-results" hidden={!isArchiveOpen}>
        {isArchiveOpen ? (
          <div>
            <div className="art-filters" role="group" aria-label="Filter artwork by theme">
              {filters.map((filter) => <button type="button" key={filter} className={`filter-pill${activeTheme === filter ? ' active' : ''}`} aria-pressed={activeTheme === filter} onClick={() => { setActiveTheme(filter); setVisibleLimit(ARCHIVE_PAGE_SIZE) }}>{filter}</button>)}
            </div>
            <p className="art-archive-count" aria-live="polite">Showing {Math.min(visibleLimit, filteredProducts.length)} of {filteredProducts.length} pieces</p>
            {visibleProducts.length > 0 ? <div className="art-grid" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>{visibleProducts.map((product) => {
              const soldOut = product.stockStatus === 'sold-out'
              return <article className="art-card" key={product.id} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <button className="art-image-link" type="button" onClick={() => onCustomize(product)} aria-label={`View ${product.title}`}>
                  <span className="art-image-wrap"><Image className="art-image" src={resolveDriveImageUrl(product.image)} alt={`${product.title} — ${product.garment} in the ${product.theme} theme`} width={900} height={900} loading="lazy" fetchPriority="low" decoding="async" unoptimized draggable={false} onError={fallbackImageOnError} onContextMenu={(event) => event.preventDefault()} /><span className={`stock-badge${soldOut ? ' sold-out' : ''}`} aria-label={`Stock status: ${soldOut ? 'Sold Out' : 'In Stock'}`}>{soldOut ? 'Sold Out' : 'In Stock'}</span><span className="art-card-sticker">KAINCHI ORIGINAL</span><span className="art-image-arrow"><ArrowUpRight aria-hidden="true" /></span></span>
                </button>
                <div className="art-card-meta"><p className="art-theme">{product.theme}</p><h3>{product.title} <span className="product-code-label">· {product.productCode}</span></h3><span className="art-garment">{product.garment} · ₹{new Intl.NumberFormat('en-IN').format(product.price)}</span></div>
                <button className="product-order" type="button" onClick={() => onCustomize(product)} disabled={soldOut}>{soldOut ? 'Sold Out' : 'Order on WhatsApp'}{!soldOut && <ArrowUpRight aria-hidden="true" />}</button>
              </article>
            })}</div> : <div className="art-empty"><p>No pieces match that search just yet.</p></div>}
            {visibleProducts.length < filteredProducts.length && <div className="art-archive-more"><button className="button button-outline-dark" type="button" onClick={() => setVisibleLimit((current) => current + ARCHIVE_PAGE_SIZE)}>Load more artwork</button></div>}
          </div>
        ) : null}
      </div>
      <div className="artwork-footnote"><span>{String(products.length).padStart(2, '0')} ORIGINAL PIECES</span><span>Good ideas deserve to be worn.</span></div>
    </section>
  )
}

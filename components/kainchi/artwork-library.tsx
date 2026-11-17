'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { CATALOG_FILTER_EVENT, GARMENT_GROUPS, type GarmentGroup } from './storefront-events'
import { Archive, ArrowUpRight, Search, X } from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { ARTWORK_THEMES, getProductGender, type CatalogProduct } from './catalog'

const ARCHIVE_PAGE_SIZE = 12
const STICKER_ARTWORK_IDS = ['drive-14', 'drive-06', 'drive-39', 'drive-22', 'drive-38', 'drive-08']

type GenderTab = 'all' | 'men' | 'women'

export function ArtworkLibrary({ products, onCustomize }: { products: CatalogProduct[]; onCustomize: (product: CatalogProduct) => void }) {
  const [activeTheme, setActiveTheme] = useState('All artwork')
  const [activeGender, setActiveGender] = useState<GenderTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [visibleLimit, setVisibleLimit] = useState(ARCHIVE_PAGE_SIZE)
  const [garmentGroup, setGarmentGroup] = useState<GarmentGroup>('all')
  const filters = ['All artwork', ...ARTWORK_THEMES]

  const genderCounts = useMemo(() => {
    let men = 0
    let women = 0
    for (const product of products) {
      const gender = getProductGender(product)
      if (gender === 'men' || gender === 'unisex') men += 1
      if (gender === 'women' || gender === 'unisex') women += 1
    }
    return { all: products.length, men, women }
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase()
    const garmentPattern = garmentGroup === 'all' ? null : GARMENT_GROUPS[garmentGroup].pattern
    return products.filter((product) => {
      const gender = getProductGender(product)
      const matchesGender =
        activeGender === 'all' ||
        (activeGender === 'men' && (gender === 'men' || gender === 'unisex')) ||
        (activeGender === 'women' && (gender === 'women' || gender === 'unisex'))
      const matchesTheme = activeTheme === 'All artwork' || product.theme === activeTheme
      const matchesGarment = !garmentPattern || garmentPattern.test(product.garment)
      const searchableText = `${product.title} ${product.theme} ${product.garment}`.toLocaleLowerCase()
      return matchesGender && matchesTheme && matchesGarment && (!query || searchableText.includes(query))
    })
  }, [activeGender, activeTheme, garmentGroup, products, searchTerm])

  useEffect(() => {
    const handleFilter = (event: Event) => {
      const group = (event as CustomEvent<GarmentGroup>).detail ?? 'all'
      setGarmentGroup(group)
      setActiveTheme('All artwork')
      setSearchTerm('')
      setVisibleLimit(ARCHIVE_PAGE_SIZE)
      setIsArchiveOpen(true)
    }

    const handleOpenArchive = () => {
      setIsArchiveOpen(true)
      setVisibleLimit(ARCHIVE_PAGE_SIZE)
    }

    const handleExploreClick = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest?.('[data-open-archive="true"]')
      if (trigger) {
        setIsArchiveOpen(true)
        setVisibleLimit(ARCHIVE_PAGE_SIZE)
      }
    }

    window.addEventListener(CATALOG_FILTER_EVENT, handleFilter)
    window.addEventListener('kainchi:open-archive', handleOpenArchive)
    document.addEventListener('click', handleExploreClick)
    return () => {
      window.removeEventListener(CATALOG_FILTER_EVENT, handleFilter)
      window.removeEventListener('kainchi:open-archive', handleOpenArchive)
      document.removeEventListener('click', handleExploreClick)
    }
  }, [])

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

  function selectGender(gender: GenderTab) {
    setActiveGender(gender)
    setVisibleLimit(ARCHIVE_PAGE_SIZE)
    setIsArchiveOpen(true)
  }

  function toggleArchive() {
    if (isArchiveOpen) {
      setIsArchiveOpen(false)
      setActiveTheme('All artwork')
      setActiveGender('all')
      setGarmentGroup('all')
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
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Original artwork · Men &amp; Women</p>
          <h2 id="artwork-title">Find your <em>piece</em></h2>
          <p className="section-intro">Crafted for both Men &amp; Women — browse all {products.length} original designs by fit, theme, or garment.</p>
        </div>
        <div className="artwork-sticker-collage" role="img" aria-label={`A collage of Kainchi Club originals: ${stickerArtworks.map((artwork) => artwork.title).join(', ')}`}>
          {stickerArtworks.map((artwork, index) => <span className="artwork-sticker" data-sticker={index + 1} key={artwork.id}>
            <Image src={resolveDriveImageUrl(artwork.image, 320)} alt="" aria-hidden="true" width={500} height={500} sizes="(max-width: 620px) 28vw, 160px" loading="lazy" fetchPriority="low" decoding="async" unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(artwork.image, 320))} draggable={false} onError={fallbackImageOnError} />
          </span>)}
        </div>
      </div>

      {/* Prominent Men & Women Section Switcher */}
      <div className="art-filters" role="group" aria-label="Shop by Men or Women" style={{ marginBottom: '0.85rem' }}>
        <button
          type="button"
          className={`filter-pill${activeGender === 'all' ? ' active' : ''}`}
          aria-pressed={activeGender === 'all'}
          onClick={() => selectGender('all')}
        >
          All Pieces ({genderCounts.all})
        </button>
        <button
          type="button"
          className={`filter-pill${activeGender === 'men' ? ' active' : ''}`}
          aria-pressed={activeGender === 'men'}
          onClick={() => selectGender('men')}
        >
          Men&apos;s Edit ({genderCounts.men})
        </button>
        <button
          type="button"
          className={`filter-pill${activeGender === 'women' ? ' active' : ''}`}
          aria-pressed={activeGender === 'women'}
          onClick={() => selectGender('women')}
        >
          Women&apos;s Edit ({genderCounts.women})
        </button>
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
        <p>Every print, one place. Select Men&apos;s Edit, Women&apos;s Edit, or open the full archive to explore all designs.</p>
        <span className="archive-invite-index">MEN &amp; WOMEN · {ARTWORK_THEMES.length} THEMES</span>
      </div>}
      <div id="artwork-archive-results" hidden={!isArchiveOpen}>
        {isArchiveOpen ? (
          <div>
            <div className="art-filters" role="group" aria-label="Filter artwork by theme">
              {filters.map((filter) => <button type="button" key={filter} className={`filter-pill${activeTheme === filter ? ' active' : ''}`} aria-pressed={activeTheme === filter} onClick={() => { setActiveTheme(filter); setVisibleLimit(ARCHIVE_PAGE_SIZE) }}>{filter}</button>)}
            </div>
            {garmentGroup !== 'all' && <div className="garment-filter-chip-row"><button type="button" className="garment-filter-chip" onClick={() => { setGarmentGroup('all'); setVisibleLimit(ARCHIVE_PAGE_SIZE) }} aria-label={`Clear ${GARMENT_GROUPS[garmentGroup].label} filter`}>{GARMENT_GROUPS[garmentGroup].label} <X aria-hidden="true" /></button></div>}
            <p className="art-archive-count" aria-live="polite">
              Showing {Math.min(visibleLimit, filteredProducts.length)} of {filteredProducts.length} pieces
              {activeGender === 'men' ? " · Men's Edit (includes Unisex)" : activeGender === 'women' ? " · Women's Edit (includes Unisex)" : ''}
            </p>
            {visibleProducts.length > 0 ? <div className="art-grid" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>{visibleProducts.map((product) => {
              const soldOut = product.stockStatus === 'sold-out'
              const gender = getProductGender(product)
              const sectionTag = gender === 'women' ? 'WOMEN' : gender === 'men' ? 'MEN' : 'MEN & WOMEN'
              return <article className="art-card" key={product.id} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <button className="art-image-link" type="button" onClick={() => onCustomize(product)} aria-label={`View ${product.title}`}>
                  <span className="art-image-wrap"><Image className="art-image" src={resolveDriveImageUrl(product.image, 500)} alt={`${product.title} — ${product.garment} in the ${product.theme} theme`} width={600} height={800} quality={75} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" loading="lazy" fetchPriority="low" decoding="async" unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(product.image, 500))} draggable={false} onError={fallbackImageOnError} onContextMenu={(event) => event.preventDefault()} /><span className={`stock-badge${soldOut ? ' sold-out' : ''}`} aria-label={`Stock status: ${soldOut ? 'Sold Out' : 'In Stock'}`}>{soldOut ? 'Sold Out' : 'In Stock'}</span><span className="art-card-sticker">{sectionTag}</span><span className="art-image-arrow"><ArrowUpRight aria-hidden="true" /></span></span>
                </button>
                <div className="art-card-meta"><p className="art-theme">{product.theme} · {sectionTag}</p><h3>{product.title} <span className="product-code-label">· {product.productCode}</span></h3><span className="art-garment">{product.garment} · ₹{new Intl.NumberFormat('en-IN').format(product.price)}</span></div>
                <button className="product-order" type="button" onClick={() => onCustomize(product)} disabled={soldOut}>{soldOut ? 'Sold Out' : 'Order on WhatsApp'}{!soldOut && <ArrowUpRight aria-hidden="true" />}</button>
              </article>
            })}</div> : <div className="art-empty"><p>No pieces match that search just yet.</p></div>}
            {visibleProducts.length < filteredProducts.length && <div className="art-archive-more"><button className="button button-outline-dark" type="button" onClick={() => setVisibleLimit((current) => current + ARCHIVE_PAGE_SIZE)}>Load more artwork</button></div>}
          </div>
        ) : null}
      </div>
      <div className="artwork-footnote"><span>{String(products.length).padStart(2, '0')} ORIGINAL PIECES · MEN &amp; WOMEN</span><span>Good ideas deserve to be worn.</span></div>
    </section>
  )
}

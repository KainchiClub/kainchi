'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { CATALOG_FILTER_EVENT, GARMENT_GROUPS, type GarmentGroup } from './storefront-events'
import { Archive, ArrowUpRight, Search, ShoppingBag, Shuffle, X } from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { ARTWORK_THEMES, getProductGender, type CatalogProduct } from './catalog'
import { STORY_FILTER_PATTERNS, type StoryFilter } from './collection-stories'

const ARCHIVE_PAGE_SIZE = 12
const STICKER_ARTWORK_IDS = ['drive-14', 'drive-06', 'drive-39', 'drive-22', 'drive-38', 'drive-08']

type GenderTab = 'all' | 'men' | 'women'

function smartShuffleCatalog(list: CatalogProduct[], seed: number): CatalogProduct[] {
  const copy = [...list]
  let s = seed || 1
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function ArtworkLibrary({
  products,
  onCustomize,
  onQuickAddToCart,
}: {
  products: CatalogProduct[]
  onCustomize: (product: CatalogProduct) => void
  onQuickAddToCart?: (product: CatalogProduct) => void
}) {
  const [activeTheme, setActiveTheme] = useState('All artwork')
  const [activeGender, setActiveGender] = useState<GenderTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [visibleLimit, setVisibleLimit] = useState(ARCHIVE_PAGE_SIZE)
  const [garmentGroup, setGarmentGroup] = useState<GarmentGroup>('all')
  const [storyFilter, setStoryFilter] = useState<StoryFilter>('all')
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 100000) + 1)
  const filters = ['All artwork', ...ARTWORK_THEMES]

  const genderCounts = useMemo(() => {
    let men = 0
    let women = 0
    for (const product of products) {
      const gender = getProductGender(product)
      if (gender === 'women') women += 1
      else men += 1
    }
    return { all: products.length, men, women }
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase()
    const garmentPattern = garmentGroup === 'all' ? null : GARMENT_GROUPS[garmentGroup].pattern
    const storyPattern = storyFilter === 'all' ? null : STORY_FILTER_PATTERNS[storyFilter]
    const matched = products.filter((product) => {
      const gender = getProductGender(product)
      const matchesGender =
        activeGender === 'all' ||
        (activeGender === 'women' && gender === 'women') ||
        (activeGender === 'men' && gender !== 'women')
      const matchesTheme = activeTheme === 'All artwork' || product.theme === activeTheme
      const matchesGarment = !garmentPattern || garmentPattern.test(product.garment)
      const matchesStory = !storyPattern || storyPattern.test(product.garment)
      const searchableText = `${product.title} ${product.theme} ${product.garment}`.toLocaleLowerCase()
      return matchesGender && matchesTheme && matchesGarment && matchesStory && (!query || searchableText.includes(query))
    })
    return smartShuffleCatalog(matched, shuffleSeed)
  }, [activeGender, activeTheme, garmentGroup, storyFilter, products, searchTerm, shuffleSeed])

  useEffect(() => {
    const handleFilter = (event: Event) => {
      const group = (event as CustomEvent<GarmentGroup>).detail ?? 'all'
      setGarmentGroup(group)
      setStoryFilter('all')
      setActiveTheme('All artwork')
      setSearchTerm('')
      setVisibleLimit(ARCHIVE_PAGE_SIZE)
      setIsArchiveOpen(true)
    }

    const handleStoryFilter = (event: Event) => {
      const nextStory = (event as CustomEvent<StoryFilter>).detail ?? 'all'
      setStoryFilter(nextStory)
      setGarmentGroup('all')
      setActiveTheme('All artwork')
      setActiveGender('all')
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
    window.addEventListener('kainchi:story-filter', handleStoryFilter)
    window.addEventListener('kainchi:open-archive', handleOpenArchive)
    document.addEventListener('click', handleExploreClick)
    return () => {
      window.removeEventListener(CATALOG_FILTER_EVENT, handleFilter)
      window.removeEventListener('kainchi:story-filter', handleStoryFilter)
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
      setStoryFilter('all')
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
          <p className="section-intro">Crafted to order in small batches for Men &amp; Women — browse all {products.length} rotating designs by fit, theme, or garment.</p>
        </div>
        <div className="artwork-sticker-collage" role="img" aria-label={`A collage of Kainchi Club originals: ${stickerArtworks.map((artwork) => artwork.title).join(', ')}`}>
          {stickerArtworks.map((artwork, index) => <span className="artwork-sticker" data-sticker={index + 1} key={artwork.id}>
            <Image src={resolveDriveImageUrl(artwork.image, 320)} alt="" aria-hidden="true" width={500} height={500} sizes="(max-width: 620px) 28vw, 160px" loading="lazy" fetchPriority="low" decoding="async" unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(artwork.image, 320))} draggable={false} onError={fallbackImageOnError} />
          </span>)}
        </div>
      </div>

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
        <button
          className="button button-outline-dark"
          type="button"
          onClick={() => {
            setShuffleSeed((s) => s + Math.floor(Math.random() * 997) + 1)
            setIsArchiveOpen(true)
          }}
        >
          <Shuffle aria-hidden="true" /> Shuffle Drop
        </button>
        <button className="button button-outline-dark artwork-archive-toggle" type="button" aria-expanded={isArchiveOpen} aria-controls="artwork-archive-results" onClick={toggleArchive}>
          {isArchiveOpen ? <X aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {isArchiveOpen ? 'Close archive' : `Browse all ${products.length}`}
        </button>
      </div>
      {!isArchiveOpen && <div className="art-archive-invite">
        <span className="archive-invite-mark" aria-hidden="true">{String(products.length).padStart(2, '0')}</span>
        <p>Every print, dynamically rotated. Select Men&apos;s Edit, Women&apos;s Edit, or open the full archive to explore all made-to-order designs.</p>
        <span className="archive-invite-index">MEN &amp; WOMEN · {ARTWORK_THEMES.length} THEMES</span>
      </div>}
      <div id="artwork-archive-results" hidden={!isArchiveOpen}>
        {isArchiveOpen ? (
          <div>
            <div className="art-filters" role="group" aria-label="Filter artwork by theme">
              {filters.map((filter) => <button type="button" key={filter} className={`filter-pill${activeTheme === filter ? ' active' : ''}`} aria-pressed={activeTheme === filter} onClick={() => { setActiveTheme(filter); setVisibleLimit(ARCHIVE_PAGE_SIZE) }}>{filter}</button>)}
            </div>
            {garmentGroup !== 'all' && <div className="garment-filter-chip-row"><button type="button" className="garment-filter-chip" onClick={() => { setGarmentGroup('all'); setVisibleLimit(ARCHIVE_PAGE_SIZE) }} aria-label={`Clear ${GARMENT_GROUPS[garmentGroup].label} filter`}>{GARMENT_GROUPS[garmentGroup].label} <X aria-hidden="true" /></button></div>}
            {storyFilter !== 'all' && <div className="garment-filter-chip-row"><button type="button" className="garment-filter-chip" onClick={() => { setStoryFilter('all'); setVisibleLimit(ARCHIVE_PAGE_SIZE) }} aria-label={`Clear ${storyFilter} filter`} style={{ textTransform: 'capitalize' }}>{storyFilter} <X aria-hidden="true" /></button></div>}
            <p className="art-archive-count" aria-live="polite">
              Showing {Math.min(visibleLimit, filteredProducts.length)} of {filteredProducts.length} pieces (Shuffled Rotation)
              {activeGender === 'men' ? " · Men's Edit" : activeGender === 'women' ? " · Women's Edit" : ''}
            </p>
            {visibleProducts.length > 0 ? <div className="art-grid" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>{visibleProducts.map((product) => {
              const soldOut = product.stockStatus === 'sold-out'
              const gender = getProductGender(product)
              const sectionTag = gender === 'women' ? 'WOMEN' : 'MEN'
              return <article className="art-card" key={product.id} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <button className="art-image-link" type="button" onClick={() => onCustomize(product)} aria-label={`View ${product.title}`}>
                  <span className="art-image-wrap"><Image className="art-image" src={resolveDriveImageUrl(product.image, 500)} alt={`${product.title} — ${product.garment} in the ${product.theme} theme`} width={600} height={800} quality={75} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" loading="lazy" fetchPriority="low" decoding="async" unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(product.image, 500))} draggable={false} onError={fallbackImageOnError} onContextMenu={(event) => event.preventDefault()} /><span className={`stock-badge${soldOut ? ' sold-out' : ''}`} aria-label={`Stock status: ${soldOut ? 'Sold Out' : 'Made to Order'}`}>{soldOut ? 'Sold Out' : 'Made to Order'}</span><span className="art-card-sticker">{sectionTag}</span><span className="art-image-arrow"><ArrowUpRight aria-hidden="true" /></span></span>
                </button>
                <div className="art-card-meta"><p className="art-theme">{product.theme} · {sectionTag}</p><h3>{product.title} <span className="product-code-label">· {product.productCode}</span></h3><span className="art-garment">{product.garment} · ₹{new Intl.NumberFormat('en-IN').format(product.price)}</span></div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginTop: 'auto' }}>
                  <button
                    className="product-order"
                    type="button"
                    onClick={() => onCustomize(product)}
                    disabled={soldOut}
                    style={{ flex: 1, marginTop: 0 }}
                  >
                    {soldOut ? 'Sold Out' : 'Order on WhatsApp'}
                    {!soldOut && <ArrowUpRight aria-hidden="true" />}
                  </button>
                  {onQuickAddToCart && !soldOut && (
                    <button
                      type="button"
                      onClick={() => onQuickAddToCart(product)}
                      aria-label={`Add ${product.title} to cart`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '0 12px',
                        borderRadius: '999px',
                        border: '1px solid rgba(24, 18, 16, 0.28)',
                        background: 'transparent',
                        color: '#181210',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <ShoppingBag size={14} aria-hidden="true" />
                      Add to Cart
                    </button>
                  )}
                </div>
              </article>
            })}</div> : <div className="art-empty"><p>No pieces match that search just yet.</p></div>}
            {visibleProducts.length < filteredProducts.length && <div className="art-archive-more"><button className="button button-outline-dark" type="button" onClick={() => setVisibleLimit((current) => current + ARCHIVE_PAGE_SIZE)}>Load more artwork</button></div>}
          </div>
        ) : null}
      </div>
      <div className="artwork-footnote"><span>{String(products.length).padStart(2, '0')} ORIGINAL PIECES · MEN &amp; WOMEN</span><span>Crafted to order · Dispatched in 5–7 days.</span></div>
    </section>
  )
}

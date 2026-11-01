import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight } from 'lucide-react'
import type { CatalogProduct } from './catalog'

export const referenceArtwork = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793160871872.png-Y2RtOSLMpYFAqB6viibP85H603FkAt.jpeg'
const LAYOUTS = ['signature-triptych', 'asymmetric-split', 'floating-cascade', 'archival-trio', 'runway-spotlight', 'offset-duo', 'diagonal-stack', 'minimalist-grid', 'horizon-strip', 'artisan-centerpiece'] as const
const LAYOUT_KEY = 'kainchi_wear_art_layout_cycle'

export function HeroShowcase({ products = [] }: { products?: CatalogProduct[] }) {
  const [layoutIndex, setLayoutIndex] = useState(0)
  const [secondaryArtworkReady, setSecondaryArtworkReady] = useState(false)
  useEffect(() => {
    const idleWindow = window as unknown as {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }
    const requestIdle = idleWindow.requestIdleCallback
    const handle = requestIdle
      ? requestIdle(() => setSecondaryArtworkReady(true), { timeout: 1800 })
      : window.setTimeout(() => setSecondaryArtworkReady(true), 300)

    return () => {
      if (requestIdle) idleWindow.cancelIdleCallback?.(handle)
      else window.clearTimeout(handle)
    }
  }, [])
  useEffect(() => {
    try {
      const used = JSON.parse(sessionStorage.getItem(LAYOUT_KEY) ?? '[]').filter((value: unknown): value is number => typeof value === 'number')
      const remaining = LAYOUTS.map((_, index) => index).filter((index) => !used.includes(index))
      const next = remaining[Math.floor(Math.random() * remaining.length)] ?? 0
      setLayoutIndex(next)
      sessionStorage.setItem(LAYOUT_KEY, JSON.stringify([...used, next].slice(-LAYOUTS.length)))
    } catch { setLayoutIndex(0) }
  }, [])
  const artwork = useMemo(() => Array.from({ length: 4 }, (_, index) => products[index % Math.max(products.length, 1)]?.image ?? referenceArtwork), [products])
  const titles = useMemo(() => Array.from({ length: 4 }, (_, index) => products[index % Math.max(products.length, 1)]?.title ?? 'Wearable art'), [products])

  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> Independent streetwear · Made personal</p>
        <h1 id="hero-title">Wear your<br /><em>own art.</em></h1>
        <p className="hero-description">A little bit wild. A whole lot you. Discover wearable art made for the ones who never quite fit the frame.</p>
        <div className="hero-actions">
          <a className="button button-crimson" href="#collection">Explore the collection <ArrowRight aria-hidden="true" /></a>
          <a className="text-link" href="#artwork">See the artwork <ArrowDownRight aria-hidden="true" /></a>
        </div>
        <div className="hero-note"><span className="note-rule" /> Small-batch pieces, made to feel like yours.</div>
      </div>

      <div className={`hero-gallery wear-art-layout layout-${LAYOUTS[layoutIndex]}`} aria-label={`Kainchi Club wearable art exhibition, ${LAYOUTS[layoutIndex].replaceAll('-', ' ')}`}>
        <div className="exhibit-label exhibit-label-top"><span>THE KAINCHI ARCHIVE</span><span>01 / 04</span></div>
        <div className="artwork-back artwork-back-left">
          {secondaryArtworkReady && <Image src={artwork[0]} alt={`${titles[0]} editorial garment detail`} className="art-crop crop-hoodie" width={1200} height={1200} loading="lazy" fetchPriority="low" decoding="async" />}
          <span className="floating-caption">01 — THE WILD SIDE</span>
        </div>
        <div className="artwork-back artwork-back-right">
          {secondaryArtworkReady && <Image src={artwork[1]} alt={`${titles[1]} craft detail`} className="art-crop crop-denim" width={1200} height={1200} loading="lazy" fetchPriority="low" decoding="async" />}
          <span className="floating-caption">02 — EASTERN MYTH</span>
        </div>
        <figure className="hero-artwork">
          <Image src={artwork[2]} alt={`${titles[2]} featured wearable artwork`} width={1200} height={1200} priority={true} fetchPriority="high" decoding="async" />
          <figcaption><span>Wearable art, cut from a different cloth.</span><span>KA·01</span></figcaption>
        </figure>
        <div className="artwork-accent-frame">{secondaryArtworkReady && <Image src={artwork[3]} alt={`${titles[3]} editorial detail`} width={800} height={800} loading="lazy" fetchPriority="low" decoding="async" />}</div>
        <div className="exhibit-stamp" aria-hidden="true"><span>MADE</span><strong>BY<br />YOU</strong><span>WORN<br />BY YOU</span></div>
        <div className="hero-gallery-foot"><span>GARMENTS AS A CANVAS</span><span>EST. WITH INTENTION</span></div>
      </div>
      <a className="scroll-cue" href="#collection" aria-label="Scroll to the collection"><span>SCROLL TO EXPLORE</span><ArrowDownRight aria-hidden="true" /></a>
    </section>
  )
}

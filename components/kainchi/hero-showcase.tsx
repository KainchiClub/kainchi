import Image from 'next/image'
import { ArrowDownRight, ArrowRight } from 'lucide-react'
import type { CatalogProduct } from './catalog'

export const referenceArtwork = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793160871872.png-Y2RtOSLMpYFAqB6viibP85H603FkAt.jpeg'
export function HeroShowcase(_props: { products?: CatalogProduct[] }) {
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

      <div className="hero-gallery wear-art-layout">
        <Image
          className="hero-poster-image"
          src="/images/kainchi-hero-editorial-1200.webp"
          alt="Kainchi Club editorial poster featuring a hoodie, leather jacket, sweatshirt, and embroidered jeans."
          width={1200}
          height={896}
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={75}
          priority
          fetchPriority="high"
        />
      </div>
      <a className="scroll-cue" href="#collection" aria-label="Scroll to the collection"><span>SCROLL TO EXPLORE</span><ArrowDownRight aria-hidden="true" /></a>
    </section>
  )
}

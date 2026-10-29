import { ArrowUpRight, Scissors } from 'lucide-react'
import { ArtworkLibrary } from '@/components/kainchi/artwork-library'
import { HeroShowcase } from '@/components/kainchi/hero-showcase'
import { ProductCollection } from '@/components/kainchi/product-collection'
import { SiteHeader } from '@/components/kainchi/site-header'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroShowcase />
        <div className="canvas-band" aria-label="Made with care, worn with feeling"><span>MADE WITH CARE</span><span className="canvas-band-mark"><Scissors aria-hidden="true" /></span><span>WORN WITH FEELING</span></div>
        <ProductCollection />
        <ArtworkLibrary />
        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="story-number">K—C<br />2026</div>
          <div className="story-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A small studio with a big heart</p><h2 id="story-title">Not just what<br />you <em>wear.</em><br />What you <em>carry.</em></h2></div>
          <div className="story-aside"><p>We believe the things we wear can say the things we don&apos;t. Kainchi Club is a home for independent art, honest craft, and pieces that feel like they were always yours.</p><a href="https://wa.me/91XXXXXXXXXX?text=Hi%20Kainchi%20Club%2C%20tell%20me%20about%20your%20studio." className="story-link">A note to the studio <ArrowUpRight aria-hidden="true" /></a></div>
          <div className="story-texture" aria-hidden="true" />
        </section>
      </main>
      <footer className="site-footer"><a className="wordmark footer-wordmark" href="#top"><span className="wordmark-mark" aria-hidden="true"><Scissors /></span><span>KAINCHI <span className="wordmark-light">CLUB</span></span></a><p>Wear your own art. © 2026 Kainchi Club</p><div className="footer-links"><a href="https://wa.me/91XXXXXXXXXX?text=Hi%20Kainchi%20Club" aria-label="Contact Kainchi Club on WhatsApp">WhatsApp <ArrowUpRight aria-hidden="true" /></a><a href="#top" aria-label="Back to top">Back to top <ArrowUpRight aria-hidden="true" /></a></div></footer>
    </>
  )
}

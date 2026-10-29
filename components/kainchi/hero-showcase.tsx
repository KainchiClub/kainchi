import { ArrowDownRight, ArrowRight } from 'lucide-react'

export const referenceArtwork = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793160871872.png-Y2RtOSLMpYFAqB6viibP85H603FkAt.jpeg'

export function HeroShowcase() {
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

      <div className="hero-gallery" aria-label="Kainchi Club wearable art exhibition">
        <div className="exhibit-label exhibit-label-top"><span>THE KAINCHI ARCHIVE</span><span>01 / 04</span></div>
        <div className="artwork-back artwork-back-left">
          <img src={referenceArtwork} alt="Flame and forest artwork on a dark hoodie" className="art-crop crop-hoodie" />
          <span className="floating-caption">01 — THE WILD SIDE</span>
        </div>
        <div className="artwork-back artwork-back-right">
          <img src={referenceArtwork} alt="Dragon print detail on denim" className="art-crop crop-denim" />
          <span className="floating-caption">02 — EASTERN MYTH</span>
        </div>
        <figure className="hero-artwork">
          <img src={referenceArtwork} alt="Kainchi Club custom hoodie, leather jacket, sweatshirt and illustrated denim displayed together" />
          <figcaption><span>Wearable art, cut from a different cloth.</span><span>KA·01</span></figcaption>
        </figure>
        <div className="exhibit-stamp" aria-hidden="true"><span>MADE</span><strong>BY<br />YOU</strong><span>WORN<br />BY YOU</span></div>
        <div className="hero-gallery-foot"><span>GARMENTS AS A CANVAS</span><span>EST. WITH INTENTION</span></div>
      </div>
      <a className="scroll-cue" href="#collection" aria-label="Scroll to the collection"><span>SCROLL TO EXPLORE</span><ArrowDownRight aria-hidden="true" /></a>
    </section>
  )
}

import { ArrowUpRight, Box, Package, Recycle, ScrollText } from 'lucide-react'

const packagingImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_5kl0775kl0775kl0.png-hPQJW5RzGUOvJenVxL6HVXJW8qYQar.jpeg'

const packaging = [
  { title: 'The Experience Box', subtitle: 'A little ceremony for the reveal.', icon: Box, alt: 'Kainchi Club crimson experience box with branded tissue and keepsake seal' },
  { title: 'The Eco-Mailer', subtitle: 'Thoughtful from the outside in.', icon: Recycle, alt: 'Kainchi Club natural and crimson eco-mailers tied with branded cord' },
  { title: 'Utility Sleeve Tube', subtitle: 'Keep the art safe on the way.', icon: ScrollText, alt: 'Kainchi Club chocolate and crimson utility tubes with protective end caps' },
  { title: 'Canvas Drawstring Utility Pouch', subtitle: 'The useful thing you keep.', icon: Package, alt: 'Kainchi Club natural canvas drawstring pouch with crimson pocket and cord' },
]

export function PackagingShowcase() {
  return (
    <section className="packaging-section" id="unboxing" aria-labelledby="packaging-title">
      <div className="packaging-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> The unboxing experience</p>
        <h2 id="packaging-title">Good things<br />come <em>wrapped.</em></h2>
        <p>From the first fold to the last thread, every detail is part of the piece.</p>
        <div className="packaging-list">{packaging.map(({ title, subtitle, icon: Icon }, index) => <div className="packaging-item" key={title}><span className="packaging-index">0{index + 1}</span><Icon aria-hidden="true" /><span><strong>{title}</strong><small>{subtitle}</small></span></div>)}</div>
        <a className="packaging-link" href="https://wa.me/91XXXXXXXXXX?text=Hi%20Kainchi%20Club%2C%20tell%20me%20about%20your%20gift%20packaging.">Add the little extra <ArrowUpRight aria-hidden="true" /></a>
      </div>
      <figure className="packaging-figure" aria-label="Four complete Kainchi Club packaging formats">{packaging.map(({ title, subtitle, alt }, index) => <div className="packaging-visual-item" key={title}><div className={`packaging-visual-photo packaging-visual-photo-${index + 1}`}><img src={packagingImage} alt={alt} loading="lazy" decoding="async" /></div><span className="packaging-visual-copy"><span className="packaging-visual-index">0{index + 1} / PACKAGING</span><strong>{title}</strong><small>{subtitle}</small></span></div>)}</figure>
    </section>
  )
}

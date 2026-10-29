import { ArrowUpRight, Box, Package, Recycle, ScrollText } from 'lucide-react'

const packaging = [
  { title: 'The Experience Box', subtitle: 'A little ceremony for the reveal.', icon: Box },
  { title: 'The Eco-Mailer', subtitle: 'Thoughtful from the outside in.', icon: Recycle },
  { title: 'Utility Sleeve Tube', subtitle: 'Keep the art safe on the way.', icon: ScrollText },
  { title: 'Canvas Drawstring Utility Pouch', subtitle: 'The useful thing you keep.', icon: Package },
]

const packagingImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793188970459.png-r3hev4JXltncyZxOQsRHrtjxwvsQ8s.jpeg'

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
      <figure className="packaging-figure"><img src={packagingImage} alt="Kainchi Club unboxing presentation with a crimson experience box, eco-mailers, branded utility tubes, and a canvas drawstring pouch" /><figcaption>Small details. A better first hello.</figcaption></figure>
    </section>
  )
}

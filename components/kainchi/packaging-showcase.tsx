import { ArrowUpRight, Box, Package, Recycle, ScrollText } from 'lucide-react'

const packaging = [
  { title: 'The Experience Box', subtitle: 'A little ceremony for the reveal.', icon: Box, image: '/packaging/experience-box.png', alt: 'Complete crimson and chocolate rigid gift boxes with folded natural tissue' },
  { title: 'The Eco-Mailer', subtitle: 'Thoughtful from the outside in.', icon: Recycle, image: '/packaging/eco-mailer.png', alt: 'Complete natural kraft and crimson eco mailers tied with cotton cord' },
  { title: 'Utility Sleeve Tube', subtitle: 'Keep the art safe on the way.', icon: ScrollText, image: '/packaging/utility-tube.png', alt: 'Two complete chocolate and crimson cylindrical utility tubes with caps' },
  { title: 'Canvas Drawstring Utility Pouch', subtitle: 'The useful thing you keep.', icon: Package, image: '/packaging/canvas-pouch.png', alt: 'Complete natural canvas drawstring pouch with crimson pocket and cord' },
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
      <figure className="packaging-figure" aria-label="Four complete Kainchi Club packaging formats">{packaging.map(({ title, subtitle, image, alt }, index) => <div className="packaging-visual-item" key={title}><img src={image} alt={alt} /><span className="packaging-visual-copy"><span className="packaging-visual-index">0{index + 1} / PACKAGING</span><strong>{title}</strong><small>{subtitle}</small></span></div>)}</figure>
    </section>
  )
}

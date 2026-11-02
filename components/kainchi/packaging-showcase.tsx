import Image from 'next/image'
import { ArrowUpRight, Box, Check, Crown, Package, Recycle, ScrollText } from 'lucide-react'
import { formatRupees } from './catalog'
import { GIFT_BOX_PRICE } from './order'

const packagingImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_5kl0775kl0775kl0.png-hPQJW5RzGUOvJenVxL6HVXJW8qYQar.jpeg'
const premiumPackagingImage = '/packaging/collector-vault-concept.png'

const packaging = [
  { title: 'The Experience Box', subtitle: 'A little ceremony for the reveal.', icon: Box },
  { title: 'The Eco-Mailer', subtitle: 'Thoughtful from the outside in.', icon: Recycle },
  { title: 'The Utility Tube', subtitle: 'Keep the art safe on the way.', icon: ScrollText },
  { title: 'Drawstring Pouch', subtitle: 'The useful thing you keep.', icon: Package },
]

type PackagingShowcaseProps = {
  premiumPackagingSelected: boolean
  onPremiumPackagingChange: (isSelected: boolean) => void
}

export function PackagingShowcase({ premiumPackagingSelected, onPremiumPackagingChange }: PackagingShowcaseProps) {
  return (
    <section className="packaging-section" id="unboxing" aria-labelledby="packaging-title">
      <div className="packaging-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> The unboxing experience</p>
        <div className="packaging-heading-row">
          <h2 id="packaging-title">Good things<br />come <em>wrapped.</em></h2>
          <span className="packaging-luxury-badge"><Box aria-hidden="true" /> Gift-ready boxes</span>
        </div>
        <p>From the first fold to the last thread, every detail is part of the piece.</p>
        <div className="packaging-standard">
          <p className="packaging-tier-label">Tier A · Standard Eco Packaging</p>
          <p className="packaging-tier-subtitle">Included with every regular order · Thoughtfully crafted</p>
          <div className="packaging-list">{packaging.map(({ title, subtitle, icon: Icon }, index) => <div className="packaging-item" key={title}><span className="packaging-index">0{index + 1}</span><Icon aria-hidden="true" /><span><strong>{title}</strong><small>{subtitle}</small></span></div>)}</div>
        </div>
        <a className="packaging-link" href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club%2C%20tell%20me%20about%20your%20gift%20packaging.">Add the little extra <ArrowUpRight aria-hidden="true" /></a>
      </div>
      <figure className="packaging-figure" aria-label="Four complete Kainchi Club standard packaging formats"><Image className="packaging-visual-banner" src={packagingImage} alt="Kainchi Club's standard packaging presentation: The Experience Box, The Eco-Mailer, The Utility Tube, and Drawstring Pouch." width={1200} height={900} sizes="(max-width: 700px) 94vw, 48vw" loading="lazy" decoding="async" /></figure>
      <section className="collector-vault" aria-labelledby="collector-vault-title">
        <div className="collector-vault-copy">
          <p className="collector-vault-badge"><Crown aria-hidden="true" /> Limited numbered edition <span>+{formatRupees(GIFT_BOX_PRICE)} / item</span></p>
          <h3 id="collector-vault-title"><span>The Collector&apos;s Vault</span> <span className="collector-vault-number" aria-label="Vault 99">99</span></h3>
          <p className="collector-vault-subtitle">Curated for gifting &amp; keepsakes</p>
          <p className="collector-vault-description">Upgrade any piece to our Signature Collector&apos;s Vault: an ultra-rigid wax-sealed collector box with custom artisan ribbons, scented tissue, and a handwritten personalized greeting note. Ready to gift straight out of the box.</p>
          <p className="collector-vault-standard-note">Standard eco-packaging (Boxes, Mailers, Tubes, and Pouches) continues to be included free with all regular orders.</p>
          <button className={`collector-vault-toggle${premiumPackagingSelected ? ' selected' : ''}`} type="button" aria-pressed={premiumPackagingSelected} onClick={() => onPremiumPackagingChange(!premiumPackagingSelected)}>
            {premiumPackagingSelected ? <><Check aria-hidden="true" /> Selected · Remove premium packaging</> : `Select +${formatRupees(GIFT_BOX_PRICE)} Premium Packaging`}
          </button>
          <p className="collector-vault-note">{formatRupees(GIFT_BOX_PRICE)} is added per item. With an empty cart, this upgrade will be preselected for your next piece.</p>
        </div>
        <figure className="collector-vault-visual">
          <Image src={premiumPackagingImage} alt="Deep burgundy rigid keepsake box wrapped in crimson tissue and sealed with antique gold wax beside an embossed certificate." width={900} height={900} sizes="(max-width: 700px) 90vw, 42vw" loading="lazy" decoding="async" />
          <figcaption>Visual concept · Collector&apos;s Vault</figcaption>
        </figure>
      </section>
    </section>
  )
}

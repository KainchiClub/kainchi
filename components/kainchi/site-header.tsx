import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

const navigation = [
  { label: 'Collection', href: '#collection' },
  { label: 'Artwork', href: '#artwork' },
  { label: 'Our story', href: '#story' },
  { label: 'Unboxing', href: '#unboxing' },
]

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Kainchi Club home">
        <Image className="wordmark-logo" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg" alt="" width={96} height={96} loading="lazy" decoding="async" />
        <span>KAINCHI <span className="wordmark-light">CLUB</span></span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        {navigation.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}
      </nav>
      <div className="header-actions">
        <a className="header-cta" href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club,%20I%20have%20an%20inquiry%20regarding%20your%20collection." target="_blank" rel="noopener noreferrer">
          <span>Talk to the studio</span>
          <span className="header-cta-status"><span className="header-cta-status-dot" aria-hidden="true" />Studio Active</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}

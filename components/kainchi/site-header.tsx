import { ArrowUpRight, Upload } from 'lucide-react'

const navigation = [
  { label: 'Collection', href: '#collection' },
  { label: 'Artwork', href: '#artwork' },
  { label: 'Our story', href: '#story' },
  { label: 'Unboxing', href: '#unboxing' },
]

export function SiteHeader({ onBulkUpload }: { onBulkUpload: () => void }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Kainchi Club home">
        <img className="wordmark-logo" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg" alt="" />
        <span>KAINCHI <span className="wordmark-light">CLUB</span></span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        {navigation.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}
      </nav>
      <div className="header-actions">
        <button className="header-upload" type="button" onClick={onBulkUpload} aria-label="Open bulk product uploader"><Upload aria-hidden="true" /><span>Bulk upload</span></button>
        <a className="header-cta" href="https://wa.me/91XXXXXXXXXX?text=Hi%20Kainchi%20Club%2C%20I%27d%20love%20to%20know%20more.">
          Talk to the studio <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}

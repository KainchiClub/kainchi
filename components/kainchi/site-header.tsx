'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'

const navigation = [
  { label: 'Collection', href: '#collection' },
  { label: 'Artwork', href: '#artwork' },
  { label: 'Our story', href: '#story' },
  { label: 'Unboxing', href: '#unboxing' },
]

type SocialNetwork = 'instagram' | 'facebook' | 'x'

export function SocialIcon({ network }: { network: SocialNetwork }) {
  if (network === 'x') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.7l4.1 5.6L17.5 4H19l-5.5 6.6L19.5 20h-3.7l-4.6-6.2L6.5 20H5l5.8-6.9L5 4Zm2.5 1.5 8.9 13h.9l-8.9-13h-.9Z" /></svg>
  if (network === 'facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4h1.5V4.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2h-2.5V13h2.5v7h3Z" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.3" cy="6.8" r="1" className="social-icon-fill" /></svg>
}

const socialLinks: { id: string; label: string; href: string; network: SocialNetwork }[] = [
  { id: 'social-instagram', label: 'Instagram', href: '#', network: 'instagram' },
  { id: 'social-facebook', label: 'Facebook', href: '#', network: 'facebook' },
  { id: 'social-x', label: 'X / Twitter', href: '#', network: 'x' },
]

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <button className="mobile-menu-toggle" type="button" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
        {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
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
      <nav className={`mobile-drawer${isMenuOpen ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!isMenuOpen}>
        {navigation.map((item) => <a href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)}>{item.label}</a>)}
        <div className="mobile-drawer-socials" aria-label="Social media">
          {socialLinks.map(({ id, label, href, network }) => <a className="mobile-social-link" href={href} aria-label={label} key={id}><SocialIcon network={network} /></a>)}
        </div>
      </nav>
    </header>
  )
}

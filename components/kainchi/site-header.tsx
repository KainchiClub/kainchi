'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, User, UserCheck, X } from 'lucide-react'
import { filterCatalog, openSizeGuide, type GarmentGroup } from './storefront-events'
import type { CustomerProfile } from '@/lib/kainchi-crm'

const navigation = [
  { label: 'Collection', href: '#collection' },
  { label: 'Artwork', href: '#artwork' },
  { label: 'Our story', href: '#story' },
  { label: 'Unboxing', href: '#unboxing' },
]

const STUDIO_WHATSAPP_URL = 'https://wa.me/918863075356?text=Hi%20Kainchi%20Club%2C%20I%20have%20an%20inquiry%20regarding%20your%20collection.'

type DrawerCategory =
  | { label: string; note: string; kind: 'scroll'; target: string }
  | { label: string; note: string; kind: 'filter'; group: GarmentGroup }
  | { label: string; note: string; kind: 'size-guide' }
  | { label: string; note: string; kind: 'whatsapp' }

const drawerCategories: DrawerCategory[] = [
  { label: 'New Arrivals', note: 'Drop 01 preview', kind: 'scroll', target: 'collection' },
  { label: 'Heavyweight Tees', note: '240 GSM drop-shoulder tees', kind: 'filter', group: 'tees' },
  { label: 'Hoodies & Sweatshirts', note: '400+ GSM structured fleece', kind: 'filter', group: 'fleece' },
  { label: 'Outerwear & Jackets', note: 'Bombers, leather & denim', kind: 'filter', group: 'outerwear' },
  { label: 'Archive / Lookbook', note: 'Every original print', kind: 'filter', group: 'all' },
  { label: 'Size Guide', note: 'Chest, length & shoulder', kind: 'size-guide' },
  { label: 'About the Studio', note: 'Philosophy, fabrics & wax-seal unboxing', kind: 'scroll', target: 'story' },
  { label: 'Talk to Studio', note: 'WhatsApp +91 88630 75356', kind: 'whatsapp' },
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

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function SiteHeader({
  member = null,
  onOpenMemberAuth,
}: {
  member?: CustomerProfile | null
  onOpenMemberAuth?: () => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  function closeMenu() {
    setIsMenuOpen(false)
    toggleRef.current?.focus({ preventScroll: true })
  }

  function handleCategory(category: DrawerCategory) {
    closeMenu()
    if (category.kind === 'scroll') {
      requestAnimationFrame(() => scrollToSection(category.target))
    } else if (category.kind === 'filter') {
      filterCatalog(category.group)
      requestAnimationFrame(() => scrollToSection('artwork'))
    } else if (category.kind === 'size-guide') {
      openSizeGuide()
    }
  }

  const memberFirstName = member?.full_name?.trim().split(/\s+/)[0]

  return (
    <header className="site-header" style={{ maxWidth: '100vw' }}>
      <button ref={toggleRef} className="mobile-menu-toggle category-menu-toggle" type="button" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={isMenuOpen} aria-controls="category-drawer" onClick={() => setIsMenuOpen((open) => !open)}>
        {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <a className="wordmark" href="#top" aria-label="Kainchi Club home" style={{ flexShrink: 0 }}>
        <Image className="wordmark-logo shrink-0" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg" alt="" width={96} height={96} loading="eager" decoding="async" />
        <span>KAINCHI <span className="wordmark-light">CLUB</span></span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        {navigation.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}
      </nav>
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {onOpenMemberAuth && (
          <button
            type="button"
            onClick={onOpenMemberAuth}
            aria-label={member ? `Atelier Pass: ${member.full_name}` : 'Member Sign In or Join Club'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minWidth: '38px',
              height: '38px',
              padding: '0 12px',
              borderRadius: '999px',
              border: '1.5px solid #8b1e24',
              background: member ? '#f5e6c8' : '#faf4e8',
              color: '#181210',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(24, 18, 16, 0.08)',
            }}
          >
            {member ? <UserCheck size={15} color="#8b1e24" aria-hidden="true" /> : <User size={15} color="#8b1e24" aria-hidden="true" />}
            <span className="hidden sm:inline" style={{ color: '#181210' }}>
              {member ? memberFirstName : 'Atelier Pass'}
            </span>
          </button>
        )}
        <a className="header-cta hidden md:inline-flex" href={STUDIO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          <span>Talk to the studio</span>
          <span className="header-cta-status"><span className="header-cta-status-dot" aria-hidden="true" />Studio Active</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>

      <div className={`category-drawer-backdrop${isMenuOpen ? ' is-open' : ''}`} aria-hidden="true" onClick={closeMenu} />
      <nav id="category-drawer" className={`category-drawer${isMenuOpen ? ' is-open' : ''}`} aria-label="Shop by category" aria-hidden={!isMenuOpen} inert={!isMenuOpen}>
        <div className="category-drawer-top">
          <p className="size-guide-kicker">KAINCHI CLUB · THE STUDIO</p>
          <button ref={closeRef} type="button" className="size-guide-close" aria-label="Close menu" onClick={closeMenu}><X aria-hidden="true" /></button>
        </div>
        <ul className="category-drawer-list">
          {onOpenMemberAuth && (
            <li>
              <button
                className="category-drawer-item"
                type="button"
                onClick={() => {
                  closeMenu()
                  onOpenMemberAuth()
                }}
              >
                <span className="category-drawer-index" aria-hidden="true">00</span>
                <span className="category-drawer-text">
                  <strong>{member ? `${member.full_name} · Atelier Pass` : 'Member Sign In / Join Club'}</strong>
                  <small>{member ? `Orders: #${String(member.total_orders).padStart(2, '0')} · View unlocked gift` : 'Track orders & unlock collector gifts'}</small>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </button>
            </li>
          )}
          {drawerCategories.map((category, index) => (
            <li key={category.label}>
              {category.kind === 'whatsapp' ? (
                <a className="category-drawer-item" href={STUDIO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                  <span className="category-drawer-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="category-drawer-text"><strong>{category.label}</strong><small>{category.note}</small></span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ) : (
                <button className="category-drawer-item" type="button" onClick={() => handleCategory(category)}>
                  <span className="category-drawer-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="category-drawer-text"><strong>{category.label}</strong><small>{category.note}</small></span>
                  <ArrowUpRight aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mobile-drawer-socials category-drawer-socials" aria-label="Social media">
          {socialLinks.map(({ id, label, href, network }) => <a className="mobile-social-link" href={href} aria-label={label} key={id}><SocialIcon network={network} /></a>)}
        </div>
      </nav>
    </header>
  )
}

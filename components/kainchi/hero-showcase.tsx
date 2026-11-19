'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Ruler, Scissors, Sparkles } from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { type CatalogProduct } from './catalog'
import { CATALOG_FILTER_EVENT, type GarmentGroup } from './storefront-events'

const QUICK_CATEGORIES: Array<{ label: string; group: GarmentGroup; fallbackImg: string }> = [
  { label: 'ALL PIECES', group: 'all', fallbackImg: '' },
  { label: 'HOODIES', group: 'hoodies', fallbackImg: '' },
  { label: 'OVERSIZED TEES', group: 'tees', fallbackImg: '' },
  { label: 'SHIRTS', group: 'shirts', fallbackImg: '' },
  { label: 'JEANS', group: 'bottoms', fallbackImg: '' },
]

export function HeroShowcase({ products }: { products: CatalogProduct[] }) {
  const heroPool = useMemo(() => {
    const valid = products.filter((p) => p.stockStatus !== 'sold-out' && p.stockStatus !== 'retired' && Boolean(p.image))
    return valid.length > 0 ? valid.slice(0, 6) : products.slice(0, 6)
  }, [products])

  const [activeIndex, setActiveIndex] = useState(0)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  useEffect(() => {
    if (heroPool.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroPool.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [heroPool.length])

  const activeHero = heroPool[activeIndex] ?? heroPool[0]

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: Number((-y * 10).toFixed(2)), ry: Number((x * 10).toFixed(2)) })
  }

  function handleMouseLeave() {
    setTilt({ rx: 0, ry: 0 })
  }

  function triggerCategory(group: GarmentGroup) {
    window.dispatchEvent(new CustomEvent<GarmentGroup>(CATALOG_FILTER_EVENT, { detail: group }))
    document.getElementById('artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title" style={{ paddingBottom: '0' }}>
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '28px 20px 34px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          alignItems: 'center',
          gap: '28px',
        }}
      >
        {/* LEFT COLUMN: HERO COPY */}
        <div className="hero-copy" style={{ maxWidth: '540px' }}>
          <p className="eyebrow">
            <span className="eyebrow-dot" /> KAINCHI CLUB · ATELIER DROP 2026
          </p>
          <h1 id="hero-title" style={{ marginBottom: '12px' }}>
            Wear your<br />
            own <em>art.</em>
          </h1>
          <p className="hero-lead" style={{ marginBottom: '18px' }}>
            Small-batch, made-to-order streetwear crafted individually when you order. Zero deadstock, heavyweight fabrics, and collector-grade embroidery.
          </p>
          <div className="hero-actions" style={{ marginBottom: '14px' }}>
            <a className="button button-crimson" href="#artwork" data-open-archive="true">
              Explore Collection <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="button button-outline" href="#story">
              The Atelier Story
            </a>
          </div>
          <div className="hero-meta" aria-label="Studio highlights">
            <span>
              <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Crafted to Order · 5–7 Days
            </span>
            <span>•</span>
            <span>Men &amp; Women Originals</span>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPACT 3D FLOATING SHOWCASE */}
        {activeHero && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: '1100px' }}>
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                width: '100%',
                maxWidth: '410px',
                position: 'relative',
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: 'transform 0.25s ease-out',
                transformStyle: 'preserve-3d',
                borderRadius: '22px',
                padding: '10px',
                background: 'linear-gradient(145deg, rgba(212,175,55,0.28), rgba(24,18,16,0.94))',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 26px 56px rgba(0, 0, 0, 0.52), 0 0 32px rgba(212, 175, 55, 0.14)',
              }}
            >
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '4 / 4.2', background: '#141110' }}>
                <Image
                  src={resolveDriveImageUrl(activeHero.image, 800)}
                  alt={`${activeHero.title} — ${activeHero.garment}`}
                  width={800}
                  height={840}
                  priority
                  fetchPriority="high"
                  unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(activeHero.image, 800))}
                  draggable={false}
                  onError={fallbackImageOnError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(18, 14, 12, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    color: '#f5efe6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    transform: 'translateZ(20px)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#d4af37', display: 'block', fontWeight: 700 }}>
                      MADE TO ORDER · {activeHero.garment}
                    </span>
                    <strong style={{ fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeHero.title}</strong>
                  </div>
                  <a
                    href="#artwork"
                    data-open-archive="true"
                    style={{
                      padding: '6px 11px',
                      borderRadius: '999px',
                      background: '#d4af37',
                      color: '#181210',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    ₹{new Intl.NumberFormat('en-IN').format(activeHero.price)} ↗
                  </a>
                </div>
              </div>

              {heroPool.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                  {heroPool.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Showcase ${item.title}`}
                      onClick={() => setActiveIndex(idx)}
                      style={{
                        width: idx === activeIndex ? '20px' : '7px',
                        height: '7px',
                        borderRadius: '999px',
                        border: 'none',
                        background: idx === activeIndex ? '#f5e29f' : 'rgba(255,255,255,0.35)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM ROUND CIRCLES BAR + RESTORED "FIND YOUR FIT" CIRCLE */}
      <div
        style={{
          background: '#110d0c',
          borderTop: '1px solid rgba(212, 175, 55, 0.22)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.22)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {QUICK_CATEGORIES.map((cat, index) => {
            const thumb = heroPool[index % Math.max(1, heroPool.length)]?.image
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => triggerCategory(cat.group)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#f5efe6',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '999px',
                    border: '1.5px solid rgba(212, 175, 55, 0.65)',
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#1f1815',
                  }}
                >
                  {thumb ? (
                    <img
                      src={resolveDriveImageUrl(thumb, 140)}
                      alt={cat.label}
                      width={50}
                      height={50}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Scissors size={18} color="#d4af37" />
                  )}
                </span>
                <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.1em' }}>{cat.label}</span>
              </button>
            )
          })}

          {/* RESTORED FIND YOUR FIT (HEIGHT & WEIGHT CALCULATOR) CIRCLE */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('kainchi:open-fit-concierge'))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#f5e29f',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '999px',
                border: '1.5px solid #d4af37',
                background: 'linear-gradient(135deg, #8b1e24, #2a0d10)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
              }}
            >
              <Ruler size={19} color="#f5e29f" />
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.1em', color: '#f5e29f' }}>FIND YOUR FIT</span>
          </button>

          {/* CUSTOM STUDIO CIRCLE */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('kainchi:open-studio-intake'))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#f5efe6',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '999px',
                border: '1.5px solid rgba(212, 175, 55, 0.65)',
                background: '#1f1815',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Scissors size={18} color="#d4af37" />
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.1em' }}>CUSTOM STUDIO</span>
          </button>
        </div>
      </div>
    </section>
  )
}

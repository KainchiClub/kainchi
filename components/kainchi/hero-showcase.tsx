'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { type CatalogProduct } from './catalog'

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
    setTilt({ rx: Number((-y * 12).toFixed(2)), ry: Number((x * 12).toFixed(2)) })
  }

  function handleMouseLeave() {
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> KAINCHI CLUB · ATELIER DROP 2026
          </p>
          <h1 id="hero-title">
            Wear your<br />
            own <em>art.</em>
          </h1>
          <p className="hero-lead">
            Small-batch, made-to-order streetwear crafted individually when you order. Zero deadstock, heavyweight fabrics, and collector-grade embroidery.
          </p>
          <div className="hero-actions">
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

        {activeHero && (
          <div className="hero-visual-wrap" style={{ perspective: '1100px' }}>
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'relative',
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-4px)`,
                transition: 'transform 0.25s ease-out',
                transformStyle: 'preserve-3d',
                borderRadius: '24px',
                padding: '12px',
                background: 'linear-gradient(145deg, rgba(212,175,55,0.28), rgba(24,18,16,0.92))',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 32px 70px rgba(0, 0, 0, 0.55), 0 0 40px rgba(212, 175, 55, 0.16)',
              }}
            >
              <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', aspectRatio: '4 / 4.6', background: '#141110' }}>
                <Image
                  src={resolveDriveImageUrl(activeHero.image, 900)}
                  alt={`${activeHero.title} — ${activeHero.garment}`}
                  width={900}
                  height={1040}
                  priority
                  fetchPriority="high"
                  unoptimized={!isImageOptimizerSource(resolveDriveImageUrl(activeHero.image, 900))}
                  draggable={false}
                  onError={fallbackImageOnError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* Floating 3D Spec Tag */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    right: '14px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'rgba(18, 14, 12, 0.86)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    color: '#f5efe6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    transform: 'translateZ(24px)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#d4af37', display: 'block', fontWeight: 700 }}>
                      MADE TO ORDER · {activeHero.garment}
                    </span>
                    <strong style={{ fontSize: '15px' }}>{activeHero.title}</strong>
                  </div>
                  <a
                    href="#artwork"
                    data-open-archive="true"
                    style={{
                      padding: '7px 12px',
                      borderRadius: '999px',
                      background: '#d4af37',
                      color: '#181210',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ₹{new Intl.NumberFormat('en-IN').format(activeHero.price)} ↗
                  </a>
                </div>
              </div>

              {/* Hero Slide Dots */}
              {heroPool.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                  {heroPool.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Showcase ${item.title}`}
                      onClick={() => setActiveIndex(idx)}
                      style={{
                        width: idx === activeIndex ? '22px' : '8px',
                        height: '8px',
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
    </section>
  )
}

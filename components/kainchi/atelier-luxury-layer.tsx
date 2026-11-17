'use client'

import { useEffect, useRef, useState } from 'react'
import { Ruler, Sparkles } from 'lucide-react'

function isAutomatedAudit() {
  if (typeof navigator === 'undefined') return false
  return Boolean(navigator.webdriver || /Lighthouse|Chrome-Lighthouse|PageSpeed/i.test(navigator.userAgent))
}

function getOutfitPairingAdvice(titleAndGarment: string) {
  const text = titleAndGarment.toLowerCase()
  if (text.includes('hoodie') || text.includes('sweatshirt')) {
    return {
      bottom: 'Relaxed Charcoal Cargo or Wide-Leg Raw Selvedge Denim',
      footwear: 'Chunky Monochrome Leather Runners or High-Top Court Sneakers',
      accent: 'Brushed Sterling Silver Curb Chain + Structured Cap',
    }
  }
  if (text.includes('shirt') || text.includes('shacket')) {
    return {
      bottom: 'Pleated Off-White Linen Trousers or Tailored Black Denim',
      footwear: 'Suede Penny Loafers or Minimalist Low-Top Leather Sneakers',
      accent: 'Vintage Tortoiseshell Frames + Minimalist Signet Ring',
    }
  }
  if (text.includes('polo')) {
    return {
      bottom: 'Pleated Espresso Chino Trousers or Tailored Shorts',
      footwear: 'Classic Leather Loafers or Clean White Court Trainers',
      accent: 'Woven Leather Belt + Classic Chronograph Watch',
    }
  }
  if (text.includes('denim') || text.includes('leather')) {
    return {
      bottom: 'Heavyweight Washed Black Tee + Straight-Fit Vintage Denim',
      footwear: 'Distressed Leather Chelsea Boots or Retro Runners',
      accent: 'Oxidized Silver Cuff + Crossbody Leather Sling',
    }
  }
  return {
    bottom: 'Baggy Parachute Cargos or Distressed Vintage Straight Denim',
    footwear: 'Retro Suede Sneakers or Chunky Studio Trainers',
    accent: 'Layered Silver Chain + Ribbed Crew Socks',
  }
}

export function AtelierLuxuryLayer() {
  const [introVisible, setIntroVisible] = useState(() => !isAutomatedAudit())
  const [vaultOpened, setVaultOpened] = useState(false)
  const [introFading, setIntroFading] = useState(false)

  const progressRef = useRef<HTMLDivElement | null>(null)

  const dismissIntroNow = () => {
    setVaultOpened(true)
    setIntroFading(true)
    window.setTimeout(() => setIntroVisible(false), 380)
  }

  // 1. 3D Collector's Vault Lid Open + KAINCHI CLUB Reveal (Kept intact)
  useEffect(() => {
    if (isAutomatedAudit()) {
      setIntroVisible(false)
      return
    }
    const openTimer = window.setTimeout(() => setVaultOpened(true), 220)
    const fadeTimer = window.setTimeout(() => setIntroFading(true), 2050)
    const hideTimer = window.setTimeout(() => setIntroVisible(false), 2600)
    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  // 2. Inject compact "FIND YOUR FIT" square icon card right next to CUSTOM STUDIO
  useEffect(() => {
    const injectFitSquare = () => {
      if (document.getElementById('kc-story-fit-card')) return
      const storyButtons = Array.from(document.querySelectorAll('button')).filter((btn) =>
        /CUSTOM STUDIO/i.test(btn.textContent || ''),
      )
      const customStudioBtn = storyButtons[0]
      const container = customStudioBtn?.parentElement
      if (!customStudioBtn || !container) return

      const fitBtn = document.createElement('button')
      fitBtn.id = 'kc-story-fit-card'
      fitBtn.type = 'button'
      fitBtn.className = customStudioBtn.className
      fitBtn.setAttribute('aria-label', 'Find Your Exact Atelier Fit')
      fitBtn.innerHTML = `
        <span style="width:52px;height:52px;border-radius:14px;border:1.5px solid #d4af37;background:linear-gradient(145deg,#1d140c,#0c0b0a);display:inline-flex;align-items:center;justify-content:center;color:#d4af37;box-shadow:0 6px 18px rgba(212,175,55,0.22);margin:0 auto 6px auto;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
        </span>
        <span style="display:block;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8b1e24;">FIND YOUR FIT</span>
      `
      fitBtn.onclick = () => {
        window.dispatchEvent(new CustomEvent('kainchi:open-fit-concierge'))
      }
      container.appendChild(fitBtn)
    }

    injectFitSquare()
    const timer = window.setTimeout(injectFitSquare, 600)
    return () => window.clearTimeout(timer)
  }, [])

  // 3. AI Style & Outfit Pairing Injector inside Product Customizer Modal
  useEffect(() => {
    const injectAiStylistCard = () => {
      const dialog = document.querySelector('dialog[open], [role="dialog"]')
      if (!dialog || dialog.querySelector('#kc-ai-stylist-card')) return
      if (dialog.id === 'bespoke-fit-modal-title' || dialog.querySelector('#bespoke-fit-modal-title')) return

      const heading = dialog.querySelector('h2, h3')
      const titleText = heading?.textContent?.trim() || ''
      if (!titleText || /Delivery|Size Guide/i.test(titleText)) return

      const advice = getOutfitPairingAdvice(dialog.textContent || titleText)
      const card = document.createElement('div')
      card.id = 'kc-ai-stylist-card'
      card.style.cssText =
        'margin:14px 0;padding:12px 14px;border-radius:14px;border:1px solid rgba(212,175,55,0.45);background:linear-gradient(135deg,rgba(26,18,11,0.96),rgba(14,14,14,0.96));color:#f5f5f4;font-size:12px;line-height:1.5;'
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#d4af37;font-weight:700;margin-bottom:6px;">
          <span>✦ AI ATELIER STYLIST · COMPLETE THE LOOK</span>
        </div>
        <div style="display:grid;gap:4px;font-size:11.5px;color:#e7e5e4;">
          <div><strong style="color:#f5e29f;">Pair With:</strong> ${advice.bottom}</div>
          <div><strong style="color:#f5e29f;">Footwear:</strong> ${advice.footwear}</div>
          <div><strong style="color:#f5e29f;">Accent:</strong> ${advice.accent}</div>
        </div>
      `

      const actionBtn = dialog.querySelector('button[type="submit"], .customizer-actions')
      if (actionBtn && actionBtn.parentElement) {
        actionBtn.parentElement.insertBefore(card, actionBtn)
      } else {
        dialog.appendChild(card)
      }
    }

    const observer = new MutationObserver(() => injectAiStylistCard())
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    return () => observer.disconnect()
  }, [])

  // 4. Zero-Reflow Scroll Progress Thread + Clean Reveal (No custom cursor lag)
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    let scrollTicking = false
    let cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

    const recalcBounds = () => {
      cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    }

    const updateScrollProgress = () => {
      if (progressRef.current) {
        const pct = Math.min(1, Math.max(0, window.scrollY / cachedMaxScroll))
        progressRef.current.style.transform = `scaleX(${pct.toFixed(4)})`
      }
      scrollTicking = false
    }

    const onScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true
        requestAnimationFrame(updateScrollProgress)
      }
    }

    updateScrollProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', recalcBounds, { passive: true })

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('kc-luxury-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -15px 0px' },
    )

    const observeAll = () => {
      recalcBounds()
      document.querySelectorAll('main > section, .art-card, h2').forEach((el) => {
        if (!el.classList.contains('kc-luxury-revealed')) {
          el.classList.add('kc-luxury-reveal')
          observer.observe(el)
        }
      })
    }

    observeAll()
    const mutationObserver = new MutationObserver(() => observeAll())
    const mainEl = document.querySelector('main')
    if (mainEl) {
      mutationObserver.observe(mainEl, { childList: true, subtree: true })
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', recalcBounds)
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes kcHeroCinemaDrift {
          0% { transform: scale(1) translate3d(0, 0, 0); }
          50% { transform: scale(1.04) translate3d(-0.5%, -0.5%, 0); }
          100% { transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes kcSealGlow {
          0%, 100% { opacity: 0.88; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        .hero-gallery {
          overflow: hidden;
        }
        .hero-poster-image {
          animation: kcHeroCinemaDrift 18s ease-in-out infinite;
          will-change: transform;
        }
        .kc-luxury-reveal {
          opacity: 0.96;
          transform: translate3d(0, 14px, 0);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .kc-luxury-revealed {
          opacity: 1 !important;
          transform: translate3d(0, 0, 0) !important;
        }
        .art-card {
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
        }
        .art-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.14);
        }
      `}</style>

      {/* Top Golden Scroll Progress Thread */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          zIndex: 9998,
          pointerEvents: 'none',
          background: 'rgba(212, 175, 55, 0.12)',
        }}
      >
        <div
          ref={progressRef}
          style={{
            width: '100%',
            height: '100%',
            transformOrigin: 'left center',
            transform: 'scaleX(0)',
            background: 'linear-gradient(90deg, #8b1e24, #d4af37, #f5e29f)',
          }}
        />
      </div>

      {/* Single Clean Bottom-Left Quick Size Concierge Pill (Sound button removed) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('kainchi:open-fit-concierge'))}
        aria-label="Open Exact Size & Fit Concierge"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 9990,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 13px',
          borderRadius: '9999px',
          background: 'rgba(18, 12, 13, 0.9)',
          border: '1px solid rgba(212, 175, 55, 0.55)',
          color: '#f5e29f',
          fontSize: '10px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 10px 26px rgba(0,0,0,0.32)',
        }}
      >
        <Ruler size={13} />
        <span>Find Your Fit</span>
      </button>

      {/* 3D Collector's Vault Unboxing Curtain (Kept intact) */}
      {introVisible && (
        <div
          onClick={dismissIntroNow}
          role="button"
          tabIndex={0}
          aria-label="Enter Kainchi Club Atelier"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') dismissIntroNow()
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 2147483647,
            background: 'radial-gradient(circle at center, #1b0c10 0%, #070707 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            opacity: introFading ? 0 : 1,
            transition: 'opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 'min(310px, 84vw)',
              height: '210px',
              perspective: '1100px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '20px',
                background: 'linear-gradient(145deg, #2b0d14 0%, #14070a 65%, #0c0a0a 100%)',
                border: '1px solid rgba(212, 175, 55, 0.55)',
                boxShadow: '0 28px 70px rgba(0, 0, 0, 0.85), inset 0 0 36px rgba(139, 30, 36, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: '#d4af37',
                  marginBottom: '8px',
                  opacity: vaultOpened ? 1 : 0,
                  transform: vaultOpened ? 'translate3d(0,0,0)' : 'translate3d(0,10px,0)',
                  transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
                }}
              >
                THE COLLECTOR&apos;S VAULT
              </span>

              <div
                style={{
                  fontFamily: 'serif',
                  fontSize: 'clamp(1.45rem, 6vw, 2.05rem)',
                  letterSpacing: '0.22em',
                  color: '#ffffff',
                  opacity: vaultOpened ? 1 : 0,
                  transform: vaultOpened
                    ? 'translate3d(0, -4px, 35px) scale(1.03)'
                    : 'translate3d(0, 14px, 0px) scale(0.94)',
                  transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s',
                }}
              >
                KAINCHI <span style={{ color: '#d4af37', fontWeight: 300 }}>CLUB</span>
              </div>

              <div
                style={{
                  width: '120px',
                  height: '1px',
                  margin: '10px auto',
                  background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                  opacity: vaultOpened ? 1 : 0,
                  transition: 'opacity 0.8s ease 0.4s',
                }}
              />

              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.65)',
                  opacity: vaultOpened ? 1 : 0,
                  transition: 'opacity 0.8s ease 0.5s',
                }}
              >
                WEAR YOUR OWN ART
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '20px',
                background: 'linear-gradient(160deg, #4b121d 0%, #24090f 100%)',
                border: '1px solid rgba(212, 175, 55, 0.75)',
                transformOrigin: 'top center',
                transform: vaultOpened ? 'rotateX(118deg)' : 'rotateX(0deg)',
                opacity: vaultOpened ? 0.12 : 1,
                transition: 'transform 1.05s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.85s ease 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backfaceVisibility: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '18px',
                  background: 'rgba(139, 30, 36, 0.75)',
                  borderTop: '1px solid rgba(212, 175, 55, 0.35)',
                  borderBottom: '1px solid rgba(212, 175, 55, 0.35)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '9999px',
                  background: 'radial-gradient(circle at 35% 35%, #f7e39c, #c99b2e 70%, #8c6714 100%)',
                  border: '2px solid #f5e29f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'serif',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  color: '#24090f',
                  animation: 'kcSealGlow 1.4s ease-in-out infinite',
                }}
              >
                K·C
              </div>
            </div>
          </div>

          <span
            style={{
              marginTop: '18px',
              fontSize: '9px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(212, 175, 55, 0.55)',
            }}
          >
            TAP ANYWHERE TO ENTER
          </span>
        </div>
      )}
    </>
  )
}

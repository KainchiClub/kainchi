'use client'

import { useEffect, useRef, useState } from 'react'

export function AtelierLuxuryLayer() {
  const [introVisible, setIntroVisible] = useState(true)
  const [introFading, setIntroFading] = useState(false)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const cursorRingRef = useRef<HTMLDivElement | null>(null)

  // 1. Signature Golden Atelier Curtain Reveal (~2.5 seconds hold + smooth fade)
  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIntroFading(true), 2300)
    const hideTimer = window.setTimeout(() => setIntroVisible(false), 3050)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  // 2. Scroll Progress Golden Thread + Smooth Reveal Observer
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'

    const updateScrollProgress = () => {
      if (!progressRef.current) return
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0
      progressRef.current.style.transform = `scaleX(${pct.toFixed(4)})`
    }

    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })

    const revealTargets = Array.from(document.querySelectorAll('main > section, .art-card'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('kc-luxury-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )

    revealTargets.forEach((el) => {
      el.classList.add('kc-luxury-reveal')
      observer.observe(el)
    })

    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      observer.disconnect()
    }
  }, [])

  // 3. Subtle Magnetic Luxury Ring Cursor (without magnifying loupe)
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    let rafId: number | null = null
    let targetX = -200
    let targetY = -200
    let ringX = -200
    let ringY = -200

    const animateRing = () => {
      ringX += (targetX - ringX) * 0.22
      ringY += (targetY - ringY) * 0.22
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`
      }
      rafId = requestAnimationFrame(animateRing)
    }
    rafId = requestAnimationFrame(animateRing)

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY

      const el = document.elementFromPoint(e.clientX, e.clientY)
      const interactive = el?.closest('a, button, [role="button"]')
      if (cursorRingRef.current) {
        cursorRingRef.current.style.opacity = '1'
        cursorRingRef.current.style.width = interactive ? '42px' : '22px'
        cursorRingRef.current.style.height = interactive ? '42px' : '22px'
        cursorRingRef.current.style.marginLeft = interactive ? '-21px' : '-11px'
        cursorRingRef.current.style.marginTop = interactive ? '-21px' : '-11px'
      }
    }

    const onPointerLeave = () => {
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0'
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes kcThreadDraw {
          0% { transform: scaleX(0); opacity: 0.3; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes kcTitleRise {
          0% { opacity: 0; transform: translateY(14px); letter-spacing: 0.16em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 0.26em; }
        }
        .kc-luxury-reveal {
          opacity: 0.96;
          transform: translateY(14px);
          transition: opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .kc-luxury-revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .art-card {
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
        }
        .art-card:hover {
          transform: translateY(-4px);
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

      {/* Subtle Golden Ring Cursor */}
      <div
        ref={cursorRingRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '22px',
          height: '22px',
          marginLeft: '-11px',
          marginTop: '-11px',
          borderRadius: '9999px',
          border: '1px solid rgba(212, 175, 55, 0.7)',
          pointerEvents: 'none',
          zIndex: 9996,
          opacity: 0,
          transition: 'width 0.2s ease, height 0.2s ease, margin 0.2s ease, opacity 0.2s ease',
        }}
      />

      {/* Signature Atelier Curtain Intro (2.5s readable hold) */}
      {introVisible && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'radial-gradient(circle at center, #14110b 0%, #070707 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            opacity: introFading ? 0 : 1,
            transition: 'opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: '#d4af37',
              animation: 'kcTitleRise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          >
            WEARABLE ART ATELIER
          </span>
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              letterSpacing: '0.26em',
              color: '#ffffff',
              animation: 'kcTitleRise 1s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          >
            KAINCHI <span style={{ color: '#d4af37', fontWeight: 300 }}>CLUB</span>
          </div>
          <div
            style={{
              width: '160px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
              animation: 'kcThreadDraw 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.55)',
              marginTop: '4px',
            }}
          >
            SMALL-BATCH · HAND-CRAFTED
          </span>
        </div>
      )}
    </>
  )
}

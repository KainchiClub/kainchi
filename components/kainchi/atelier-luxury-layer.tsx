'use client'

import { useEffect, useRef, useState } from 'react'

export function AtelierLuxuryLayer() {
  const [introVisible, setIntroVisible] = useState(true)
  const [introFading, setIntroFading] = useState(false)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const cursorRingRef = useRef<HTMLDivElement | null>(null)
  const loupeRef = useRef<HTMLDivElement | null>(null)

  // 1. Signature Golden Atelier Curtain Reveal (first visit feel)
  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIntroFading(true), 650)
    const hideTimer = window.setTimeout(() => setIntroVisible(false), 1200)
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

  // 3. Magnetic Luxury Cursor + 2.8x Fabric & Embroidery Magnifying Loupe
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
        cursorRingRef.current.style.width = interactive ? '44px' : '24px'
        cursorRingRef.current.style.height = interactive ? '44px' : '24px'
        cursorRingRef.current.style.marginLeft = interactive ? '-22px' : '-12px'
        cursorRingRef.current.style.marginTop = interactive ? '-22px' : '-12px'
      }

      // Check if hovering over a product/artwork image for the 2.8x Fabric Loupe
      const imgWrap = el?.closest('.art-image-wrap, .hero-gallery')
      const img = imgWrap?.querySelector('img') as HTMLImageElement | null
      const loupe = loupeRef.current
      if (loupe && img && img.complete && img.naturalWidth > 0) {
        const rect = img.getBoundingClientRect()
        const relX = (e.clientX - rect.left) / rect.width
        const relY = (e.clientY - rect.top) / rect.height
        if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
          const src = img.currentSrc || img.src
          loupe.style.opacity = '1'
          loupe.style.transform = `translate3d(${e.clientX - 72}px, ${e.clientY - 72}px, 0)`
          loupe.style.backgroundImage = `url("${src}")`
          loupe.style.backgroundSize = `${rect.width * 2.6}px ${rect.height * 2.6}px`
          loupe.style.backgroundPosition = `${-(relX * rect.width * 2.6 - 72)}px ${-(relY * rect.height * 2.6 - 72)}px`
          return
        }
      }

      if (loupe) loupe.style.opacity = '0'
    }

    const onPointerLeave = () => {
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0'
      if (loupeRef.current) loupeRef.current.style.opacity = '0'
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

      {/* 2.8x Magnifying Fabric & Embroidery Loupe */}
      <div
        ref={loupeRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '144px',
          height: '144px',
          borderRadius: '9999px',
          border: '1.5px solid rgba(212, 175, 55, 0.85)',
          boxShadow: '0 18px 45px rgba(0,0,0,0.45), inset 0 0 18px rgba(212,175,55,0.2)',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 9997,
          opacity: 0,
          transition: 'opacity 0.18s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '8px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#f5e29f',
            background: 'rgba(10,10,10,0.78)',
            padding: '2px 7px',
            borderRadius: '999px',
            whiteSpace: 'nowrap',
          }}
        >
          ATELIER LOUPE
        </span>
      </div>

      {/* Smooth Golden Ring Cursor */}
      <div
        ref={cursorRingRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '24px',
          height: '24px',
          marginLeft: '-12px',
          marginTop: '-12px',
          borderRadius: '9999px',
          border: '1px solid rgba(212, 175, 55, 0.75)',
          pointerEvents: 'none',
          zIndex: 9996,
          opacity: 0,
          transition: 'width 0.2s ease, height 0.2s ease, margin 0.2s ease, opacity 0.2s ease',
        }}
      />

      {/* Signature Atelier Curtain Intro */}
      {introVisible && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#090909',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: introFading ? 0 : 1,
            transition: 'opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#d4af37',
            }}
          >
            WEARABLE ART ATELIER
          </span>
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
              letterSpacing: '0.24em',
              color: '#ffffff',
            }}
          >
            KAINCHI <span style={{ color: '#d4af37', fontWeight: 300 }}>CLUB</span>
          </div>
          <div
            style={{
              width: '120px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            }}
          />
        </div>
      )}
    </>
  )
}

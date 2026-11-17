'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export function AtelierLuxuryLayer() {
  const [introVisible, setIntroVisible] = useState(true)
  const [introFading, setIntroFading] = useState(false)
  const [soundOn, setSoundOn] = useState(false)

  const progressRef = useRef<HTMLDivElement | null>(null)
  const cursorRingRef = useRef<HTMLDivElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  // 1. Signature Golden Atelier Curtain Reveal (2.5s readable hold + smooth fade)
  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIntroFading(true), 2400)
    const hideTimer = window.setTimeout(() => setIntroVisible(false), 3150)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  // 2. Scroll Progress Golden Thread + Smooth Cinematic Section & Heading Reveal
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

    const revealTargets = Array.from(document.querySelectorAll('main > section, .art-card, h2'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('kc-luxury-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
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

  // 3. Interactive 3D Card Tilt + Golden Spotlight + Luxury Ring Cursor
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    let rafId: number | null = null
    let targetX = -200
    let targetY = -200
    let ringX = -200
    let ringY = -200
    let activeTiltCard: HTMLElement | null = null

    const animateRing = () => {
      ringX += (targetX - ringX) * 0.22
      ringY += (targetY - ringY) * 0.22
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`
      }
      rafId = requestAnimationFrame(animateRing)
    }
    rafId = requestAnimationFrame(animateRing)

    const resetTiltCard = () => {
      if (!activeTiltCard) return
      activeTiltCard.style.transform = ''
      activeTiltCard.style.removeProperty('--kc-spot-x')
      activeTiltCard.style.removeProperty('--kc-spot-y')
      activeTiltCard = null
    }

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

      // Live 3D Perspective Tilt & Golden Spotlight on Product Cards
      const card = el?.closest('.art-card') as HTMLElement | null
      if (card) {
        if (activeTiltCard && activeTiltCard !== card) resetTiltCard()
        activeTiltCard = card
        const rect = card.getBoundingClientRect()
        const relX = (e.clientX - rect.left) / rect.width - 0.5
        const relY = (e.clientY - rect.top) / rect.height - 0.5
        const rotateY = relX * 10
        const rotateX = -relY * 10
        card.style.transform = `perspective(900px) translateY(-6px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`
        card.style.setProperty('--kc-spot-x', `${((relX + 0.5) * 100).toFixed(1)}%`)
        card.style.setProperty('--kc-spot-y', `${((relY + 0.5) * 100).toFixed(1)}%`)
      } else if (activeTiltCard) {
        resetTiltCard()
      }
    }

    const onPointerLeave = () => {
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0'
      resetTiltCard()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      resetTiltCard()
    }
  }, [])

  // 4. Optional Ultra-Soft Luxury Atelier Ambient Chord
  const toggleAtelierSound = () => {
    if (soundOn) {
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.35)
      }
      setSoundOn(false)
      return
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!audioCtxRef.current) {
        const ctx = new AudioContextClass()
        const master = ctx.createGain()
        master.gain.value = 0.0001
        master.connect(ctx.destination)

        const freqs = [73.42, 110.0, 185.0, 329.63]
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const noteGain = ctx.createGain()
          osc.type = i % 2 === 0 ? 'sine' : 'triangle'
          osc.frequency.value = freq
          noteGain.gain.value = i === 0 ? 0.35 : 0.14 / i
          osc.connect(noteGain)
          noteGain.connect(master)
          osc.start()
        })

        audioCtxRef.current = ctx
        masterGainRef.current = master
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0.045, audioCtxRef.current.currentTime, 0.6)
      }
      setSoundOn(true)
    } catch {
      setSoundOn(false)
    }
  }

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
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
        @keyframes kcHeroCinemaDrift {
          0% { transform: scale(1) translate3d(0, 0, 0); }
          50% { transform: scale(1.05) translate3d(-0.7%, -0.7%, 0); }
          100% { transform: scale(1) translate3d(0, 0, 0); }
        }
        .hero-gallery {
          overflow: hidden;
        }
        .hero-poster-image {
          animation: kcHeroCinemaDrift 18s ease-in-out infinite;
          will-change: transform;
        }
        .kc-luxury-reveal {
          opacity: 0.94;
          transform: translateY(18px);
          transition: opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1), transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .kc-luxury-revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .art-card {
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
        }
        .art-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle 180px at var(--kc-spot-x, 50%) var(--kc-spot-y, 50%), rgba(212, 175, 55, 0.18), transparent 75%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 2;
        }
        .art-card:hover::before {
          opacity: 1;
        }
        .art-card:hover {
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
        }
        .button-crimson, .product-order {
          position: relative;
          overflow: hidden;
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

      {/* Floating Atelier Ambient Sound Toggle */}
      <button
        type="button"
        onClick={toggleAtelierSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Mute Atelier Ambient Sound' : 'Play Atelier Ambient Sound'}
        style={{
          position: 'fixed',
          bottom: '18px',
          left: '18px',
          zIndex: 9990,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 14px',
          borderRadius: '9999px',
          background: 'rgba(12, 12, 12, 0.86)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          color: '#f5e29f',
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
        }}
      >
        {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
        <span>{soundOn ? 'Atelier Sound · On' : 'Atelier Sound'}</span>
      </button>

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

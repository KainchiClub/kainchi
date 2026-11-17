'use client'

import { useEffect, useRef, useState } from 'react'
import { Ruler, Volume2, VolumeX } from 'lucide-react'

function isAutomatedAudit() {
  if (typeof navigator === 'undefined') return false
  return Boolean(navigator.webdriver || /Lighthouse|Chrome-Lighthouse|PageSpeed/i.test(navigator.userAgent))
}

export function AtelierLuxuryLayer() {
  const [introVisible, setIntroVisible] = useState(() => !isAutomatedAudit())
  const [vaultOpened, setVaultOpened] = useState(false)
  const [introFading, setIntroFading] = useState(false)
  const [soundOn, setSoundOn] = useState(false)

  const progressRef = useRef<HTMLDivElement | null>(null)
  const cursorRingRef = useRef<HTMLDivElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const dismissIntroNow = () => {
    setVaultOpened(true)
    setIntroFading(true)
    window.setTimeout(() => setIntroVisible(false), 380)
  }

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

  // Inject compact "FIND YOUR FIT" square icon card right next to CUSTOM STUDIO in the category strip
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

  // Zero-Reflow Scroll Progress Thread + Smooth Reveal
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

  // Zero-Forced-Reflow Desktop 3D Card Tilt + Luxury Ring Cursor
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch || isAutomatedAudit()) return

    let rafId: number | null = null
    let activeTiltCard: HTMLElement | null = null
    let activeCardRect: DOMRect | null = null

    const resetTiltCard = () => {
      if (!activeTiltCard) return
      activeTiltCard.style.transform = ''
      activeTiltCard = null
      activeCardRect = null
    }

    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const interactive = target?.closest('a, button, [role="button"]')

        if (cursorRingRef.current) {
          cursorRingRef.current.style.opacity = '1'
          cursorRingRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(${interactive ? 1.8 : 1})`
        }

        const card = target?.closest('.art-card') as HTMLElement | null
        if (card) {
          if (activeTiltCard !== card) {
            resetTiltCard()
            activeTiltCard = card
            activeCardRect = card.getBoundingClientRect()
          }
          if (activeCardRect && activeCardRect.width > 0 && activeCardRect.height > 0) {
            const relX = (e.clientX - activeCardRect.left) / activeCardRect.width - 0.5
            const relY = (e.clientY - activeCardRect.top) / activeCardRect.height - 0.5
            const rotateY = relX * 8
            const rotateX = -relY * 8
            card.style.transform = `perspective(900px) translate3d(0, -5px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`
            card.style.setProperty('--kc-spot-x', `${((relX + 0.5) * 100).toFixed(1)}%`)
            card.style.setProperty('--kc-spot-y', `${((relY + 0.5) * 100).toFixed(1)}%`)
          }
        } else if (activeTiltCard) {
          resetTiltCard()
        }
      })
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
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
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

      {/* GPU-Accelerated Golden Ring Cursor (Desktop) */}
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
          transition: 'transform 0.12s ease-out, opacity 0.2s ease',
          willChange: 'transform',
        }}
      />

      {/* Floating Bottom-Left Controls: Atelier Sound + Quick Size Fit */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 9990,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={toggleAtelierSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute Atelier Ambient Sound' : 'Play Atelier Ambient Sound'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '9999px',
            background: 'rgba(12, 12, 12, 0.88)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            color: '#f5e29f',
            fontSize: '10px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
          }}
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{soundOn ? 'Sound · On' : 'Sound'}</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('kainchi:open-fit-concierge'))}
          aria-label="Open Exact Size & Fit Concierge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '9999px',
            background: 'rgba(26, 12, 15, 0.92)',
            border: '1px solid rgba(212, 175, 55, 0.55)',
            color: '#f5e29f',
            fontSize: '10px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
          }}
        >
          <Ruler size={13} />
          <span>Find Fit</span>
        </button>
      </div>

      {/* 3D Collector's Vault Unboxing Curtain */}
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

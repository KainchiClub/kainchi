'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Award, CheckCircle2, Gift, MessageCircle, Ruler, Sparkles, X } from 'lucide-react'
import { formatRupees, type CatalogProduct } from './catalog'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'

const SIZE_CHART: Record<
  'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
  { chestIn: number; lengthIn: number; shoulderIn: number }
> = {
  XS: { chestIn: 40, lengthIn: 26.5, shoulderIn: 20.5 },
  S: { chestIn: 42, lengthIn: 27.5, shoulderIn: 21.5 },
  M: { chestIn: 44, lengthIn: 28.5, shoulderIn: 22.5 },
  L: { chestIn: 46, lengthIn: 29.5, shoulderIn: 23.5 },
  XL: { chestIn: 48, lengthIn: 30.5, shoulderIn: 24.5 },
  XXL: { chestIn: 50, lengthIn: 31.5, shoulderIn: 25.5 },
}

// 1. Compact Floating/Header-Band Trigger + Popup Modal for "Find Your Exact Atelier Fit"
export function BespokeFitConciergeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [heightCm, setHeightCm] = useState(172)
  const [weightKg, setWeightKg] = useState(66)
  const [fitStyle, setFitStyle] = useState<'drop-shoulder' | 'tailored'>('drop-shoulder')

  useEffect(() => {
    const openHandler = () => setIsOpen(true)
    window.addEventListener('kainchi:open-fit-concierge', openHandler)
    return () => window.removeEventListener('kainchi:open-fit-concierge', openHandler)
  }, [])

  const fitRecommendation = useMemo(() => {
    const bmi = weightKg / Math.pow(heightCm / 100, 2)
    let score = 0

    if (weightKg < 54) score = 0
    else if (weightKg < 63) score = 1
    else if (weightKg < 73) score = 2
    else if (weightKg < 83) score = 3
    else if (weightKg < 94) score = 4
    else score = 5

    if (heightCm >= 182 && score < 4) score += 1
    if (heightCm <= 160 && bmi < 23 && score > 0) score -= 1
    if (fitStyle === 'tailored' && score > 0) score -= 1

    const sizes: Array<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'> = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const recommendedSize = sizes[Math.max(0, Math.min(sizes.length - 1, score))]
    const specs = SIZE_CHART[recommendedSize]

    return {
      size: recommendedSize,
      ...specs,
      note:
        fitStyle === 'drop-shoulder'
          ? 'Calibrated for our signature 380–400 GSM boxy drop-shoulder drape.'
          : 'Closer shoulder seam with clean street-tailored silhouette.',
    }
  }, [heightCm, weightKg, fitStyle])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bespoke-fit-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false)
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#D4AF37]/60 bg-[#111111] text-white p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close Fit Concierge"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-neutral-300 hover:bg-[#D4AF37] hover:text-black flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase mb-2">
          <Ruler className="w-3.5 h-3.5" />
          Bespoke Fit Concierge
        </div>
        <h3 id="bespoke-fit-modal-title" className="text-xl font-serif text-white">
          Find Your <span className="text-[#D4AF37]">Exact Atelier Fit</span>
        </h3>

        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300">Height</span>
              <span className="text-[#D4AF37] font-semibold">
                {heightCm} cm ({Math.floor(heightCm / 30.48)}&apos;
                {Math.round((heightCm % 30.48) / 2.54)}&quot;)
              </span>
            </div>
            <input
              type="range"
              min={150}
              max={198}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300">Weight</span>
              <span className="text-[#D4AF37] font-semibold">{weightKg} kg</span>
            </div>
            <input
              type="range"
              min={45}
              max={115}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
          </div>

          <div>
            <span className="block text-xs text-neutral-300 mb-1.5">Preferred Silhouette</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFitStyle('drop-shoulder')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  fitStyle === 'drop-shoulder'
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-black/60 text-neutral-300 border-white/15'
                }`}
              >
                Drop-Shoulder Oversized
              </button>
              <button
                type="button"
                onClick={() => setFitStyle('tailored')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  fitStyle === 'tailored'
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-black/60 text-neutral-300 border-white/15'
                }`}
              >
                Clean Regular Fit
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl border border-[#D4AF37]/55 bg-gradient-to-r from-[#1d160b] to-[#141414]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#D4AF37]">
                Recommended Size
              </span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-3xl font-serif font-bold text-white">
                  {fitRecommendation.size}
                </span>
                <span className="text-[11px] text-neutral-300">
                  Chest {fitRecommendation.chestIn}&quot; · Length {fitRecommendation.lengthIn}&quot;
                </span>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">{fitRecommendation.note}</p>
        </div>
      </div>
    </div>
  )
}

// 2. Interactive Collector's Vault Unboxer (Uses live catalog gallery photos dynamically)
export function VaultInteractiveUnboxer({
  products,
  onSelectProduct,
}: {
  products: CatalogProduct[]
  onSelectProduct?: (product: CatalogProduct) => void
}) {
  const [isBoxOpen, setIsBoxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [unboxCount, setUnboxCount] = useState(0)

  const eligiblePool = useMemo(() => {
    const valid = products.filter(
      (p) => p.stockStatus !== 'sold-out' && p.stockStatus !== 'retired' && Boolean(p.image),
    )
    return valid.length > 0 ? valid : products
  }, [products])

  const activePiece = eligiblePool[currentIndex % Math.max(1, eligiblePool.length)]

  const pickNextRandomPiece = () => {
    if (eligiblePool.length <= 1) {
      setCurrentIndex(0)
      return
    }
    let next = Math.floor(Math.random() * eligiblePool.length)
    if (next === currentIndex) {
      next = (currentIndex + 1) % eligiblePool.length
    }
    setCurrentIndex(next)
  }

  const handleUnboxTap = () => {
    if (!isBoxOpen) {
      pickNextRandomPiece()
      setUnboxCount((c) => c + 1)
      setIsBoxOpen(true)
    } else {
      setIsBoxOpen(false)
      window.setTimeout(() => {
        pickNextRandomPiece()
        setUnboxCount((c) => c + 1)
        setIsBoxOpen(true)
      }, 280)
    }
  }

  const claimViaWhatsApp = (piece: CatalogProduct) => {
    const msg = encodeURIComponent(
      `Hi Kainchi Club! I unboxed "${piece.title}" (${piece.productCode ?? ''} · ${formatRupees(piece.price)}) in The Collector's Vault and would like to claim it.`,
    )
    window.open(`https://wa.me/918863075356?text=${msg}`, '_blank')
  }

  if (!activePiece) return null

  return (
    <div className="w-full max-w-[360px] mx-auto">
      {!isBoxOpen ? (
        <button
          type="button"
          onClick={handleUnboxTap}
          className="group relative w-full aspect-[4/4] rounded-2xl bg-gradient-to-br from-[#47101b] via-[#26080f] to-[#120608] border border-[#D4AF37]/75 shadow-[0_22px_50px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center p-6 cursor-pointer transition-transform duration-300 hover:scale-[1.02] overflow-hidden"
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-[#8b1e24]/85 border-y border-[#D4AF37]/45" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 bg-[#8b1e24]/85 border-x border-[#D4AF37]/45" />

          <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#f8e6a0] via-[#d4af37] to-[#8a6514] border-2 border-[#fff0b8] shadow-[0_0_28px_rgba(212,175,55,0.75)] flex items-center justify-center font-serif font-bold text-sm tracking-widest text-[#23080e] group-hover:scale-110 transition-transform">
            K·C
          </div>

          <span className="relative z-10 mt-5 px-4 py-1.5 rounded-full bg-black/85 border border-[#D4AF37]/70 text-[11px] tracking-[0.2em] uppercase text-[#f5e29f]">
            Tap to Unbox a Masterpiece
          </span>
          <span className="relative z-10 mt-2 text-[10px] tracking-widest uppercase text-white/60">
            {eligiblePool.length} Gallery Pieces Inside
          </span>
        </button>
      ) : (
        <div className="w-full rounded-2xl border border-[#D4AF37]/75 bg-[#141110] text-white overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="relative aspect-[4/4] w-full bg-neutral-900 overflow-hidden">
            <img
              src={resolveDriveImageUrl(activePiece.image)}
              alt={activePiece.title}
              onError={fallbackImageOnError}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 border border-[#D4AF37]/50 text-[10px] tracking-widest text-[#D4AF37] font-semibold">
              {activePiece.productCode ?? 'ARCHIVE'} · UNBOXED #{unboxCount}
            </div>
            <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-[#D4AF37]/35 flex items-center gap-1.5 text-[10px] text-[#f5e29f]">
              <Award className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Sealed with Gold Wax &amp; Certificate of Authenticity</span>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 truncate">
                {activePiece.garment}
              </p>
              <h3 className="text-sm font-semibold text-white truncate">{activePiece.title}</h3>
              <p className="text-sm font-bold text-[#D4AF37]">
                {formatRupees(activePiece.price)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onSelectProduct && (
                <button
                  type="button"
                  onClick={() => onSelectProduct(activePiece)}
                  className="px-2.5 py-2 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] font-medium hover:bg-[#D4AF37] hover:text-black transition cursor-pointer"
                >
                  Customize
                </button>
              )}
              <button
                type="button"
                onClick={() => claimViaWhatsApp(activePiece)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-[11px] hover:bg-[#e5c158] transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Claim
              </button>
            </div>
          </div>

          <div className="px-4 pb-3 pt-1 flex justify-between items-center border-t border-white/10">
            <span className="text-[10px] text-neutral-400">Tap to reveal another random piece</span>
            <button
              type="button"
              onClick={handleUnboxTap}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> Unbox Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

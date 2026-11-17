'use client'

import React, { useMemo, useState } from 'react'
import { Award, CheckCircle2, Gift, MessageCircle, Ruler, Sparkles } from 'lucide-react'

interface VaultPiece {
  id: string
  code: string
  title: string
  garment: string
  gsm: string
  price: string
  image: string
  fallbackImage?: string
}

// Curated Single-Article Masterpieces Only (Zero multi-hanger/group photos)
const SINGLE_ARTICLE_VAULT_POOL: VaultPiece[] = [
  {
    id: 'imperial-peacock',
    code: 'KC-001',
    title: 'Imperial Peacock',
    garment: 'Ultra Luxury Atelier Piece',
    gsm: '400 GSM Heavyweight Cotton',
    price: '₹6,499',
    image: '/lookbook/Imperial Peackock.png',
  },
  {
    id: 'phantom-phoenix',
    code: 'KC-002',
    title: 'Phantom Phoenix',
    garment: 'Signature Back Masterpiece',
    gsm: '400 GSM Heavyweight Fleece',
    price: '₹4,999',
    image: '/lookbook/Phantom Phoenix.png',
  },
  {
    id: 'veloce-nitro-leather',
    code: 'KC-003',
    title: 'The Veloce Nitro Leather',
    garment: 'Distressed Leather Atelier',
    gsm: 'Artisanal Hand-Finished',
    price: '₹4,499',
    image: '/lookbook/The Veloce Nitro Leather.png',
  },
  {
    id: 'love-thorn',
    code: 'KC-004',
    title: 'Love Thorn',
    garment: 'Signature Archive Piece',
    gsm: '380 GSM French Terry',
    price: '₹4,499',
    image: '/lookbook/Love Throne.png',
  },
  {
    id: 'bengal-tiger',
    code: 'KC-005',
    title: 'The Bengal Tiger',
    garment: 'Signature Archive Hoodie',
    gsm: '400 GSM Heavyweight Cotton',
    price: '₹3,999',
    image: '/lookbook/The Bengal Tiger.png',
  },
  {
    id: 'ghost-skull',
    code: 'KC-006',
    title: 'The Ghost Skull',
    garment: 'Monochrome Archive',
    gsm: '380 GSM Heavyweight Cotton',
    price: '₹3,499',
    image: '/lookbook/The Ghost Skull.png',
  },
  {
    id: 'shogun-tiger-denim',
    code: 'KC-007',
    title: 'The Shogun Tiger Denim',
    garment: 'Signature Denim Jacket',
    gsm: '14 oz Heavy Denim',
    price: '₹3,299',
    image: '/lookbook/The Shotgun Tiger Denim.png',
  },
  {
    id: 'cosmic-era',
    code: 'KC-008',
    title: 'The Cosmic Era',
    garment: 'Heavyweight Drop-Shoulder Hoodie',
    gsm: '400 GSM Combed Cotton',
    price: '₹2,499',
    image: '/lookbook/The Cosmic Era.png',
  },
  {
    id: 'royal-derby',
    code: 'KC-009',
    title: 'The Royal Derby',
    garment: 'Equestrian Embroidery Edition',
    gsm: '260 GSM Piqué Cotton',
    price: '₹1,899',
    image: '/lookbook/The Royal Derby.png',
  },
  {
    id: 'paris-crest-polo',
    code: 'KC-010',
    title: 'Paris Crest Polo',
    garment: 'Artisanal Crest Polo',
    gsm: '260 GSM Honeycomb Piqué',
    price: '₹1,499',
    image: '/lookbook/Paris Crest polo.png',
  },
]

function resolveVaultImg(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=80`
}

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

export function LuxuryAtelierSuite() {
  // Interactive Vault Unboxing State
  const [isBoxOpen, setIsBoxOpen] = useState(false)
  const [pieceIndex, setPieceIndex] = useState(0)
  const [unboxCount, setUnboxCount] = useState(0)

  // Bespoke Fit Concierge State
  const [heightCm, setHeightCm] = useState(172)
  const [weightKg, setWeightKg] = useState(66)
  const [fitStyle, setFitStyle] = useState<'drop-shoulder' | 'tailored'>('drop-shoulder')

  const currentVaultPiece = SINGLE_ARTICLE_VAULT_POOL[pieceIndex]

  const handleToggleUnbox = () => {
    if (!isBoxOpen) {
      // Pick a fresh single-article piece different from the previous one
      let nextIdx = Math.floor(Math.random() * SINGLE_ARTICLE_VAULT_POOL.length)
      if (nextIdx === pieceIndex && SINGLE_ARTICLE_VAULT_POOL.length > 1) {
        nextIdx = (pieceIndex + 1) % SINGLE_ARTICLE_VAULT_POOL.length
      }
      setPieceIndex(nextIdx)
      setUnboxCount((c) => c + 1)
      setIsBoxOpen(true)
    } else {
      // Reseal briefly and reveal another random piece
      setIsBoxOpen(false)
      window.setTimeout(() => {
        let nextIdx = Math.floor(Math.random() * SINGLE_ARTICLE_VAULT_POOL.length)
        if (nextIdx === pieceIndex && SINGLE_ARTICLE_VAULT_POOL.length > 1) {
          nextIdx = (pieceIndex + 1) % SINGLE_ARTICLE_VAULT_POOL.length
        }
        setPieceIndex(nextIdx)
        setUnboxCount((c) => c + 1)
        setIsBoxOpen(true)
      }, 360)
    }
  }

  const orderVaultPiece = (piece: VaultPiece) => {
    const msg = encodeURIComponent(
      `Hi Kainchi Club! I unboxed "${piece.title}" (${piece.code} · ${piece.price}) in the Collector's Vault and would like to claim this piece.`,
    )
    window.open(`https://wa.me/918863075356?text=${msg}`, '_blank')
  }

  // Accurate Anthropometric Fit Calculation for Drop-Shoulder & Regular Silhouettes
  const fitRecommendation = useMemo(() => {
    const bmi = weightKg / Math.pow(heightCm / 100, 2)
    let score = 0

    if (weightKg < 54) score = 0
    else if (weightKg < 63) score = 1
    else if (weightKg < 73) score = 2
    else if (weightKg < 83) score = 3
    else if (weightKg < 94) score = 4
    else score = 5

    // Height & BMI adjustments
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
          ? 'Designed for our signature 380–400 GSM boxy drop-shoulder drape.'
          : 'Closer shoulder seam with clean street-tailored silhouette.',
    }
  }, [heightCm, weightKg, fitStyle])

  return (
    <section
      aria-label="Collector's Vault Unboxing & Bespoke Fit Concierge"
      className="w-full py-14 px-4 bg-[#0B0A09] text-white border-t border-[#D4AF37]/25"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* LEFT CARD: INTERACTIVE TAP-TO-UNBOX COLLECTOR'S VAULT */}
        <div className="rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#170b0e] via-[#100d0c] to-[#0b0a09] p-6 md:p-8 flex flex-col justify-between shadow-[0_24px_60px_rgba(0,0,0,0.75)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] tracking-[0.22em] uppercase mb-3">
              <Gift className="w-3.5 h-3.5" />
              The Collector&apos;s Vault Experience
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-white">
              Tap to <span className="text-[#D4AF37]">Unbox</span> a Masterpiece
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-2 leading-relaxed">
              Every Kainchi Club garment arrives sealed in our crimson rigid vault with a gold-embossed authenticity card. Tap below to reveal a curated single-article piece.
            </p>
          </div>

          {/* Interactive 3D Rigid Box Stage */}
          <div className="my-7 flex flex-col items-center">
            {!isBoxOpen ? (
              <button
                type="button"
                onClick={handleToggleUnbox}
                className="group relative w-full max-w-[320px] h-[250px] rounded-2xl bg-gradient-to-br from-[#3b0e17] via-[#21070d] to-[#120608] border border-[#D4AF37]/65 shadow-[0_22px_50px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center p-6 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              >
                {/* Crimson Silk Ribbon */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-[#8b1e24]/80 border-y border-[#D4AF37]/40" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 bg-[#8b1e24]/80 border-x border-[#D4AF37]/40" />

                {/* Golden Wax Seal */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#f8e6a0] via-[#d4af37] to-[#8a6514] border-2 border-[#fff0b8] shadow-[0_0_30px_rgba(212,175,55,0.65)] flex items-center justify-center font-serif font-bold text-sm tracking-widest text-[#23080e] group-hover:scale-110 transition-transform">
                  K·C
                </div>

                <span className="relative z-10 mt-5 px-4 py-1.5 rounded-full bg-black/80 border border-[#D4AF37]/60 text-[11px] tracking-[0.2em] uppercase text-[#f5e29f]">
                  Tap to Break Seal &amp; Unbox
                </span>
              </button>
            ) : (
              <div className="w-full max-w-[340px] rounded-2xl border border-[#D4AF37]/70 bg-[#141110] overflow-hidden shadow-[0_24px_60px_rgba(212,175,55,0.2)] animate-[fadeIn_0.45s_ease]">
                <div className="relative aspect-[4/4] w-full bg-neutral-900 overflow-hidden">
                  <img
                    src={resolveVaultImg(currentVaultPiece.image)}
                    alt={currentVaultPiece.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 border border-[#D4AF37]/50 text-[10px] tracking-widest text-[#D4AF37] font-semibold">
                    {currentVaultPiece.code} · UNBOXED #{unboxCount}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-[#D4AF37]/35 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5 text-[#f5e29f]">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Certificate of Authenticity Included
                    </span>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                      {currentVaultPiece.gsm}
                    </p>
                    <h3 className="text-base font-semibold text-white truncate">
                      {currentVaultPiece.title}
                    </h3>
                    <p className="text-sm font-bold text-[#D4AF37]">{currentVaultPiece.price}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => orderVaultPiece(currentVaultPiece)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs hover:bg-[#e5c158] transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Claim Piece
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
            <span className="text-[11px] text-neutral-400">
              {isBoxOpen ? 'Want to see another single-article piece?' : '10 curated archival pieces inside'}
            </span>
            <button
              type="button"
              onClick={handleToggleUnbox}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4AF37]/60 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37] hover:text-black transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isBoxOpen ? 'Unbox Another Piece' : 'Open Vault'}
            </button>
          </div>
        </div>

        {/* RIGHT CARD: BESPOKE FIT & SIZE CONCIERGE */}
        <div className="rounded-3xl border border-white/15 bg-[#111111] p-6 md:p-8 flex flex-col justify-between shadow-[0_24px_60px_rgba(0,0,0,0.75)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] tracking-[0.22em] uppercase mb-3">
              <Ruler className="w-3.5 h-3.5" />
              Bespoke Fit &amp; Size Concierge
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-white">
              Find Your <span className="text-[#D4AF37]">Exact Atelier Fit</span>
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-2 leading-relaxed">
              Calibrated specifically for Kainchi Club&apos;s heavyweight 380–400 GSM drop-shoulder blocks and artisanal shirts.
            </p>

            {/* Controls */}
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
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
                <div className="flex justify-between text-xs mb-1.5">
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
                <span className="block text-xs text-neutral-300 mb-2">Preferred Silhouette</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFitStyle('drop-shoulder')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      fitStyle === 'drop-shoulder'
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-black/60 text-neutral-300 border-white/15 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    Drop-Shoulder Oversized
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitStyle('tailored')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      fitStyle === 'tailored'
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-black/60 text-neutral-300 border-white/15 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    Clean Regular Fit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Size Output Box */}
          <div className="mt-7 p-5 rounded-2xl border border-[#D4AF37]/55 bg-gradient-to-r from-[#1a150c] to-[#121212]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] tracking-[0.22em] uppercase text-[#D4AF37]">
                  Recommended Atelier Size
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-serif font-bold text-white">
                    {fitRecommendation.size}
                  </span>
                  <span className="text-xs text-neutral-300">
                    Chest {fitRecommendation.chestIn}&quot; · Length {fitRecommendation.lengthIn}&quot; · Shoulder {fitRecommendation.shoulderIn}&quot;
                  </span>
                </div>
              </div>
              <CheckCircle2 className="w-7 h-7 text-[#D4AF37] shrink-0" />
            </div>
            <p className="text-xs text-neutral-400 mt-2.5">{fitRecommendation.note}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

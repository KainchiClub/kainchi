"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, RotateCw, MessageCircle } from "lucide-react";

interface LookbookItem {
  id: string;
  name: string;
  category: string;
  price: string;
  viewBadge: "FRONT ART" | "FULL FIT" | "BACK MASTERPIECE";
  image: string;
  secondImage?: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
  // --- STAGE 1: FRONT-FACING ARTISANAL SHIRTS & SWEATSHIRTS ---
  {
    id: "paris-crest-polo",
    name: "Paris Crest Polo",
    category: "Artisanal Polos",
    price: "₹1,499",
    viewBadge: "FRONT ART",
    image: "/lookbook/Paris Crest polo.png",
  },
  {
    id: "red-flora-shirt",
    name: "Red Flora Shirt",
    category: "Artisanal Shirts",
    price: "₹1,699",
    viewBadge: "FRONT ART",
    image: "/lookbook/Red Flora Shirt.png",
  },
  {
    id: "the-onyx-leopard-shirt",
    name: "The Onyx Leopard Shirt",
    category: "Artisanal Shirts",
    price: "₹1,899",
    viewBadge: "FRONT ART",
    image: "/lookbook/The Onyx Leopard Shirt.png",
  },
  {
    id: "the-mosaic-cyber-sweatshirt",
    name: "The Mosaic Cyber Sweatshirt",
    category: "Heavyweight Sweatshirts",
    price: "₹1,999",
    viewBadge: "FRONT ART",
    image: "/lookbook/The Mosaic Cyber Sweatshirt.png",
  },
  {
    id: "the-royal-flora-shacket",
    name: "The Royal Flora Shacket",
    category: "Denim & Shackets",
    price: "₹2,299",
    viewBadge: "FRONT ART",
    image: "/lookbook/The Royal Flora Shacket.png",
  },
  {
    id: "the-cosmic-era",
    name: "The Cosmic Era",
    category: "Heavyweight Hoodies",
    price: "₹2,499",
    viewBadge: "FRONT ART",
    image: "/lookbook/The Cosmic Era.png",
  },

  // --- STAGE 2: FULL-FIT CO-ORDS & LAYERED DENIM ---
  {
    id: "wild-bloom-cordset",
    name: "Wild Bloom Co-ord Set",
    category: "Luxury Co-ord Sets",
    price: "₹3,299",
    viewBadge: "FULL FIT",
    image: "/lookbook/Wild Bloom Cordset.png",
  },
  {
    id: "denim-print",
    name: "Denim Layer Edition",
    category: "Layered Streetwear",
    price: "₹3,499",
    viewBadge: "FULL FIT",
    image: "/lookbook/Denim print.png",
  },
  {
    id: "the-red-velvet",
    name: "The Red Velvet",
    category: "Dual-View Archive",
    price: "₹5,999",
    viewBadge: "FULL FIT",
    image: "/lookbook/The Red Velvet.png",
    secondImage: "/lookbook/The Red Velvet Back.png",
  },

  // --- STAGE 3: OVER-THE-SHOULDER BACK MASTERPIECES ---
  {
    id: "the-royal-derby",
    name: "The Royal Derby",
    category: "Equestrian Embroidery",
    price: "₹1,899",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/The Royal Derby.png",
  },
  {
    id: "the-shotgun-tiger-denim",
    name: "The Shogun Tiger Denim",
    category: "Signature Denim Jackets",
    price: "₹3,299",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/The Shotgun Tiger Denim.png",
  },
  {
    id: "the-ghost-skull",
    name: "The Ghost Skull",
    category: "Monochrome Archive",
    price: "₹3,499",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/The Ghost Skull.png",
  },
  {
    id: "the-bengal-tiger",
    name: "The Bengal Tiger",
    category: "Signature Archive",
    price: "₹3,999",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/The Bengal Tiger.png",
  },
  {
    id: "love-throne",
    name: "Love Thorn",
    category: "Signature Archive",
    price: "₹4,499",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/Love Throne.png",
  },
  {
    id: "the-veloce-nitro-leather",
    name: "The Veloce Nitro Leather",
    category: "Distressed Leather Atelier",
    price: "₹4,499",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/The Veloce Nitro Leather.png",
  },
  {
    id: "phantom-phoenix",
    name: "Phantom Phoenix",
    category: "Signature Archive",
    price: "₹4,999",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/Phantom Phoenix.png",
  },
  {
    id: "imperial-peackock",
    name: "Imperial Peacock",
    category: "Ultra Luxury Atelier",
    price: "₹6,499",
    viewBadge: "BACK MASTERPIECE",
    image: "/lookbook/Imperial Peackock.png",
  },
];

export default function VirtualLookbook() {
  const totalSlides = LOOKBOOK_ITEMS.length + 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAltAngle, setShowAltAngle] = useState(false);

  // Direct DOM refs for 60fps GPU-accelerated inner model rotation (zero React re-renders)
  const modelStageRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const isExploreSlide = activeIndex === LOOKBOOK_ITEMS.length;
  const currentItem = !isExploreSlide ? LOOKBOOK_ITEMS[activeIndex] : null;
  const prevItem = activeIndex > 0 ? LOOKBOOK_ITEMS[activeIndex - 1] : null;
  const nextItem =
    activeIndex + 1 < LOOKBOOK_ITEMS.length ? LOOKBOOK_ITEMS[activeIndex + 1] : null;

  const resetInnerModel = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (modelStageRef.current) {
      modelStageRef.current.style.transform =
        "perspective(900px) scale(1.04) rotateY(0deg) rotateX(0deg) translateX(0px)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  useEffect(() => {
    resetInnerModel();
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [activeIndex, showAltAngle]);

  const goPrev = () => {
    setShowAltAngle(false);
    setActiveIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goNext = () => {
    setShowAltAngle(false);
    setActiveIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  // Smoothly rotates ONLY the inner model/subject up to ~32° while keeping outer card frame rock-steady
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!modelStageRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (!modelStageRef.current) return;
      const offset = normX - 0.5; // -0.5 to +0.5
      const rotateY = offset * 64; // Smooth ±32° 3D subject turn
      const rotateX = (0.5 - normY) * 10;
      const shiftX = -offset * 22; // Parallax depth shift so edges never clip
      const zoom = 1.12 + Math.abs(offset) * 0.08; // Subtle detail zoom as model turns

      modelStageRef.current.style.transform = `perspective(900px) scale(${zoom.toFixed(3)}) rotateY(${rotateY.toFixed(2)}deg) rotateX(${rotateX.toFixed(2)}deg) translateX(${shiftX.toFixed(1)}px)`;

      if (glareRef.current) {
        glareRef.current.style.opacity = "0.28";
        glareRef.current.style.background = `radial-gradient(circle at ${(normX * 100).toFixed(0)}% 30%, rgba(212,175,55,0.55), transparent 65%)`;
      }
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || !modelStageRef.current) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    const clamped = Math.max(-120, Math.min(120, diff));
    const norm = clamped / 240; // -0.5 to +0.5
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (!modelStageRef.current) return;
      const rotateY = norm * 64;
      const shiftX = -norm * 20;
      modelStageRef.current.style.transform = `perspective(900px) scale(1.12) rotateY(${rotateY.toFixed(2)}deg) translateX(${shiftX.toFixed(1)}px)`;
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 55) {
      if (diff > 0) goNext();
      else goPrev();
    } else {
      resetInnerModel();
    }
    touchStartX.current = null;
  };

  const handleOrderClick = (item: LookbookItem) => {
    const msg = encodeURIComponent(
      `Hi Kainchi Club! I saw "${item.name}" (${item.price}) in the Virtual Lookbook and would like to order / check available sizes.`
    );
    window.open(`https://wa.me/918863075356?text=${msg}`, "_blank");
  };

  const scrollToCatalog = () => {
    const grid = document.getElementById("collection-grid") || document.querySelector("main");
    if (grid) grid.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full py-12 px-4 bg-[#0A0A0A] text-white overflow-hidden border-y border-[#D4AF37]/20">
      <div className="max-w-5xl mx-auto text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs tracking-[0.2em] uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Virtual Atelier
        </div>
        <h2 className="text-2xl md:text-4xl font-serif tracking-wide text-white">
          Your Next <span className="text-[#D4AF37]">Favorite</span>
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 mt-2">
          Swipe to switch outfits • Glide across the look to turn & zoom the outfit in 3D
        </p>
      </div>

      <div
        className="relative max-w-5xl mx-auto flex items-center justify-center min-h-[470px] md:min-h-[560px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {prevItem && (
          <button
            onClick={goPrev}
            aria-label="Previous piece"
            className="hidden md:flex flex-col items-center w-44 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 opacity-55 hover:opacity-90 hover:border-[#D4AF37]/50 transition-all -mr-6 z-10 cursor-pointer"
          >
            <img
              src={encodeURI(prevItem.image)}
              alt={prevItem.name}
              loading="lazy"
              decoding="async"
              className="w-full h-52 object-cover rounded-xl mb-2"
            />
            <span className="text-xs font-medium text-neutral-200 truncate w-full">
              {prevItem.name}
            </span>
            <span className="text-xs text-[#D4AF37] font-semibold">{prevItem.price}</span>
          </button>
        )}

        {/* Outer Card Frame stays 100% straight and rock-steady */}
        <div className="relative z-20 w-full max-w-[330px] md:max-w-[380px] mx-auto select-none">
          {!isExploreSlide && currentItem ? (
            <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/55 bg-[#121212] shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
              <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-full bg-black/75 border border-[#D4AF37]/40 text-[10px] tracking-widest text-[#D4AF37] font-semibold">
                {currentItem.viewBadge}
              </div>

              <div className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-full bg-black/75 text-[11px] text-neutral-300">
                {activeIndex + 1} / {LOOKBOOK_ITEMS.length}
              </div>

              {currentItem.secondImage && (
                <button
                  onClick={() => setShowAltAngle((s) => !s)}
                  className="absolute bottom-24 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 border border-[#D4AF37] text-[#D4AF37] text-xs font-medium shadow-lg hover:bg-[#D4AF37] hover:text-black transition cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {showAltAngle ? "Front View" : "Turn Back"}
                </button>
              )}

              {/* Inner Viewport: Only the model photo turns & zooms inside the fixed frame */}
              <div
                className="relative aspect-[3/4] w-full bg-neutral-900 overflow-hidden cursor-grab active:cursor-grabbing"
                onPointerMove={handlePointerMove}
                onPointerLeave={resetInnerModel}
              >
                <div
                  ref={modelStageRef}
                  className="w-full h-full will-change-transform transition-transform duration-150 ease-out"
                  style={{
                    transform:
                      "perspective(900px) scale(1.04) rotateY(0deg) rotateX(0deg) translateX(0px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <img
                    src={encodeURI(
                      showAltAngle && currentItem.secondImage
                        ? currentItem.secondImage
                        : currentItem.image
                    )}
                    alt={currentItem.name}
                    decoding="async"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>

                <div
                  ref={glareRef}
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
              </div>

              {/* Fixed Bottom Info & WhatsApp Order Bar */}
              <div className="relative z-30 -mt-16 mx-3 mb-3 p-3.5 rounded-2xl bg-[#141414]/95 border border-[#D4AF37]/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                    {currentItem.category}
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-white truncate">
                    {currentItem.name}
                  </h3>
                  <p className="text-sm font-bold text-[#D4AF37] mt-0.5">{currentItem.price}</p>
                </div>

                <button
                  onClick={() => handleOrderClick(currentItem)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs hover:bg-[#e5c158] transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Order
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-[3/4] w-full rounded-3xl border border-[#D4AF37] bg-gradient-to-b from-[#17140d] via-[#0d0d0d] to-[#17140d] p-8 flex flex-col items-center justify-center text-center shadow-[0_20px_60px_rgba(212,175,55,0.18)]">
              <div className="w-14 h-14 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <span className="text-xs tracking-[0.25em] uppercase text-[#D4AF37] mb-2">
                Kainchi Club Archive
              </span>
              <h3 className="text-2xl font-serif text-white mb-3">
                Explore All 70+ Signature Pieces
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-7">
                Discover our complete collection of heavyweight hoodies, artisanal shirts,
                embroidered denim, and bespoke Custom Studio creations.
              </p>
              <button
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#e5c158] transition cursor-pointer"
              >
                Browse Full Collection
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {nextItem && (
          <button
            onClick={goNext}
            aria-label="Next piece"
            className="hidden md:flex flex-col items-center w-44 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 opacity-55 hover:opacity-90 hover:border-[#D4AF37]/50 transition-all -ml-6 z-10 cursor-pointer"
          >
            <img
              src={encodeURI(nextItem.image)}
              alt={nextItem.name}
              loading="lazy"
              decoding="async"
              className="w-full h-52 object-cover rounded-xl mb-2"
            />
            <span className="text-xs font-medium text-neutral-200 truncate w-full">
              {nextItem.name}
            </span>
            <span className="text-xs text-[#D4AF37] font-semibold">{nextItem.price}</span>
          </button>
        )}

        <button
          onClick={goPrev}
          aria-label="Previous"
          className="absolute left-1 md:left-4 z-30 w-10 h-10 rounded-full bg-black/80 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          aria-label="Next"
          className="absolute right-1 md:right-4 z-30 w-10 h-10 rounded-full bg-black/80 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-6">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setShowAltAngle(false);
              setActiveIndex(idx);
            }}
            aria-label={`Slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              activeIndex === idx ? "w-6 bg-[#D4AF37]" : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

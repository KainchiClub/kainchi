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
  fallbackImage?: string;
  secondImage?: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
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
    image: "https://lh3.googleusercontent.com/d/1vpKzAquvP-AwT255suUuiI0_P0lDFz30=w720-rw",
    fallbackImage: "/lookbook/Red Flora Shirt.png",
    secondImage: "https://lh3.googleusercontent.com/d/1B9Y5czqId8nT_AA9ZieE8SZBSjJfmh8I=w720-rw",
  },
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

function resolveItemSrc(src: string) {
  if (src.startsWith("http")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
}

export default function VirtualLookbook() {
  const totalSlides = LOOKBOOK_ITEMS.length + 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAltAngle, setShowAltAngle] = useState(false);

  const cardTrackRef = useRef<HTMLDivElement | null>(null);
  const modelStageRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const stageRectRef = useRef<DOMRect | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeDeltaX = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean>(false);
  const mouseDownX = useRef<number | null>(null);
  const wheelLockRef = useRef<number>(0);

  const isExploreSlide = activeIndex === LOOKBOOK_ITEMS.length;
  const currentItem = !isExploreSlide ? LOOKBOOK_ITEMS[activeIndex] : null;
  const prevItem = activeIndex > 0 ? LOOKBOOK_ITEMS[activeIndex - 1] : null;
  const nextItem =
    activeIndex + 1 < LOOKBOOK_ITEMS.length ? LOOKBOOK_ITEMS[activeIndex + 1] : null;

  const resetTransforms = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    stageRectRef.current = null;
    if (cardTrackRef.current) {
      cardTrackRef.current.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";
      cardTrackRef.current.style.transform = "translate3d(0px, 0, 0) rotate(0deg)";
    }
    if (modelStageRef.current) {
      modelStageRef.current.style.transform =
        "perspective(900px) scale(1.04) rotateY(0deg) rotateX(0deg) translateX(0px)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  useEffect(() => {
    resetTransforms();
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

  const applySwipeVisual = (deltaX: number) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const clamped = Math.max(-150, Math.min(150, deltaX));
      if (cardTrackRef.current) {
        cardTrackRef.current.style.transition = "none";
        const tilt = (clamped / 150) * 4;
        cardTrackRef.current.style.transform = `translate3d(${(clamped * 0.65).toFixed(1)}px, 0, 0) rotate(${tilt.toFixed(2)}deg)`;
      }
      if (modelStageRef.current) {
        const norm = clamped / 240;
        const rotateY = norm * 64;
        const shiftX = -norm * 20;
        modelStageRef.current.style.transform = `perspective(900px) scale(1.12) rotateY(${rotateY.toFixed(2)}deg) translateX(${shiftX.toFixed(1)}px)`;
      }
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeDeltaX.current = 0;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isHorizontalSwipe.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      isHorizontalSwipe.current = true;
    }

    if (isHorizontalSwipe.current) {
      swipeDeltaX.current = dx;
      applySwipeVisual(dx);
    }
  };

  const handleTouchEnd = () => {
    const dx = swipeDeltaX.current;
    const wasSwipe = isHorizontalSwipe.current;
    touchStartX.current = null;
    touchStartY.current = null;
    swipeDeltaX.current = 0;
    isHorizontalSwipe.current = false;

    if (wasSwipe && Math.abs(dx) > 32) {
      if (dx < 0) goNext();
      else goPrev();
    } else {
      resetTransforms();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    mouseDownX.current = e.clientX;
    swipeDeltaX.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownX.current === null) return;
    const dx = e.clientX - mouseDownX.current;
    swipeDeltaX.current = dx;
    applySwipeVisual(dx);
  };

  const handleMouseUp = () => {
    if (mouseDownX.current === null) return;
    const dx = swipeDeltaX.current;
    mouseDownX.current = null;
    swipeDeltaX.current = 0;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    } else {
      resetTransforms();
    }
  };

  const handleModelHoverMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || mouseDownX.current !== null || !modelStageRef.current) return;
    if (!stageRectRef.current) {
      stageRectRef.current = e.currentTarget.getBoundingClientRect();
    }
    const rect = stageRectRef.current;
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (!modelStageRef.current) return;
      const offset = normX - 0.5;
      const rotateY = offset * 64;
      const rotateX = (0.5 - normY) * 10;
      const shiftX = -offset * 22;
      const zoom = 1.12 + Math.abs(offset) * 0.08;

      modelStageRef.current.style.transform = `perspective(900px) scale(${zoom.toFixed(3)}) rotateY(${rotateY.toFixed(2)}deg) rotateX(${rotateX.toFixed(2)}deg) translateX(${shiftX.toFixed(1)}px)`;

      if (glareRef.current) {
        glareRef.current.style.opacity = "0.28";
        glareRef.current.style.background = `radial-gradient(circle at ${(normX * 100).toFixed(0)}% 30%, rgba(212,175,55,0.55), transparent 65%)`;
      }
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > 25 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const now = Date.now();
      if (now - wheelLockRef.current < 420) return;
      wheelLockRef.current = now;
      if (e.deltaX > 0) goNext();
      else goPrev();
    }
  };

  const handleOrderClick = (item: LookbookItem) => {
    const msg = encodeURIComponent(
      `Hi Kainchi Club! I saw "${item.name}" (${item.price}) in the Virtual Lookbook and would like to order / check available sizes.`
    );
    window.open(`https://wa.me/918863075356?text=${msg}`, "_blank");
  };

  const scrollToCatalog = () => {
    window.dispatchEvent(new CustomEvent("kainchi:open-archive"));
    const target = document.getElementById("artwork") || document.querySelector("main");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
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
          Swipe with your finger to switch outfits • Glide across the look to turn &amp; zoom in 3D
        </p>
      </div>

      <div
        className="relative max-w-5xl mx-auto flex items-center justify-center min-h-[470px] md:min-h-[560px]"
        style={{ touchAction: "pan-y" }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {prevItem && (
          <button
            onClick={goPrev}
            aria-label="Previous piece"
            className="hidden md:flex flex-col items-center w-44 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 opacity-55 hover:opacity-90 hover:border-[#D4AF37]/50 transition-all -mr-6 z-10 cursor-pointer"
          >
            <img
              src={resolveItemSrc(prevItem.image)}
              alt={prevItem.name}
              width={160}
              height={208}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="w-full h-52 object-cover rounded-xl mb-2 pointer-events-none"
            />
            <span className="text-xs font-medium text-neutral-200 truncate w-full">
              {prevItem.name}
            </span>
            <span className="text-xs text-[#D4AF37] font-semibold">{prevItem.price}</span>
          </button>
        )}

        <div
          ref={cardTrackRef}
          className="relative z-20 w-full max-w-[330px] md:max-w-[380px] mx-auto select-none will-change-transform"
        >
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

              <div
                className="relative aspect-[3/4] w-full bg-neutral-900 overflow-hidden cursor-grab active:cursor-grabbing"
                onPointerEnter={(e) => {
                  stageRectRef.current = e.currentTarget.getBoundingClientRect();
                }}
                onPointerMove={handleModelHoverMove}
                onPointerLeave={() => {
                  if (mouseDownX.current === null && touchStartX.current === null) resetTransforms();
                }}
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
                    src={resolveItemSrc(
                      showAltAngle && currentItem.secondImage
                        ? currentItem.secondImage
                        : currentItem.image
                    )}
                    alt={currentItem.name}
                    width={380}
                    height={507}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={(e) => {
                      const fallback = currentItem.fallbackImage || "/lookbook/Red Flora Shirt.png";
                      if (!e.currentTarget.src.includes(encodeURIComponent(fallback))) {
                        e.currentTarget.src = resolveItemSrc(fallback);
                      }
                    }}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>

                <div
                  ref={glareRef}
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
              </div>

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
              src={resolveItemSrc(nextItem.image)}
              alt={nextItem.name}
              width={160}
              height={208}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="w-full h-52 object-cover rounded-xl mb-2 pointer-events-none"
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

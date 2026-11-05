'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { BANNER_SLIDES_STORAGE_KEY, isBannerSlideList, type BannerSlide } from './banner-slides'
import { useLocalBrowserStore } from './local-browser-store'

const ROTATION_INTERVAL_MS = 3000
const INTERACTION_PAUSE_MS = 5000
const NO_SAVED_SLIDES: BannerSlide[] = []

export function FamilyCollectionBanner() {
  const [savedSlides] = useLocalBrowserStore(BANNER_SLIDES_STORAGE_KEY, NO_SAVED_SLIDES, isBannerSlideList)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isWindowLoaded, setIsWindowLoaded] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const resumeTimeout = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const slides = useMemo(() => savedSlides.filter((slide) => slide.active && slide.image.trim()), [savedSlides])

  useEffect(() => {
    if (slides.length < 1) {
      setActiveIndex(0)
      return
    }
    setActiveIndex(Math.floor(Math.random() * slides.length))
  }, [slides.length])

  useEffect(() => {
    if (document.readyState === 'complete') {
      setIsWindowLoaded(true)
      return
    }

    const handleLoad = () => setIsWindowLoaded(true)
    window.addEventListener('load', handleLoad, { once: true })
    return () => window.removeEventListener('load', handleLoad)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin: '120px 0px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isWindowLoaded || !isVisible || isPaused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, ROTATION_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isPaused, isVisible, isWindowLoaded, slides.length])

  useEffect(() => () => {
    if (resumeTimeout.current) window.clearTimeout(resumeTimeout.current)
  }, [])

  function pauseForInteraction() {
    setIsPaused(true)
    if (resumeTimeout.current) window.clearTimeout(resumeTimeout.current)
    resumeTimeout.current = window.setTimeout(() => setIsPaused(false), INTERACTION_PAUSE_MS)
  }

  function move(direction: -1 | 1) {
    if (slides.length < 2) return
    pauseForInteraction()
    setActiveIndex((current) => (current + direction + slides.length) % slides.length)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
    pauseForInteraction()
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current
    const endX = event.changedTouches[0]?.clientX ?? null
    touchStartX.current = null
    if (startX === null || endX === null || Math.abs(endX - startX) < 40) return
    move(endX < startX ? 1 : -1)
  }

  if (!slides.length) return null

  const currentSlide = slides[activeIndex]
  const imageSrc = resolveDriveImageUrl(currentSlide.image, 1200)

  return (
    <section ref={sectionRef} className="family-collection-section" aria-label="Kainchi Club collection for everyone">
      <figure className="family-collection-frame">
        <div
          className="family-collection-media"
          role="region"
          aria-roledescription="carousel"
          aria-label="Kainchi Club editorial collection"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            key={currentSlide.id}
            className="family-collection-image is-current"
            src={imageSrc}
            alt={`Kainchi Club collection editorial, slide ${activeIndex + 1}`}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 1200px"
            quality={80}
            loading="eager"
            fetchPriority="low"
            decoding="async"
            unoptimized={!isImageOptimizerSource(imageSrc)}
            draggable={false}
            onError={fallbackImageOnError}
          />
          {slides.length > 1 && <>
            <button type="button" className="family-collection-arrow family-collection-arrow-left" aria-label="Previous collection slide" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></button>
            <button type="button" className="family-collection-arrow family-collection-arrow-right" aria-label="Next collection slide" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></button>
            <div className="family-collection-indicators" role="group" aria-label="Choose a collection slide">
              {slides.map((slide, index) => <button
                key={slide.id}
                type="button"
                className={index === activeIndex ? 'is-current' : ''}
                aria-label={`Show slide ${index + 1}`}
                aria-pressed={index === activeIndex}
                onClick={() => { pauseForInteraction(); setActiveIndex(index) }}
              />)}
            </div>
          </>}
        </div>
        <figcaption>{currentSlide.caption}</figcaption>
      </figure>
    </section>
  )
}

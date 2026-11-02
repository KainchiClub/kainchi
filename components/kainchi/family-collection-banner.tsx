'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fallbackImageOnError, isImageOptimizerSource, resolveDriveImageUrl } from '@/lib/utils'
import { DEFAULT_BANNER_SLIDES, BANNER_SLIDES_STORAGE_KEY, isBannerSlideList } from './banner-slides'
import { useLocalBrowserStore } from './local-browser-store'

const ROTATION_INTERVAL_MS = 3000
const LEGACY_FAMILY_IMAGE_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793520180941.png-TsGiiAjHcqIIiPAfjKxhHxtGhYG0ND.jpeg'
const OPTIMIZED_FAMILY_IMAGE_URL = '/images/banner/kainchi-family-master.webp'

export function FamilyCollectionBanner() {
  const [savedSlides] = useLocalBrowserStore(BANNER_SLIDES_STORAGE_KEY, DEFAULT_BANNER_SLIDES, isBannerSlideList)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isWindowLoaded, setIsWindowLoaded] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const touchResumeTimeout = useRef<number | null>(null)
  const slides = useMemo(() => {
    const activeSlides = savedSlides.filter((slide) => slide.active && slide.image.trim())
    if (activeSlides.length) return activeSlides
    return DEFAULT_BANNER_SLIDES
  }, [savedSlides])

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
    setActiveIndex((current) => current % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (!isWindowLoaded || !isVisible || isPaused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, ROTATION_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isPaused, isVisible, isWindowLoaded, slides.length])

  useEffect(() => () => {
    if (touchResumeTimeout.current) window.clearTimeout(touchResumeTimeout.current)
  }, [])

  function pauseForTouch() {
    setIsPaused(true)
    if (touchResumeTimeout.current) window.clearTimeout(touchResumeTimeout.current)
    touchResumeTimeout.current = window.setTimeout(() => setIsPaused(false), 5000)
  }

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
          onTouchStart={pauseForTouch}
          onTouchEnd={() => {
            if (touchResumeTimeout.current) window.clearTimeout(touchResumeTimeout.current)
            touchResumeTimeout.current = window.setTimeout(() => setIsPaused(false), 5000)
          }}
        >
          {slides.map((slide, index) => {
            if (index !== activeIndex) return null

            const imageSrc = resolveDriveImageUrl(
              slide.image === LEGACY_FAMILY_IMAGE_URL ? OPTIMIZED_FAMILY_IMAGE_URL : slide.image,
              1200,
            )
            return <Image
              key={slide.id}
              className="family-collection-image is-current"
              src={imageSrc}
              alt={`Kainchi Club collection editorial, slide ${index + 1}`}
              width={1600}
              height={900}
              sizes="100vw"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority="low"
              decoding="async"
              unoptimized={!isImageOptimizerSource(imageSrc)}
              draggable={false}
              onError={fallbackImageOnError}
            />
          })}
          {slides.length > 1 && <div className="family-collection-indicators" role="group" aria-label="Choose a collection slide">
            {slides.map((slide, index) => <button
              key={slide.id}
              type="button"
              className={index === activeIndex ? 'is-current' : ''}
              aria-label={`Show slide ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />)}
          </div>}
        </div>
        <figcaption>{slides[activeIndex]?.caption ?? DEFAULT_BANNER_SLIDES[0].caption}</figcaption>
      </figure>
    </section>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_BANNER_SLIDES, BANNER_SLIDES_STORAGE_KEY, isBannerSlideList } from './banner-slides'
import { useLocalBrowserStore } from './local-browser-store'

const ROTATION_INTERVAL_MS = 3000

export function FamilyCollectionBanner() {
  const [savedSlides] = useLocalBrowserStore(BANNER_SLIDES_STORAGE_KEY, DEFAULT_BANNER_SLIDES, isBannerSlideList)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchResumeTimeout = useRef<number | null>(null)
  const slides = useMemo(() => {
    const activeSlides = savedSlides.filter((slide) => slide.active && slide.image.trim())
    if (activeSlides.length) return activeSlides
    return DEFAULT_BANNER_SLIDES
  }, [savedSlides])

  useEffect(() => {
    setActiveIndex((current) => current % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (isPaused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, ROTATION_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isPaused, slides.length])

  useEffect(() => () => {
    if (touchResumeTimeout.current) window.clearTimeout(touchResumeTimeout.current)
  }, [])

  function pauseForTouch() {
    setIsPaused(true)
    if (touchResumeTimeout.current) window.clearTimeout(touchResumeTimeout.current)
    touchResumeTimeout.current = window.setTimeout(() => setIsPaused(false), 5000)
  }

  return (
    <section className="family-collection-section" aria-label="Kainchi Club collection for everyone">
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
          {slides.map((slide, index) => (
            <img
              key={slide.id}
              className={`family-collection-image${index === activeIndex ? ' is-current' : ''}`}
              src={slide.image}
              alt={index === activeIndex ? `Kainchi Club collection editorial, slide ${index + 1}` : ''}
              aria-hidden={index !== activeIndex}
              loading={index === activeIndex ? 'eager' : 'lazy'}
              fetchPriority={index === activeIndex ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />
          ))}
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

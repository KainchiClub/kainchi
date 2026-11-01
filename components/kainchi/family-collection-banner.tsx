'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import { DEFAULT_BANNER_SLIDES, BANNER_SLIDES_STORAGE_KEY, isBannerSlideList } from './banner-slides'
import { useLocalBrowserStore } from './local-browser-store'

const ROTATION_INTERVAL_MS = 3000

export function FamilyCollectionBanner() {
  const [savedSlides] = useLocalBrowserStore(BANNER_SLIDES_STORAGE_KEY, DEFAULT_BANNER_SLIDES, isBannerSlideList)
  const [activeIndex, setActiveIndex] = useState(0)
  const [preloadedIndex, setPreloadedIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const hasAdvancedRef = useRef(false)
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
    if (slides.length < 2) return

    const idleWindow = window as unknown as {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }
    const nextIndex = (activeIndex + 1) % slides.length
    const requestIdle = idleWindow.requestIdleCallback
    const handle = requestIdle
      ? requestIdle(() => setPreloadedIndex(nextIndex), { timeout: 1500 })
      : window.setTimeout(() => setPreloadedIndex(nextIndex), 300)

    return () => {
      if (requestIdle) idleWindow.cancelIdleCallback?.(handle)
      else window.clearTimeout(handle)
    }
  }, [activeIndex, slides])

  useEffect(() => {
    if (isPaused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % slides.length
        if (nextIndex !== current) hasAdvancedRef.current = true
        return nextIndex
      })
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
          {slides.map((slide, index) => {
            const isCurrent = index === activeIndex
            const isIdlePreload = index === preloadedIndex && !isCurrent
            if (!isCurrent && !isIdlePreload) return null

            const isInitialPrioritySlide = isCurrent && index === 0 && !hasAdvancedRef.current
            return <img
              key={slide.id}
              className={`family-collection-image${isCurrent ? ' is-current' : ''}`}
              src={resolveDriveImageUrl(slide.image)}
              alt={isCurrent ? `Kainchi Club collection editorial, slide ${index + 1}` : ''}
              aria-hidden={!isCurrent}
              loading={isInitialPrioritySlide ? 'eager' : 'lazy'}
              fetchPriority={isInitialPrioritySlide ? 'high' : 'low'}
              decoding="async"
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
              onClick={() => {
                hasAdvancedRef.current = true
                setActiveIndex(index)
              }}
            />)}
          </div>}
        </div>
        <figcaption>{slides[activeIndex]?.caption ?? DEFAULT_BANNER_SLIDES[0].caption}</figcaption>
      </figure>
    </section>
  )
}

'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useLocalBrowserStore } from '@/components/kainchi/local-browser-store'
import {
  BANNER_SLIDES_STORAGE_KEY,
  DEFAULT_BANNER_SLIDES,
  isAllowedBannerImage,
  isBannerSlideList,
  MAX_BANNER_SLIDES,
  type BannerSlide,
} from '@/components/kainchi/banner-slides'

const MAX_UPLOAD_BYTES = 750_000

export function BannerSlidesPanel() {
  const [slides, saveSlides] = useLocalBrowserStore(BANNER_SLIDES_STORAGE_KEY, DEFAULT_BANNER_SLIDES, isBannerSlideList)
  const [imageDrafts, setImageDrafts] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  function saveSlideList(update: (current: BannerSlide[]) => BannerSlide[]) {
    const saved = saveSlides(update)
    setMessage(saved ? 'Banner slides saved in this browser.' : 'Could not save banner slides. The browser may be out of local storage space.')
    return saved
  }

  function addSlide() {
    if (slides.length >= MAX_BANNER_SLIDES) return
    const newSlide: BannerSlide = {
      id: `custom-${crypto.randomUUID()}`,
      image: '',
      active: true,
      caption: 'Kainchi Club · Wear your own art.',
    }
    saveSlideList((current) => [...current, newSlide])
    setImageDrafts((current) => ({ ...current, [newSlide.id]: '' }))
  }

  function saveImage(slideId: string) {
    const image = imageDrafts[slideId]?.trim() ?? ''
    if (image && !isAllowedBannerImage(image)) {
      setMessage('Use an HTTPS image URL, a banner image, or upload a JPG, PNG, or WebP file.')
      return
    }

    saveSlideList((current) => current.map((slide) => slide.id === slideId ? { ...slide, image } : slide))
    setImageDrafts((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
  }

  function handleUpload(slideId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage('For browser storage, uploaded images must be 750 KB or smaller. You can also use an HTTPS image URL.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const image = typeof reader.result === 'string' ? reader.result : ''
      if (!image) {
        setMessage('The image could not be read. Try another file.')
        return
      }
      const saved = saveSlideList((current) => current.map((slide) => slide.id === slideId ? { ...slide, image } : slide))
      if (saved) setImageDrafts((current) => {
        const next = { ...current }
        delete next[slideId]
        return next
      })
    }
    reader.onerror = () => setMessage('The image could not be read. Try another file.')
    reader.readAsDataURL(file)
  }

  function reorderSlide(slideId: string, direction: -1 | 1) {
    const index = slides.findIndex((slide) => slide.id === slideId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= slides.length) return

    saveSlideList((current) => {
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  function toggleActive(slideId: string) {
    saveSlideList((current) => current.map((slide) => slide.id === slideId ? { ...slide, active: !slide.active } : slide))
  }

  function deleteSlide(slideId: string) {
    saveSlideList((current) => current.filter((slide) => slide.id !== slideId))
    setImageDrafts((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
  }

  return (
    <section className="admin-panel banner-slides-panel" aria-labelledby="banner-slides-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="banner-slides-title">Banner Slides</h2>
          <p>Manage up to {MAX_BANNER_SLIDES} storefront slides. Changes are saved only in this browser&apos;s local storage.</p>
        </div>
        <span className="admin-count">{slides.length} / {MAX_BANNER_SLIDES} SLOTS</span>
      </div>
      <div className="banner-slides-toolbar">
        <p>External image URLs stay at their original quality. Browser uploads are limited to 750 KB each.</p>
        <button className="button button-crimson" type="button" onClick={addSlide} disabled={slides.length >= MAX_BANNER_SLIDES}>
          <Plus aria-hidden="true" /> Add new slide
        </button>
      </div>
      {message && <p className="banner-slides-message" role="status" aria-live="polite">{message}</p>}
      {slides.length ? (
        <ol className="banner-slides-list">
          {slides.map((slide, index) => (
            <li className="banner-slide-card" key={slide.id}>
              <div className="banner-slide-card-topline">
                <span className="banner-slide-number">{String(index + 1).padStart(2, '0')}</span>
                <strong>{slide.id === 'kainchi-family-master' ? 'Original family master' : `Slide ${index + 1}`}</strong>
                <div className="banner-slide-order-actions">
                  <button type="button" onClick={() => reorderSlide(slide.id, -1)} disabled={index === 0} aria-label={`Move slide ${index + 1} up`}><ArrowUp aria-hidden="true" /></button>
                  <button type="button" onClick={() => reorderSlide(slide.id, 1)} disabled={index === slides.length - 1} aria-label={`Move slide ${index + 1} down`}><ArrowDown aria-hidden="true" /></button>
                  <button type="button" onClick={() => toggleActive(slide.id)} className={slide.active ? 'is-active' : ''} aria-pressed={slide.active}>{slide.active ? 'Active' : 'Inactive'}</button>
                  <button type="button" onClick={() => deleteSlide(slide.id)} aria-label={`Delete slide ${index + 1}`}><Trash2 aria-hidden="true" /></button>
                </div>
              </div>
              <div className="banner-slide-card-content">
                <div className="banner-slide-preview">
                  {slide.image ? <img src={slide.image} alt="" loading="lazy" /> : <span><ImagePlus aria-hidden="true" /> Image not set</span>}
                </div>
                <div className="banner-slide-fields">
                  <label className="admin-field">
                    <span>Image URL</span>
                    <input
                      type="text"
                      inputMode="url"
                      value={imageDrafts[slide.id] ?? slide.image}
                      onChange={(event) => setImageDrafts((current) => ({ ...current, [slide.id]: event.target.value }))}
                      placeholder="https://example.com/banner.jpg"
                      aria-label={`Image URL for slide ${index + 1}`}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Caption</span>
                    <input
                      type="text"
                      maxLength={180}
                      value={slide.caption}
                      onChange={(event) => saveSlideList((current) => current.map((item) => item.id === slide.id ? { ...item, caption: event.target.value } : item))}
                      aria-label={`Caption for slide ${index + 1}`}
                    />
                  </label>
                  <div className="banner-slide-edit-actions">
                    <button className="button button-outline-dark" type="button" onClick={() => saveImage(slide.id)}>Save image</button>
                    <button className="button button-outline-dark" type="button" onClick={() => fileInputs.current[slide.id]?.click()}><ImagePlus aria-hidden="true" /> Upload replacement</button>
                    <input
                      ref={(element) => { fileInputs.current[slide.id] = element }}
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleUpload(slide.id, event)}
                      aria-label={`Upload image for slide ${index + 1}`}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="banner-slides-empty">No slides are saved. The storefront carousel is showing its default collection while you add a slide.</p>
      )}
    </section>
  )
}

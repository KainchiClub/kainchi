'use client'

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Save, Trash2 } from 'lucide-react'
import { useLocalBrowserStore } from '@/components/kainchi/local-browser-store'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import {
  BANNER_SLIDES_STORAGE_KEY,
  DEFAULT_BANNER_SLIDES,
  isAllowedBannerImage,
  isBannerSlideList,
  MAX_BANNER_SLIDES,
  type BannerSlide,
} from '@/components/kainchi/banner-slides'

const MAX_UPLOAD_BYTES = 25_000_000
const MAX_STORED_IMAGE_LENGTH = 5_500_000
const MAX_IMAGE_EDGE = 2560
const MAX_SOURCE_PIXELS = 100_000_000
const SAVE_CONFIRMATION_MESSAGE = '✓ Successfully Saved & Live on Storefront'
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
  'image/bmp', 'image/heic', 'image/heif', 'image/tiff', 'image/tif',
])

type BannerSlideDraft = { image: string; caption: string }
type CaptionGenerationState = { requestId: string; isGenerating: boolean; message: string }

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The image could not be encoded. Try another file.'))
    }, type, quality)
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('The processed image could not be read.'))
    reader.onerror = () => reject(new Error('The processed image could not be read.'))
    reader.readAsDataURL(blob)
  })
}

async function processBannerImage(file: File) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()

    const sourceWidth = image.naturalWidth
    const sourceHeight = image.naturalHeight
    if (!sourceWidth || !sourceHeight || sourceWidth * sourceHeight > MAX_SOURCE_PIXELS) {
      throw new Error('This image is too large to safely process in your browser.')
    }

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser could not prepare this image.')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    let blob = await canvasToBlob(canvas, 'image/webp', 0.9)
    let outputType = 'image/webp'

    if (blob.type !== 'image/webp') {
      context.clearRect(0, 0, width, height)
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
      outputType = 'image/jpeg'
    }

    if (blob.type !== outputType) throw new Error('Your browser does not support WebP or JPEG image processing.')

    let dataUrl = await blobToDataUrl(blob)
    if (dataUrl.length > MAX_STORED_IMAGE_LENGTH) {
      blob = await canvasToBlob(canvas, outputType, 0.78)
      dataUrl = await blobToDataUrl(blob)
    }

    if (dataUrl.length > MAX_STORED_IMAGE_LENGTH || !isAllowedBannerImage(dataUrl)) {
      throw new Error('This image is too detailed to fit safely in browser storage. Choose a different image.')
    }

    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function createLocalEditorialSuggestion(imageData: string, fileName: string) {
  const normalizedName = fileName.toLowerCase()
  if (/street|graffiti|spray|urban/.test(normalizedName)) return 'The street, in a new frame.'
  if (/tailor|stitch|thread|sew/.test(normalizedName)) return 'Crafted with a sharper point of view.'
  if (/drop|collection|editorial/.test(normalizedName)) return 'New art. No ordinary angles.'

  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageData
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return 'Wear your own point of view.'

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let red = 0
    let green = 0
    let blue = 0
    let brightness = 0
    let saturation = 0
    let samples = 0

    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 24) continue
      const r = pixels[index] / 255
      const g = pixels[index + 1] / 255
      const b = pixels[index + 2] / 255
      const maximum = Math.max(r, g, b)
      const minimum = Math.min(r, g, b)
      red += r
      green += g
      blue += b
      brightness += (0.2126 * r + 0.7152 * g + 0.0722 * b) * 255
      saturation += maximum ? (maximum - minimum) / maximum : 0
      samples += 1
    }

    if (!samples) return 'Wear your own point of view.'
    const averageRed = red / samples
    const averageGreen = green / samples
    const averageBlue = blue / samples
    const averageBrightness = brightness / samples
    const averageSaturation = saturation / samples

    if (averageBrightness < 72) return 'A little mystery, made to move.'
    if (averageSaturation > 0.42) return 'Color with its own point of view.'
    if (averageRed - averageBlue > 0.12 && averageRed - averageGreen > 0.04) return 'Warm tones, wild instincts.'
    if (averageBlue - averageRed > 0.08) return 'Cool hues, bold horizons.'
    return 'Wear your own point of view.'
  } catch {
    return 'Wear your own point of view.'
  }
}

export function BannerSlidesPanel() {
  const [slides, saveSlides] = useLocalBrowserStore(BANNER_SLIDES_STORAGE_KEY, DEFAULT_BANNER_SLIDES, isBannerSlideList)
  const [slideDrafts, setSlideDrafts] = useState<Record<string, BannerSlideDraft>>({})
  const [captionStates, setCaptionStates] = useState<Record<string, CaptionGenerationState>>({})
  const [uploadPreviews, setUploadPreviews] = useState<Record<string, string>>({})
  const [processingSlides, setProcessingSlides] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null)
  const uploadObjectUrlsRef = useRef(new Map<string, string>())
  const uploadRequestIdsRef = useRef(new Map<string, string>())

  useEffect(() => () => {
    uploadObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    uploadObjectUrlsRef.current.clear()
  }, [])

  function saveSlideList(update: (current: BannerSlide[]) => BannerSlide[]) {
    const saved = saveSlides(update)
    setMessage(saved ? SAVE_CONFIRMATION_MESSAGE : 'Could not save banner slides. The browser may be out of local storage space.')
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
  }

  function saveSlide(slideId: string) {
    const draft = slideDrafts[slideId]
    if (!draft) return
    if (processingSlides[slideId]) {
      setMessage('Wait for image processing to finish before saving this slide.')
      return
    }
    if (!draft.image || !isAllowedBannerImage(draft.image)) {
      setMessage('Choose a valid image before saving this slide.')
      return
    }
    if (captionStates[slideId]?.isGenerating) {
      setMessage('Wait for the caption suggestion to finish, or try again before saving.')
      return
    }

    const saved = saveSlideList((current) => current.map((slide) => slide.id === slideId
      ? { ...slide, image: draft.image, caption: draft.caption.slice(0, 180) }
      : slide))
    if (!saved) return

    setSlideDrafts((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
    setCaptionStates((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
  }

  function saveAllEdits() {
    if (Object.values(processingSlides).some(Boolean)) {
      setMessage('Wait for image processing to finish before saving all edits.')
      return
    }
    if (Object.values(captionStates).some((state) => state.isGenerating)) {
      setMessage('Wait for caption suggestions to finish, or try again before saving all edits.')
      return
    }

    const saved = saveSlideList((current) => current.map((slide) => {
      const draft = slideDrafts[slide.id]
      if (!draft) return slide
      return { ...slide, image: draft.image, caption: draft.caption.slice(0, 180) }
    }))
    if (!saved) return

    setSlideDrafts({})
    setCaptionStates({})
  }

  function clearUploadPreview(slideId: string, requestId?: string) {
    if (requestId && uploadRequestIdsRef.current.get(slideId) !== requestId) return

    const objectUrl = uploadObjectUrlsRef.current.get(slideId)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    uploadObjectUrlsRef.current.delete(slideId)
    uploadRequestIdsRef.current.delete(slideId)
    setUploadPreviews((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
    setProcessingSlides((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
  }

  async function generateCaption(slideId: string, image: string, fileName: string, initialCaption: string, requestId: string) {
    try {
      const response = await fetch('/api/admin/banner-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      if (!response.ok) throw new Error('Caption generation failed.')
      const result: unknown = await response.json()
      const caption = typeof result === 'object' && result !== null && 'caption' in result && typeof result.caption === 'string'
        ? result.caption.trim().slice(0, 180)
        : ''
      if (!caption) throw new Error('The caption response was empty.')

      setSlideDrafts((current) => {
        const draft = current[slideId]
        if (!draft || draft.image !== image || draft.caption !== initialCaption) return current
        return { ...current, [slideId]: { ...draft, caption } }
      })
      setCaptionStates((current) => current[slideId]?.requestId === requestId
        ? { ...current, [slideId]: { requestId, isGenerating: false, message: 'AI suggestion ready. Review or edit it before saving.' } }
        : current)
    } catch {
      const caption = await createLocalEditorialSuggestion(image, fileName)
      setSlideDrafts((current) => {
        const draft = current[slideId]
        if (!draft || draft.image !== image || draft.caption !== initialCaption) return current
        return { ...current, [slideId]: { ...draft, caption } }
      })
      setCaptionStates((current) => current[slideId]?.requestId === requestId
        ? { ...current, [slideId]: { requestId, isGenerating: false, message: 'AI captioning is unavailable. A local fallback suggestion is ready; review or replace it.' } }
        : current)
    }
  }

  function handleUpload(slideId: string, file: File) {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setMessage('Choose a supported raster image such as JPG, PNG, WebP, AVIF, GIF, or HEIC.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage('Choose an image 25 MB or smaller. It will be resized and encoded in your browser before saving.')
      return
    }

    const slide = slides.find((item) => item.id === slideId)
    if (!slide) return

    const requestId = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    const previousPreview = uploadObjectUrlsRef.current.get(slideId)
    if (previousPreview) URL.revokeObjectURL(previousPreview)
    uploadObjectUrlsRef.current.set(slideId, previewUrl)
    uploadRequestIdsRef.current.set(slideId, requestId)
    setUploadPreviews((current) => ({ ...current, [slideId]: previewUrl }))
    setProcessingSlides((current) => ({ ...current, [slideId]: true }))
    setMessage('')

    const captionAtSelection = slideDrafts[slideId]?.caption ?? slide.caption
    void processBannerImage(file)
      .then((image) => {
        if (uploadRequestIdsRef.current.get(slideId) !== requestId) return

        const captionRequestId = crypto.randomUUID()
        setSlideDrafts((current) => ({
          ...current,
          [slideId]: { image, caption: current[slideId]?.caption ?? slide.caption },
        }))
        setCaptionStates((current) => ({
          ...current,
          [slideId]: { requestId: captionRequestId, isGenerating: true, message: 'Generating an editorial suggestion from the image…' },
        }))
        void generateCaption(slideId, image, file.name, captionAtSelection, captionRequestId)
      })
      .catch((error: unknown) => {
        if (uploadRequestIdsRef.current.get(slideId) !== requestId) return
        setMessage(error instanceof Error ? error.message : 'The image could not be processed. Try another file.')
      })
      .finally(() => clearUploadPreview(slideId, requestId))
  }

  function handleFileSelection(slideId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file) handleUpload(slideId, file)
  }

  function handleDrop(slideId: string, event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDraggingSlideId(null)
    const file = event.dataTransfer.files[0]
    if (file) handleUpload(slideId, file)
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
    const pendingUploadId = uploadRequestIdsRef.current.get(slideId)
    if (pendingUploadId) clearUploadPreview(slideId, pendingUploadId)
    saveSlideList((current) => current.filter((slide) => slide.id !== slideId))
    setSlideDrafts((current) => {
      const next = { ...current }
      delete next[slideId]
      return next
    })
    setCaptionStates((current) => {
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
          <p>Manage up to {MAX_BANNER_SLIDES} storefront slides. Images and approved captions stay in this browser&apos;s local storage.</p>
        </div>
        <span className="admin-count">{slides.length} / {MAX_BANNER_SLIDES} SLOTS</span>
      </div>
      <div className="banner-slides-toolbar">
        <p>Drop or choose an image, then review the AI suggestion or local fallback. Images are converted in-browser to crisp WebP/JPEG at up to 2560px; the processed image is sent to AI Gateway only for captioning.</p>
        <div className="banner-slides-toolbar-actions">
          <button className="button button-crimson banner-slides-save-all" type="button" onClick={saveAllEdits}>
            <Save aria-hidden="true" /> Save All Edits
          </button>
          <button className="button button-crimson" type="button" onClick={addSlide} disabled={slides.length >= MAX_BANNER_SLIDES}>
            <Plus aria-hidden="true" /> Add new slide
          </button>
        </div>
      </div>
      {message && (message === SAVE_CONFIRMATION_MESSAGE
        ? <p className="banner-slides-message" role="status" aria-live="polite"><span className="banner-slides-saved-badge">{message}</span></p>
        : <p className="banner-slides-message" role="status" aria-live="polite">{message}</p>)}
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
                  {uploadPreviews[slide.id] || slideDrafts[slide.id]?.image || slide.image
                    ? <img src={resolveDriveImageUrl(uploadPreviews[slide.id] ?? slideDrafts[slide.id]?.image ?? slide.image)} alt="" loading={uploadPreviews[slide.id] ? 'eager' : 'lazy'} decoding="async" onError={fallbackImageOnError} />
                    : <span><ImagePlus aria-hidden="true" /> Image not set</span>}
                </div>
                <div className="banner-slide-fields">
                  <label
                    className={`banner-slide-dropzone${draggingSlideId === slide.id ? ' is-dragging' : ''}`}
                    onDragOver={(event) => { event.preventDefault(); setDraggingSlideId(slide.id) }}
                    onDragLeave={() => setDraggingSlideId(null)}
                    onDrop={(event) => handleDrop(slide.id, event)}
                  >
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileSelection(slide.id, event)}
                      aria-label={`Choose an image for slide ${index + 1}`}
                    />
                    <ImagePlus aria-hidden="true" />
                    <span>Drop an image here or <strong>choose a file</strong><small>Canvas optimized · up to 25 MB</small></span>
                  </label>
                  <label className="admin-field">
                    <span>Editorial caption</span>
                    <input
                      type="text"
                      maxLength={180}
                      value={slideDrafts[slide.id]?.caption ?? slide.caption}
                      onChange={(event) => {
                        const caption = event.target.value
                        if (slideDrafts[slide.id]) {
                          setSlideDrafts((current) => ({ ...current, [slide.id]: { ...current[slide.id], caption } }))
                        } else {
                          saveSlideList((current) => current.map((item) => item.id === slide.id ? { ...item, caption } : item))
                        }
                      }}
                      aria-label={`Caption for slide ${index + 1}`}
                    />
                  </label>
                  {captionStates[slide.id] && <p className="banner-slide-caption-status" role="status" aria-live="polite">{captionStates[slide.id].message}</p>}
                  <div className="banner-slide-edit-actions">
                    <button
                      className="button button-outline-dark"
                      type="button"
                      onClick={() => saveSlide(slide.id)}
                      disabled={!slideDrafts[slide.id] || processingSlides[slide.id] || captionStates[slide.id]?.isGenerating}
                    ><Save aria-hidden="true" /> Save Slide</button>
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

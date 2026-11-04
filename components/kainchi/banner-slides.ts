export const BANNER_SLIDES_STORAGE_KEY = 'kainchi-banner-slides-v1'
export const MAX_BANNER_SLIDES = 15

export type BannerSlide = {
  id: string
  image: string
  active: boolean
  caption: string
}

export const DEFAULT_BANNER_SLIDES: BannerSlide[] = []

export function isBannerSlideList(value: unknown): value is BannerSlide[] {
  return Array.isArray(value)
    && value.length <= MAX_BANNER_SLIDES
    && value.every((slide) => (
      typeof slide === 'object'
      && slide !== null
      && typeof slide.id === 'string'
      && slide.id.length > 0
      && slide.id.length <= 100
      && typeof slide.image === 'string'
      && slide.image.length <= 5_500_000
      && (slide.image === '' || isAllowedBannerImage(slide.image))
      && typeof slide.active === 'boolean'
      && typeof slide.caption === 'string'
      && slide.caption.length <= 180
    ))
}

export function isAllowedBannerImage(value: string) {
  const image = value.trim()
  if (image.startsWith('/images/banner/')) return true
  if (/^data:image\/(?:jpeg|png|webp|avif|gif|bmp|heic|heif|tiff?);base64,/i.test(image)) return true

  try {
    return new URL(image).protocol === 'https:'
  } catch {
    return false
  }
}

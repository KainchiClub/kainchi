export const BANNER_SLIDES_STORAGE_KEY = 'kainchi-banner-slides-v1'
export const MAX_BANNER_SLIDES = 15

export type BannerSlide = {
  id: string
  image: string
  active: boolean
  caption: string
}

export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'kainchi-family-master',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793520180941.png-TsGiiAjHcqIIiPAfjKxhHxtGhYG0ND.jpeg',
    active: true,
    caption: 'Kainchi Club Collection · Crafted for Everyone. Wearable art for the entire circle.',
  },
  { id: 'editorial-one', image: '/images/banner/editorial-one.png', active: true, caption: 'Made for the moments we share.' },
  { id: 'editorial-two', image: '/images/banner/editorial-two.png', active: true, caption: 'Good company. Better things to wear.' },
  { id: 'editorial-three', image: '/images/banner/editorial-three.png', active: true, caption: 'A little different, together.' },
  { id: 'editorial-four', image: '/images/banner/editorial-four.png', active: true, caption: 'Find your people. Wear your art.' },
]

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

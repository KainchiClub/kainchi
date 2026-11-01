import type { SyntheticEvent } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const IMAGE_FALLBACK = '/placeholder.jpg'

export function resolveDriveImageUrl(url: string | null | undefined): string {
  const value = url?.trim()
  if (!value) return IMAGE_FALLBACK

  const isDriveHost = /^https?:\/\/(?:drive|docs)\.google\.com\//i.test(value)
  const isGoogleusercontentHost = /^https?:\/\/lh3\.googleusercontent\.com\//i.test(value)
  if (!isDriveHost && !isGoogleusercontentHost) return value
  if (isDriveHost && /\/folders\//i.test(value)) return IMAGE_FALLBACK

  const match = value.match(/(?:\/d\/|[?&]id=)([a-zA-Z0-9_-]{25,})/)
  if (match?.[1]) return `https://lh3.googleusercontent.com/d/${match[1]}=s1600`
  return isDriveHost ? IMAGE_FALLBACK : value
}

export function fallbackImageOnError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (image.dataset.fallbackApplied === 'true') return

  image.dataset.fallbackApplied = 'true'
  image.removeAttribute('srcset')
  image.removeAttribute('sizes')
  image.src = IMAGE_FALLBACK
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

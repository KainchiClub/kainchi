export const CUSTOM_INQUIRIES_STORAGE_KEY = 'kainchi-custom-inquiries-v1'
export const CUSTOM_INQUIRIES_UPDATED_EVENT = 'kainchi:custom-inquiries-updated'
const MAX_LOCAL_INQUIRIES = 30

export type CustomInquiry = {
  id: string
  createdAt: string
  productCode: string
  garment: string
  color: string
  size: string
  budget: string
  notes: string
  partnerCode: string
  referenceImageUrls: string[]
  storage: 'cloud' | 'browser'
}

export type CustomInquiryInput = Omit<CustomInquiry, 'storage'>

export function readLocalInquiries(): CustomInquiry[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CUSTOM_INQUIRIES_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((entry): entry is CustomInquiry => typeof entry === 'object' && entry !== null && typeof (entry as CustomInquiry).id === 'string') : []
  } catch {
    return []
  }
}

export function saveLocalInquiry(inquiry: CustomInquiryInput) {
  const entry: CustomInquiry = { ...inquiry, storage: 'browser' }
  const next = [entry, ...readLocalInquiries().filter((item) => item.id !== entry.id)].slice(0, MAX_LOCAL_INQUIRIES)
  try {
    window.localStorage.setItem(CUSTOM_INQUIRIES_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage quota exceeded: keep the specs and drop the embedded photo previews.
    const lean = next.map((item) => ({ ...item, referenceImageUrls: item.referenceImageUrls.filter((url) => !url.startsWith('data:')) }))
    try { window.localStorage.setItem(CUSTOM_INQUIRIES_STORAGE_KEY, JSON.stringify(lean)) } catch {}
  }
  window.dispatchEvent(new CustomEvent(CUSTOM_INQUIRIES_UPDATED_EVENT))
}

function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read image')) }
    image.src = url
  })
}

async function drawScaled(file: Blob, maxDimension: number) {
  const image = await loadImage(file)
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

export async function compressForUpload(file: File) {
  try {
    const canvas = await drawScaled(file, 2000)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (!blob) return file
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'reference'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export async function makeLocalPreview(file: File) {
  try {
    const canvas = await drawScaled(file, 520)
    return canvas.toDataURL('image/jpeg', 0.72)
  } catch {
    return ''
  }
}

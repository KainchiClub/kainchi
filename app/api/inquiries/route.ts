import { list, put } from '@vercel/blob'
import { isAdminSessionActive } from '@/app/admin/auth'
import type { CustomInquiry } from '@/components/kainchi/custom-inquiries'

const INQUIRY_PREFIX = 'inquiries/'
const MAX_LISTED = 200

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function isBlobImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com') && url.pathname.startsWith('/reference-photos/')
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null) throw new Error('Invalid body')
    payload = body as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Invalid inquiry.' }, { status: 400 })
  }

  const id = text(payload.id, 64) || crypto.randomUUID()
  const createdAtValue = new Date(text(payload.createdAt, 40))
  const inquiry: CustomInquiry = {
    id,
    createdAt: Number.isFinite(createdAtValue.getTime()) ? createdAtValue.toISOString() : new Date().toISOString(),
    productCode: text(payload.productCode, 100),
    garment: text(payload.garment, 200),
    color: text(payload.color, 200),
    size: text(payload.size, 60),
    budget: text(payload.budget, 60),
    notes: text(payload.notes, 1000),
    partnerCode: text(payload.partnerCode, 60),
    referenceImageUrls: Array.isArray(payload.referenceImageUrls) ? payload.referenceImageUrls.filter(isBlobImageUrl).slice(0, 5) : [],
    storage: 'cloud',
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ fallback: true, error: 'Inquiry storage is not configured yet.' }, { status: 503 })
  }

  try {
    await put(`${INQUIRY_PREFIX}${inquiry.createdAt.replace(/[:.]/g, '-')}-${id}.json`, JSON.stringify(inquiry), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
    })
    return Response.json({ ok: true, id })
  } catch (error) {
    console.error('[kainchi] inquiry save failed', error)
    return Response.json({ fallback: true, error: 'Inquiry storage is unavailable.' }, { status: 503 })
  }
}

export async function GET() {
  if (!(await isAdminSessionActive())) {
    return Response.json({ error: 'Admin access required.' }, { status: 401 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ inquiries: [], configured: false })
  }

  try {
    const { blobs } = await list({ prefix: INQUIRY_PREFIX, limit: MAX_LISTED })
    const results = await Promise.all(blobs.map(async (blob) => {
      try {
        const response = await fetch(blob.url, { cache: 'no-store' })
        return response.ok ? await response.json() as CustomInquiry : null
      } catch {
        return null
      }
    }))
    const inquiries = results
      .filter((entry): entry is CustomInquiry => entry !== null)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    return Response.json({ inquiries, configured: true })
  } catch (error) {
    console.error('[kainchi] inquiry list failed', error)
    return Response.json({ inquiries: [], configured: true, error: 'Unable to load cloud inquiries.' })
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const FALLBACK_SUPABASE_URL = 'https://wmuuontaetovajkfsond.supabase.co'

function isValidHttpUrl(value: string | undefined | null): value is string {
  if (!value) return false
  const trimmed = value.trim()
  return /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)
}

function getSupabaseConfig() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  let localUrl = ''
  let localKey = ''

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('kainchi-cloud-config-v1')
      if (raw) {
        const parsed = JSON.parse(raw) as { supabaseUrl?: string; supabaseAnonKey?: string }
        localUrl = parsed.supabaseUrl?.trim() ?? ''
        localKey = parsed.supabaseAnonKey?.trim() ?? ''
      }
    } catch {
      // ignore storage read errors
    }
  }

  // सिर्फ़ वही URL चुनें जो सचमुच वैध https:// URL हो
  const url = isValidHttpUrl(envUrl)
    ? envUrl
    : isValidHttpUrl(localUrl)
      ? localUrl
      : FALLBACK_SUPABASE_URL

  const key = envKey || localKey || ''

  return { url, key }
}

let cachedClient: SupabaseClient | null = null
let cachedSignature = ''

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig()
  if (!isValidHttpUrl(url) || !key) return null

  const signature = `${url}::${key}`
  if (cachedClient && cachedSignature === signature) {
    return cachedClient
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    })
    cachedSignature = signature
    return cachedClient
  } catch (err) {
    console.error('Supabase client init skipped:', err)
    return null
  }
}

export async function uploadProductImageToSupabase(fileOrDataUrl: File | string, productId: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    let blob: Blob
    let ext = 'jpg'

    if (typeof fileOrDataUrl === 'string') {
      if (!fileOrDataUrl.startsWith('data:image/')) {
        return fileOrDataUrl
      }
      const match = fileOrDataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/)
      if (match?.[1]) {
        ext = match[1].replace('jpeg', 'jpg')
      }
      const response = await fetch(fileOrDataUrl)
      blob = await response.blob()
    } else {
      blob = fileOrDataUrl
      const nameParts = fileOrDataUrl.name.split('.')
      if (nameParts.length > 1) {
        ext = nameParts.pop()!.toLowerCase()
      }
    }

    const filePath = `${productId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('products')
      .upload(filePath, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })

    if (error) {
      console.error('Supabase Storage upload error:', error.message)
      return null
    }

    const { data } = supabase.storage.from('products').getPublicUrl(filePath)
    return data?.publicUrl ?? null
  } catch (err) {
    console.error('Image upload failed:', err)
    return null
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const FALLBACK_SUPABASE_URL = 'https://wmuuontaetovajkfsond.supabase.co'

function getSupabaseConfig() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('kainchi-cloud-config-v1')
      if (raw) {
        const parsed = JSON.parse(raw) as { supabaseUrl?: string; supabaseAnonKey?: string }
        if (parsed.supabaseUrl?.trim() && parsed.supabaseAnonKey?.trim()) {
          return {
            url: parsed.supabaseUrl.trim(),
            key: parsed.supabaseAnonKey.trim(),
          }
        }
      }
    } catch {
      // ignore storage read errors
    }
  }

  return {
    url: envUrl || FALLBACK_SUPABASE_URL,
    key: envKey || '',
  }
}

let cachedClient: SupabaseClient | null = null
let cachedSignature = ''

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig()
  if (!url || !key) return null

  const signature = `${url}::${key}`
  if (cachedClient && cachedSignature === signature) {
    return cachedClient
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  })
  cachedSignature = signature
  return cachedClient
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

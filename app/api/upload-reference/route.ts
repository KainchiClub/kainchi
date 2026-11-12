import { put } from '@vercel/blob'

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_UPLOAD_BYTES = 4_400_000

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ fallback: true, error: 'Photo storage is not configured yet.' }, { status: 503 })
  }

  let file: FormDataEntryValue | null = null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return Response.json({ error: 'Invalid upload.' }, { status: 400 })
  }

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'No photo provided.' }, { status: 400 })
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return Response.json({ error: 'Use a JPG, PNG, or WEBP image.' }, { status: 415 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: 'Choose a smaller photo.' }, { status: 413 })
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'

  try {
    const blob = await put(`reference-photos/${Date.now()}.${extension}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return Response.json({ url: blob.url })
  } catch (error) {
    console.error('[kainchi] reference upload failed', error)
    return Response.json({ fallback: true, error: 'Photo storage is unavailable.' }, { status: 503 })
  }
}

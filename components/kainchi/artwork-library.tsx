'use client'

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, ImagePlus, Plus, Upload, X } from 'lucide-react'
import { referenceArtwork } from './hero-showcase'

const garmentTypes = ['Sweatshirt', 'Fleece Hoodie', 'Oversized T-Shirt', 'Boxy Tee', 'Bomber Jacket', 'Cap']
const themes = ['Divine & Spiritual', 'Brahmand', 'Aesthetic', 'Nature & Scenic', 'Automotive/Cars', 'Abstract', 'Typography']

type Artwork = {
  id: string
  title: string
  garment: string
  theme: string
  image: string
  position: string
  uploaded?: boolean
}

const initialArtworks: Artwork[] = [
  { id: 'wildflower', title: 'A softer kind of wild', garment: 'Fleece Hoodie', theme: 'Nature & Scenic', image: referenceArtwork, position: '14% 47%' },
  { id: 'night-drive', title: 'After hours / 01', garment: 'Bomber Jacket', theme: 'Automotive/Cars', image: referenceArtwork, position: '39% 58%' },
  { id: 'small-universe', title: 'Small universe', garment: 'Sweatshirt', theme: 'Brahmand', image: referenceArtwork, position: '63% 42%' },
  { id: 'mythmaker', title: 'Mythmaker', garment: 'Oversized T-Shirt', theme: 'Divine & Spiritual', image: referenceArtwork, position: '89% 51%' },
]

function orderUrl(title: string) {
  return `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(`Hi Kainchi Club, I'm interested in ${title}.` )}`
}

function UploadModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (artwork: Artwork) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [garment, setGarment] = useState(garmentTypes[0])
  const [theme, setTheme] = useState(themes[0])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const fileReader = useRef<FileReader | null>(null)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function acceptFile(nextFile?: File) {
    if (!nextFile) return
    if (!nextFile.type.startsWith('image/')) {
      setError('Choose an image file to continue.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError('Choose an image under 10 MB.')
      return
    }
    if (fileReader.current?.readyState === FileReader.LOADING) fileReader.current.abort()
    setFile(nextFile)
    setPreview('')
    setError('')
    const reader = new FileReader()
    fileReader.current = reader
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreview(reader.result)
    }
    reader.onerror = () => setError('This image could not be opened. Try another file.')
    reader.readAsDataURL(nextFile)
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0])
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    acceptFile(event.dataTransfer.files[0])
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || !preview) {
      setError('Add a photo of your artwork before publishing.')
      return
    }
    onSubmit({
      id: `${Date.now()}-${file.name}`,
      title: title.trim() || `${theme} / ${garment}`,
      garment,
      theme,
      image: preview,
      position: 'center',
      uploaded: true,
    })
  }

  return (
    <div className="upload-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" aria-describedby="upload-description">
        <div className="modal-topline"><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Kainchi studio</span><button className="icon-button" type="button" onClick={onClose} aria-label="Close upload window"><X /></button></div>
        <div className="modal-heading"><p className="eyebrow eyebrow-dark">ADD TO THE ARCHIVE</p><h2 id="upload-title">Make room for <em>new art.</em></h2><p id="upload-description">Share a piece from your studio. It will appear in this page&apos;s artwork library right away.</p></div>
        <form className="upload-form" onSubmit={submit}>
          <div className="upload-form-fields">
            <div className="form-field"><label htmlFor="art-title">Artwork name <span>Optional</span></label><input id="art-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this piece a name" maxLength={64} /></div>
            <div className="form-row">
              <div className="form-field"><label htmlFor="garment-type">Garment type</label><select id="garment-type" value={garment} onChange={(event) => setGarment(event.target.value)}>{garmentTypes.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="form-field"><label htmlFor="art-theme">Theme</label><select id="art-theme" value={theme} onChange={(event) => setTheme(event.target.value)}>{themes.map((item) => <option key={item}>{item}</option>)}</select></div>
            </div>
            <div className="form-field"><span className="field-label">Artwork photo</span><input ref={fileInput} className="visually-hidden" type="file" accept="image/*" onChange={onFileChange} aria-label="Choose an artwork photo" /><button className={`drop-zone${preview ? ' has-preview' : ''}`} type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
              {preview ? <><img src={preview} alt="Preview of selected artwork" /><span className="drop-zone-copy"><strong>{file?.name}</strong><span>Tap to choose a different photo</span></span><span className="drop-zone-icon"><Check /></span></> : <><span className="drop-zone-icon"><ImagePlus /></span><span className="drop-zone-copy"><strong>Choose a photo or drop it here</strong><span>JPG, PNG or WEBP · up to 10 MB</span></span><Upload className="drop-zone-upload" aria-hidden="true" /></>}
            </button></div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><p>New artwork is added to your current preview.</p><button className="button button-crimson" type="submit"><Plus aria-hidden="true" /> Publish artwork</button></div>
        </form>
      </section>
    </div>
  )
}

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <article className="art-card">
      <a className="art-image-link" href={orderUrl(artwork.title)} aria-label={`Order ${artwork.title} on WhatsApp`}>
        <div className="art-image-wrap">
          <img className="art-image" src={artwork.image} alt={`${artwork.title} — ${artwork.garment} in the ${artwork.theme} theme`} style={{ objectPosition: artwork.position }} />
          <span className="art-card-sticker">{artwork.uploaded ? 'JUST ADDED' : 'KAINCHI ORIGINAL'}</span>
          <span className="art-image-arrow"><ArrowUpRight aria-hidden="true" /></span>
        </div>
      </a>
      <div className="art-card-meta"><div><p className="art-theme">{artwork.theme}</p><h3>{artwork.title}</h3></div><span className="art-garment">{artwork.garment}</span></div>
      <a className="product-order" href={orderUrl(artwork.title)}>Order on WhatsApp <ArrowUpRight aria-hidden="true" /></a>
    </article>
  )
}

export function ArtworkLibrary() {
  const [artworks, setArtworks] = useState(initialArtworks)
  const [activeTheme, setActiveTheme] = useState('All artwork')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [addedNotice, setAddedNotice] = useState(false)
  const filters = ['All artwork', ...themes]
  const visibleArtworks = activeTheme === 'All artwork' ? artworks : artworks.filter((artwork) => artwork.theme === activeTheme)

  function publishArtwork(artwork: Artwork) {
    setArtworks((current) => [artwork, ...current])
    setActiveTheme('All artwork')
    setIsUploadOpen(false)
    setAddedNotice(true)
    window.setTimeout(() => setAddedNotice(false), 3600)
  }

  return (
    <section className="artwork-section section-wrap" id="artwork" aria-labelledby="artwork-title">
      <div className="artwork-heading">
        <div><p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The artwork library</p><h2 id="artwork-title">Wear a little <em>wonder.</em></h2><p className="section-intro">Original ideas, printed with care. Find the one that feels like you.</p></div>
        <button className="button button-outline-dark" type="button" onClick={() => setIsUploadOpen(true)}><Plus aria-hidden="true" /> Add artwork</button>
      </div>
      <div className="art-filters" role="group" aria-label="Filter artwork by theme">{filters.map((filter) => <button type="button" key={filter} className={`filter-pill${activeTheme === filter ? ' active' : ''}`} aria-pressed={activeTheme === filter} onClick={() => setActiveTheme(filter)}>{filter}</button>)}</div>
      {addedNotice && <p className="upload-success" role="status"><Check aria-hidden="true" /> Your artwork is now in the library.</p>}
      {visibleArtworks.length > 0 ? <div className="art-grid">{visibleArtworks.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} />)}</div> : <div className="art-empty"><p>No pieces in this theme just yet.</p><button className="text-link" type="button" onClick={() => setIsUploadOpen(true)}>Add the first one <Plus aria-hidden="true" /></button></div>}
      <div className="artwork-footnote"><span>AN OPEN CANVAS</span><span>Show us what you&apos;ve been making. <button type="button" onClick={() => setIsUploadOpen(true)}>Add to the archive <ArrowUpRight aria-hidden="true" /></button></span></div>
      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} onSubmit={publishArtwork} />}
    </section>
  )
}

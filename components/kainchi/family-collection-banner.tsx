import Image from 'next/image'

const familyCollectionImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20261030_215752-IUy58utpKLh0IEGp0TmSxn8mdyi27L.png'

export function FamilyCollectionBanner() {
  return (
    <section className="family-collection-section" aria-label="Kainchi Club collection for everyone">
      <figure className="family-collection-frame">
        <Image
          src={familyCollectionImage}
          alt="Kainchi Club family apparel collection featuring illustrated hoodies, graphic denim, a panda jacket, and children's wear beneath the circular brand seal."
          width={1208}
          height={804}
          sizes="100vw"
          priority={true}
          unoptimized={false}
          quality={100}
          style={{ width: '100%', height: 'auto', imageRendering: '-webkit-optimize-contrast', objectFit: 'cover' }}
        />
        <figcaption>Kainchi Club Collection · Crafted for Everyone. Wearable art for the entire circle.</figcaption>
      </figure>
    </section>
  )
}

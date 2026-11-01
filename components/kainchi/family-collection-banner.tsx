import Image from 'next/image'

const familyCollectionImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793520180941.png-TsGiiAjHcqIIiPAfjKxhHxtGhYG0ND.jpeg'

export function FamilyCollectionBanner() {
  return (
    <section className="family-collection-section" aria-label="Kainchi Club collection for everyone">
      <figure className="family-collection-frame">
        <Image
          src={familyCollectionImage}
          alt="Kainchi Club Studio Family showcase with a group wearing embroidered shirts, illustrated denim, hoodies, and jackets beneath the circular brand medallion."
          width={2048}
          height={1152}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1200px"
          priority={true}
          loading="eager"
          fetchPriority="high"
          quality={85}
          style={{ width: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'cover', imageRendering: '-webkit-optimize-contrast' }}
        />
        <figcaption>Kainchi Club Collection · Crafted for Everyone. Wearable art for the entire circle.</figcaption>
      </figure>
    </section>
  )
}

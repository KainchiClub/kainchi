const familyCollectionImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20261030_215752-IUy58utpKLh0IEGp0TmSxn8mdyi27L.png'

export function FamilyCollectionBanner() {
  return (
    <section className="family-collection-section" aria-label="Kainchi Club collection for everyone">
      <figure className="family-collection-frame">
        <img
          src={familyCollectionImage}
          alt="Kainchi Club family apparel collection featuring illustrated hoodies, graphic denim, a panda jacket, and children's wear beneath the circular brand seal."
          loading="lazy"
          decoding="async"
        />
        <figcaption>Kainchi Club Collection · Crafted for Everyone. Wearable art for the entire circle.</figcaption>
      </figure>
    </section>
  )
}

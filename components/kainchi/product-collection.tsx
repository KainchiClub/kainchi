import { ArrowUpRight, MoveUpRight } from 'lucide-react'
import { referenceArtwork } from './hero-showcase'

const products = [
  { name: 'Heavy Boxy Tee', detail: 'The everyday canvas', price: '₹1,299', position: '19% 46%', number: '01' },
  { name: 'Oversized Tee', detail: 'Room to make a mark', price: '₹1,199', position: '67% 43%', number: '02' },
  { name: 'Fleece Hoodie', detail: 'A little warmth, a lot of art', price: '₹2,499', position: '19% 48%', number: '03' },
  { name: 'Bomber Jacket', detail: 'Built to stand apart', price: '₹3,999', position: '38% 44%', number: '04' },
]

function whatsappOrder(name: string) {
  return `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(`Hi Kainchi Club, I'd like to order the ${name}.` )}`
}

export function ProductCollection() {
  return (
    <section className="collection-section section-wrap" id="collection" aria-labelledby="collection-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The essentials</p>
          <h2 id="collection-title">Your next <em>favourite.</em></h2>
        </div>
        <p className="section-intro">Good fabric is just the beginning. Pick your piece, then make it yours.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.name}>
            <a className="product-image-link" href={whatsappOrder(product.name)} aria-label={`Order ${product.name} on WhatsApp`}>
              <div className="product-image" style={{ backgroundImage: `url("${referenceArtwork}")`, backgroundPosition: product.position }}>
                <span className="product-number">{product.number}</span>
                <span className="product-image-arrow"><MoveUpRight aria-hidden="true" /></span>
              </div>
            </a>
            <div className="product-meta"><div><h3>{product.name}</h3><p>{product.detail}</p></div><span>{product.price}</span></div>
            <a className="product-order" href={whatsappOrder(product.name)}>Order on WhatsApp <ArrowUpRight aria-hidden="true" /></a>
          </article>
        ))}
      </div>
      <div className="collection-note"><span>01—04</span><span>Designed to be worn. Made to be remembered.</span><a href="#artwork">Find your print <ArrowUpRight aria-hidden="true" /></a></div>
    </section>
  )
}

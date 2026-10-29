'use client'

import { useState } from 'react'
import { ArrowUpRight, Scissors } from 'lucide-react'
import { ArtworkLibrary } from './artwork-library'
import { type CatalogProduct } from './catalog'
import { useCatalogProducts } from './catalog-store'
import { HeroShowcase } from './hero-showcase'
import { ProductCollection } from './product-collection'
import { ProductCustomizer } from './product-customizer'
import { OrderCart } from './order-cart'
import { openWhatsAppOrder, type CartLineDetails, type CartLineItem } from './order'
import { PackagingShowcase } from './packaging-showcase'
import { SiteHeader } from './site-header'

const brandLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg'

function createCartLine(details: CartLineDetails): CartLineItem {
  return { ...details, cartId: crypto.randomUUID() }
}

export function StorefrontClient() {
  const [products] = useCatalogProducts()
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [cartItems, setCartItems] = useState<CartLineItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  function addToCart(details: CartLineDetails) {
    setCartItems((current) => [...current, createCartLine(details)])
    setIsCartOpen(true)
  }

  function orderCurrentProduct(details: CartLineDetails) {
    openWhatsAppOrder([...cartItems, createCartLine(details)])
  }

  return (
    <>
      <SiteHeader />
      <main>
        <HeroShowcase />
        <div className="canvas-band" aria-label="Made with care, worn with feeling"><span>MADE WITH CARE</span><span className="canvas-band-mark"><Scissors aria-hidden="true" /></span><span>WORN WITH FEELING</span></div>
        <ProductCollection products={products} onCustomize={setSelectedProduct} />
        <ArtworkLibrary products={products} onCustomize={setSelectedProduct} />
        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="story-number">K—C<br />2026</div>
          <div className="story-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A small studio with a big heart</p><h2 id="story-title">Not just what<br />you <em>wear.</em><br />What you <em>carry.</em></h2></div>
          <div className="story-aside"><p>We believe the things we wear can say the things we don&apos;t. Kainchi Club is a home for independent art, honest craft, and pieces that feel like they were always yours.</p><a href="https://wa.me/91XXXXXXXXXX?text=Hi%20Kainchi%20Club%2C%20tell%20me%20about%20your%20studio." className="story-link">A note to the studio <ArrowUpRight aria-hidden="true" /></a></div>
          <div className="story-texture" aria-hidden="true" />
        </section>
        <PackagingShowcase />
      </main>
      <footer className="site-footer"><a className="wordmark footer-wordmark" href="#top" aria-label="Kainchi Club home"><img className="wordmark-logo" src={brandLogo} alt="" /><span>KAINCHI <span className="wordmark-light">CLUB</span></span></a><p>Wear your own art. © 2026 Kainchi Club</p><div className="footer-links"><a href="https://wa.me/91XXXXXXXXXX?text=Hi%20Kainchi%20Club" aria-label="Contact Kainchi Club on WhatsApp">WhatsApp <ArrowUpRight aria-hidden="true" /></a><a href="#top" aria-label="Back to top">Back to top <ArrowUpRight aria-hidden="true" /></a><a href="/admin">Admin Portal <ArrowUpRight aria-hidden="true" /></a></div></footer>
      <OrderCart
        items={cartItems}
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
        onQuantityChange={(cartId, quantity) => setCartItems((current) => current.map((item) => item.cartId === cartId ? { ...item, quantity } : item))}
        onGiftBoxChange={(cartId, includesGiftBox) => setCartItems((current) => current.map((item) => item.cartId === cartId ? { ...item, includesGiftBox } : item))}
        onRemove={(cartId) => setCartItems((current) => current.filter((item) => item.cartId !== cartId))}
        onCheckout={() => openWhatsAppOrder(cartItems)}
      />
      {selectedProduct && <ProductCustomizer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(details) => { addToCart(details); setSelectedProduct(null) }}
        onOrderNow={orderCurrentProduct}
      />}
    </>
  )
}

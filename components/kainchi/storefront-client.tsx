'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Scissors } from 'lucide-react'
import { ArtworkLibrary } from './artwork-library'
import { getFeaturedProducts, type CatalogProduct } from './catalog'
import { useCatalogProducts } from './catalog-store'
import { LetterboxFeedback } from './letterbox-feedback'
import { HeroShowcase } from './hero-showcase'
import { ProductCollection } from './product-collection'
import { ProductCustomizer } from './product-customizer'
import { OrderCart } from './order-cart'
import { openWhatsAppOrder, type CartLineDetails, type CartLineItem } from './order'
import { PackagingShowcase } from './packaging-showcase'
import { SiteHeader } from './site-header'
import { VisitorLeadPopup } from './visitor-lead-popup'
import { PolicyModals } from './policy-modals'
import { FAQSection } from './faq-section'
import { FamilyCollectionBanner } from './family-collection-banner'
import { DiwaliComboPopup } from './diwali-combo-popup'
import { StudioIntakeModal } from './studio-intake-modal'

const brandLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg'
const OVERLAY_HISTORY_KEY = '__kainchiClubOverlay'

type StorefrontOverlayHistoryEntry = { id: string; kind: 'product' | 'cart' }

function mergeOverlayHistoryState(entry: StorefrontOverlayHistoryEntry) {
  const currentState = window.history.state
  const baseState = currentState && typeof currentState === 'object' && !Array.isArray(currentState)
    ? currentState as Record<string, unknown>
    : {}

  return { ...baseState, [OVERLAY_HISTORY_KEY]: entry }
}

function createCartLine(details: CartLineDetails): CartLineItem {
  return { ...details, cartId: crypto.randomUUID() }
}

export function StorefrontClient() {
  const [products] = useCatalogProducts()
  const featuredProducts = useMemo(() => getFeaturedProducts(products), [products])
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [cartItems, setCartItems] = useState<CartLineItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [premiumPackagingDefault, setPremiumPackagingDefault] = useState(false)
  const overlayHistoryRef = useRef<StorefrontOverlayHistoryEntry | null>(null)
  const overlayScrollPositionRef = useRef(0)
  const overlayReturnFocusRef = useRef<HTMLElement | null>(null)
  const premiumPackagingSelected = cartItems.length > 0
    ? cartItems.every((item) => item.includesGiftBox)
    : premiumPackagingDefault

  useEffect(() => {
    const blockInspectionShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const isInspectionShortcut = event.key === 'F12'
        || (event.ctrlKey && event.shiftKey && key === 'i')
        || (event.ctrlKey && key === 'u')

      if (!isInspectionShortcut) return
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('keydown', blockInspectionShortcuts, true)
    return () => window.removeEventListener('keydown', blockInspectionShortcuts, true)
  }, [])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const activeEntry = overlayHistoryRef.current
      if (!activeEntry) return

      const state = event.state && typeof event.state === 'object'
        ? event.state as Record<string, unknown>
        : null
      const poppedEntry = state?.[OVERLAY_HISTORY_KEY] as StorefrontOverlayHistoryEntry | undefined

      if (poppedEntry?.id === activeEntry.id) {
        overlayHistoryRef.current = poppedEntry
        return
      }

      overlayHistoryRef.current = null
      setSelectedProduct(null)
      setIsCartOpen(false)
      const scrollPosition = overlayScrollPositionRef.current
      const returnFocusTarget = overlayReturnFocusRef.current
      overlayReturnFocusRef.current = null

      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' })
        if (returnFocusTarget?.isConnected) returnFocusTarget.focus({ preventScroll: true })
      })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const updateOverlayHistory = useCallback((kind: StorefrontOverlayHistoryEntry['kind']) => {
    const currentEntry = overlayHistoryRef.current
    const nextEntry = currentEntry
      ? { ...currentEntry, kind }
      : { id: crypto.randomUUID(), kind }

    if (currentEntry) {
      window.history.replaceState(mergeOverlayHistoryState(nextEntry), '', window.location.href)
    } else {
      overlayScrollPositionRef.current = window.scrollY
      const activeElement = document.activeElement
      overlayReturnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null
      window.history.pushState(mergeOverlayHistoryState(nextEntry), '', window.location.href)
    }

    overlayHistoryRef.current = nextEntry
  }, [])

  const closeActiveOverlay = useCallback(() => {
    if (overlayHistoryRef.current) {
      window.history.back()
      return
    }

    setSelectedProduct(null)
    setIsCartOpen(false)
  }, [])

  const openProduct = useCallback((product: CatalogProduct) => {
    updateOverlayHistory('product')
    setIsCartOpen(false)
    setSelectedProduct(product)
  }, [updateOverlayHistory])

  const handleCartOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      closeActiveOverlay()
      return
    }

    updateOverlayHistory('cart')
    setSelectedProduct(null)
    setIsCartOpen(true)
  }, [closeActiveOverlay, updateOverlayHistory])

  const addToCart = useCallback((details: CartLineDetails) => {
    const line = createCartLine(details)
    setCartItems((current) => [...current, line])
    setPremiumPackagingDefault(details.includesGiftBox)
    updateOverlayHistory('cart')
    setSelectedProduct(null)
    setIsCartOpen(true)
  }, [updateOverlayHistory])

  function changeGiftBox(cartId: string, includesGiftBox: boolean) {
    setPremiumPackagingDefault(includesGiftBox)
    setCartItems((current) => current.map((item) => item.cartId === cartId ? { ...item, includesGiftBox } : item))
  }

  function changePremiumPackaging(isSelected: boolean) {
    setPremiumPackagingDefault(isSelected)
    setCartItems((current) => current.map((item) => ({ ...item, includesGiftBox: isSelected })))
  }

  function orderCurrentProduct(details: CartLineDetails) {
    setPremiumPackagingDefault(details.includesGiftBox)
    openWhatsAppOrder([...cartItems, createCartLine(details)])
  }

  return (
    <>
      <SiteHeader />
      <main>
        <HeroShowcase />
        <div className="canvas-band" aria-label="Made with care, worn with feeling"><span>MADE WITH CARE</span><span className="canvas-band-mark"><Scissors aria-hidden="true" /></span><span>WORN WITH FEELING</span></div>
        <FamilyCollectionBanner />
        <ProductCollection products={featuredProducts} onCustomize={openProduct} />
        <LetterboxFeedback />
        <ArtworkLibrary products={products} onCustomize={openProduct} />
        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="story-number">K—C<br />2026</div>
          <div className="story-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A small studio with a big heart</p><h2 id="story-title">Not just what<br />you <em>wear.</em><br />What you <em>carry.</em></h2></div>
          <div className="story-aside"><p>We believe the things we wear can say the things we don&apos;t. Kainchi Club is a home for independent art, honest craft, and pieces that feel like they were always yours.</p><a href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club%2C%20tell%20me%20about%20your%20studio." className="story-link">A note to the studio <ArrowUpRight aria-hidden="true" /></a></div>
          <div className="story-texture" aria-hidden="true" />
        </section>
        <PackagingShowcase premiumPackagingSelected={premiumPackagingSelected} onPremiumPackagingChange={changePremiumPackaging} />
        <FAQSection />
      </main>
      <footer className="site-footer"><a className="wordmark footer-wordmark" href="#top" aria-label="Kainchi Club home"><img className="wordmark-logo" src={brandLogo} alt="" /><span>KAINCHI <span className="wordmark-light">CLUB</span></span></a><p>Wear your own art. © 2026 Kainchi Club</p><div className="footer-links"><a href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club" aria-label="Contact Kainchi Club on WhatsApp">WhatsApp <ArrowUpRight aria-hidden="true" /></a><a href="#top" aria-label="Back to top">Back to top <ArrowUpRight aria-hidden="true" /></a><a href="/admin">Admin Portal <ArrowUpRight aria-hidden="true" /></a><PolicyModals /></div></footer>
      <OrderCart
        items={cartItems}
        isOpen={isCartOpen}
        onOpenChange={handleCartOpenChange}
        onQuantityChange={(cartId, quantity) => setCartItems((current) => current.map((item) => item.cartId === cartId ? { ...item, quantity } : item))}
        onGiftBoxChange={changeGiftBox}
        onRemove={(cartId) => setCartItems((current) => current.filter((item) => item.cartId !== cartId))}
        onCheckout={() => openWhatsAppOrder(cartItems)}
      />
      <VisitorLeadPopup />
      <DiwaliComboPopup />
      <StudioIntakeModal />
      {selectedProduct && <ProductCustomizer
        product={selectedProduct}
        defaultIncludesGiftBox={premiumPackagingDefault}
        onClose={closeActiveOverlay}
        onAddToCart={addToCart}
        onOrderNow={orderCurrentProduct}
      />}
    </>
  )
}

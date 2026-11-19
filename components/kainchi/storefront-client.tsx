'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Scissors } from 'lucide-react'
import { ArtworkLibrary } from './artwork-library'
import { AtelierLuxuryLayer } from './atelier-luxury-layer'
import { BespokeFitConciergeModal, VaultInteractiveUnboxer } from './luxury-atelier-suite'
import { getFeaturedProducts, type CatalogProduct } from './catalog'
import { useCatalogProducts } from './catalog-store'
import { LetterboxFeedback } from './letterbox-feedback'
import { HeroShowcase } from './hero-showcase'
import VirtualLookbook from '../VirtualLookbook'
import { OrderCart } from './order-cart'
import { type CartLineDetails, type CartLineItem } from './order'
import { PackagingShowcase } from './packaging-showcase'
import { SiteHeader, SocialIcon } from './site-header'
import { PolicyModals } from './policy-modals'
import { FAQSection } from './faq-section'
import { FamilyCollectionBanner } from './family-collection-banner'
import { DeliveryDetailsModal } from './delivery-details-modal'
import { StudioIntakeModal } from './studio-intake-modal'
import { StudioAllianceProgram } from './studio-alliance-program'
import { CollectionStories, matchesStoryFilter, type StoryFilter } from './collection-stories'

const ProductCustomizer = dynamic(() => import('./product-customizer').then((module) => module.ProductCustomizer), { ssr: false })
const SizeGuideModal = dynamic(() => import('./size-guide-modal').then((module) => module.SizeGuideModal), { ssr: false })

const brandLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg'
const OVERLAY_HISTORY_KEY = '__kainchiClubOverlay'
const ESSENTIALS_SHUFFLE_KEY = 'kainchi_essentials_shuffle_cycle'

function shuffleEssentials(products: CatalogProduct[]) {
  const pool = [...products]
  for (let index = pool.length - 1; index > 0; index -= 1) { const swapIndex = Math.floor(Math.random() * (index + 1)); [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]] }
  return pool.slice(0, 8)
}

type StorefrontOverlayHistoryEntry = { id: string; kind: 'product' | 'cart' }
type HistoryStateRecord = Record<string, unknown>

function readHistoryState(): HistoryStateRecord {
  const currentState = window.history.state
  return currentState && typeof currentState === 'object' && !Array.isArray(currentState)
    ? currentState as HistoryStateRecord
    : {}
}

function pickRouterInternals(state: HistoryStateRecord): HistoryStateRecord | null {
  if (!state.__NA) return null
  return { __NA: state.__NA, __PRIVATE_NEXTJS_INTERNALS_TREE: state.__PRIVATE_NEXTJS_INTERNALS_TREE }
}

function mergeOverlayHistoryState(entry: StorefrontOverlayHistoryEntry | null, routerInternals: HistoryStateRecord | null) {
  const baseState = readHistoryState()
  const withRouter = baseState.__NA || !routerInternals ? baseState : { ...routerInternals, ...baseState }
  const nextState: HistoryStateRecord = { ...withRouter }
  if (entry) nextState[OVERLAY_HISTORY_KEY] = entry
  else delete nextState[OVERLAY_HISTORY_KEY]
  return nextState
}

function createEntryId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function createCartLine(details: CartLineDetails): CartLineItem {
  return { ...details, cartId: createEntryId() }
}

export function StorefrontClient() {
  const [products] = useCatalogProducts()
  const availableProducts = useMemo(() => products.filter((product) => product.stockStatus !== 'sold-out' && product.stockStatus !== 'retired'), [products])
  const featuredProducts = useMemo(() => getFeaturedProducts(availableProducts), [availableProducts])
  const [essentials, setEssentials] = useState(featuredProducts)

  useEffect(() => {
    const idleWindow = window as unknown as {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined

    const shuffleFeaturedProducts = () => {
      try {
        const used: string[] = JSON.parse(sessionStorage.getItem(ESSENTIALS_SHUFFLE_KEY) ?? '[]').filter((value: unknown): value is string => typeof value === 'string')
        const unseen = availableProducts.filter((product) => !used.includes(product.id))
        const source = unseen.length >= 8 ? unseen : availableProducts
        const next = shuffleEssentials(source)
        setEssentials(next)
        const nextIds = [...used.filter((id) => source.some((product) => product.id === id)), ...next.map((product) => product.id)].slice(-Math.max(availableProducts.length, 8))
        sessionStorage.setItem(ESSENTIALS_SHUFFLE_KEY, JSON.stringify(nextIds))
      } catch { setEssentials(featuredProducts) }
    }

    const scheduleShuffle = () => {
      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(shuffleFeaturedProducts, { timeout: 1500 })
      } else {
        timeoutHandle = window.setTimeout(shuffleFeaturedProducts, 0)
      }
    }

    if (document.readyState === 'complete') scheduleShuffle()
    else window.addEventListener('load', scheduleShuffle, { once: true })

    return () => {
      window.removeEventListener('load', scheduleShuffle)
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle)
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle)
    }
  }, [availableProducts, featuredProducts])
  const [storyFilter, setStoryFilter] = useState<StoryFilter>('all')
  const collectionProducts = useMemo(
    () => storyFilter === 'all' ? essentials : availableProducts.filter((product) => matchesStoryFilter(product, storyFilter)),
    [availableProducts, essentials, storyFilter],
  )
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [cartItems, setCartItems] = useState<CartLineItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutItems, setCheckoutItems] = useState<CartLineItem[] | null>(null)
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

  const routerInternalsRef = useRef<HistoryStateRecord | null>(null)
  const closingTimeoutRef = useRef<number | null>(null)

  const captureRouterInternals = useCallback(() => {
    const internals = pickRouterInternals(readHistoryState())
    if (internals) routerInternalsRef.current = internals
  }, [])

  const finishOverlayClose = useCallback(() => {
    if (closingTimeoutRef.current !== null) {
      window.clearTimeout(closingTimeoutRef.current)
      closingTimeoutRef.current = null
    }
    overlayHistoryRef.current = null
    setSelectedProduct(null)
    setIsCartOpen(false)
    const scrollPosition = overlayScrollPositionRef.current
    const returnFocusTarget = overlayReturnFocusRef.current
    overlayReturnFocusRef.current = null

    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - scrollPosition) > 2) window.scrollTo({ top: scrollPosition, behavior: 'instant' })
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus({ preventScroll: true })
    })
  }, [])

  useEffect(() => {
    captureRouterInternals()
    if (readHistoryState()[OVERLAY_HISTORY_KEY]) {
      try { window.history.replaceState(mergeOverlayHistoryState(null, routerInternalsRef.current), '', window.location.href) } catch {}
    }

    const handlePopState = (event: PopStateEvent) => {
      try {
        const state = event.state && typeof event.state === 'object' ? event.state as HistoryStateRecord : null
        if (state) {
          const internals = pickRouterInternals(state)
          if (internals) routerInternalsRef.current = internals
        }
        const activeEntry = overlayHistoryRef.current
        if (!activeEntry) return

        const poppedEntry = state?.[OVERLAY_HISTORY_KEY] as StorefrontOverlayHistoryEntry | undefined
        if (poppedEntry?.id === activeEntry.id) {
          overlayHistoryRef.current = poppedEntry
          return
        }
        finishOverlayClose()
      } catch (error) {
        console.error('[kainchi] popstate handling failed', error)
        finishOverlayClose()
      }
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      captureRouterInternals()
      const activeEntry = overlayHistoryRef.current
      const restoredEntry = readHistoryState()[OVERLAY_HISTORY_KEY] as StorefrontOverlayHistoryEntry | undefined
      if (activeEntry && restoredEntry?.id !== activeEntry.id) finishOverlayClose()
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[kainchi] unhandled rejection', event.reason)
      event.preventDefault()
    }

    const handleAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const hash = anchor.getAttribute('href') ?? '#'
      event.preventDefault()
      if (hash === '#') return
      if (hash === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    document.addEventListener('click', handleAnchorClick)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      document.removeEventListener('click', handleAnchorClick)
      if (closingTimeoutRef.current !== null) window.clearTimeout(closingTimeoutRef.current)
    }
  }, [captureRouterInternals, finishOverlayClose])

  const updateOverlayHistory = useCallback((kind: StorefrontOverlayHistoryEntry['kind']) => {
    captureRouterInternals()
    const currentEntry = overlayHistoryRef.current
    const nextEntry = currentEntry ? { ...currentEntry, kind } : { id: createEntryId(), kind }

    try {
      if (currentEntry) {
        window.history.replaceState(mergeOverlayHistoryState(nextEntry, routerInternalsRef.current), '', window.location.href)
      } else {
        overlayScrollPositionRef.current = window.scrollY
        const activeElement = document.activeElement
        overlayReturnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null
        window.history.pushState(mergeOverlayHistoryState(nextEntry, routerInternalsRef.current), '', window.location.href)
      }
      overlayHistoryRef.current = nextEntry
    } catch (error) {
      console.error('[kainchi] history update failed', error)
      overlayHistoryRef.current = null
    }
  }, [captureRouterInternals])

  const closeActiveOverlay = useCallback(() => {
    if (!overlayHistoryRef.current) {
      setSelectedProduct(null)
      setIsCartOpen(false)
      return
    }
    if (closingTimeoutRef.current !== null) return

    window.history.back()
    closingTimeoutRef.current = window.setTimeout(() => {
      closingTimeoutRef.current = null
      if (overlayHistoryRef.current) finishOverlayClose()
    }, 700)
  }, [finishOverlayClose])

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
    setCheckoutItems([...cartItems, createCartLine(details)])
  }

  return (
    <>
      <AtelierLuxuryLayer />
      <SiteHeader />
      <main>
        <HeroShowcase products={availableProducts} />
        <CollectionStories products={availableProducts} activeFilter={storyFilter} onFilterChange={setStoryFilter} />
        <div className="canvas-band" aria-label="Made with care, worn with feeling"><span>MADE WITH CARE</span><span className="canvas-band-mark"><Scissors aria-hidden="true" /></span><span>WORN WITH FEELING</span></div>
        <FamilyCollectionBanner />
        <VirtualLookbook />
        <ArtworkLibrary products={availableProducts} onCustomize={openProduct} />
        <StudioAllianceProgram />
        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="story-number">K—C<br />2026</div>
          <div className="story-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A small studio with a big heart</p><h2 id="story-title">Not just what<br />you <em>wear.</em><br />What you <em>carry.</em></h2></div>
          <div className="story-aside"><p>We believe the things we wear can say the things we don&apos;t. Kainchi Club is a home for independent art, honest craft, and pieces that feel like they were always yours.</p><a href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club%2C%20tell%20me%20about%20your%20studio." className="story-link">A note to the studio <ArrowUpRight aria-hidden="true" /></a></div>
          <div className="story-texture" aria-hidden="true" />
        </section>
        <PackagingShowcase premiumPackagingSelected={premiumPackagingSelected} onPremiumPackagingChange={changePremiumPackaging} />
        <div className="px-4 pb-10">
          <VaultInteractiveUnboxer products={availableProducts} onSelectProduct={openProduct} />
        </div>
        <FAQSection />
        <LetterboxFeedback />
      </main>
      <footer className="site-footer"><a className="wordmark footer-wordmark" href="#top" aria-label="Kainchi Club home"><Image className="wordmark-logo" src={brandLogo} alt="" width={96} height={96} loading="lazy" decoding="async" /><span>KAINCHI <span className="wordmark-light">CLUB</span></span></a><p>Wear your own art. © 2026 Kainchi Club</p><div className="footer-socials" aria-label="Social media"><a id="social-instagram" href="#" aria-label="Instagram"><SocialIcon network="instagram" /></a><a id="social-facebook" href="#" aria-label="Facebook"><SocialIcon network="facebook" /></a><a id="social-x" href="#" aria-label="X / Twitter"><SocialIcon network="x" /></a></div><div className="footer-links"><a href="https://wa.me/918863075356?text=Hi%20Kainchi%20Club" aria-label="Contact Kainchi Club on WhatsApp">WhatsApp <ArrowUpRight aria-hidden="true" /></a><a href="#top" aria-label="Back to top">Back to top <ArrowUpRight aria-hidden="true" /></a><Link href="/admin" prefetch={false}>Admin Portal <ArrowUpRight aria-hidden="true" /></Link><PolicyModals /></div></footer>
      <OrderCart
        items={cartItems}
        isOpen={isCartOpen}
        onOpenChange={handleCartOpenChange}
        onQuantityChange={(cartId, quantity) => setCartItems((current) => current.map((item) => item.cartId === cartId ? { ...item, quantity } : item))}
        onGiftBoxChange={changeGiftBox}
        onRemove={(cartId) => setCartItems((current) => current.filter((item) => item.cartId !== cartId))}
        onCheckout={() => { if (cartItems.length > 0) setCheckoutItems(cartItems) }}
      />
      <SizeGuideModal />
      <BespokeFitConciergeModal />
      <DeliveryDetailsModal items={checkoutItems} onClose={() => setCheckoutItems(null)} />
      <StudioIntakeModal products={products} />
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

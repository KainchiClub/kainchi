'use client'

import { useEffect, useState } from 'react'
import { ARTWORK_THEMES, GARMENT_TYPES, assignCategoryProductCodes, initialProducts, type ArtworkTheme, type CatalogProduct, type GarmentType } from './catalog'

const STORAGE_KEY = 'kainchi-catalog-v1'

function isGarmentType(value: unknown): value is GarmentType {
  return GARMENT_TYPES.some((garment) => garment === value)
}

function isArtworkTheme(value: unknown): value is ArtworkTheme {
  return ARTWORK_THEMES.some((theme) => theme === value)
}

function isCatalogProduct(value: unknown): value is CatalogProduct {
  if (!value || typeof value !== 'object') return false
  const product = value as Record<string, unknown>
  return typeof product.id === 'string'
    && typeof product.title === 'string'
    && product.title.trim().length > 0
    && isGarmentType(product.garment)
    && isArtworkTheme(product.theme)
    && typeof product.price === 'number'
    && Number.isFinite(product.price)
    && product.price > 0
    && typeof product.image === 'string'
    && (product.image.startsWith('https://') || product.image.startsWith('data:image/'))
}

function readCatalogProducts(serialized: string | null) {
  if (!serialized) return initialProducts

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return initialProducts

    return assignCategoryProductCodes(parsed.filter(isCatalogProduct).map((product) => ({
      ...product,
      stockStatus: product.stockStatus === 'sold-out' ? 'sold-out' as const : product.stockStatus === 'retired' ? 'retired' as const : 'in-stock' as const,
    })))
  } catch {
    return initialProducts
  }
}

export function useCatalogProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadProducts = (serialized: string | null) => {
      setProducts(readCatalogProducts(serialized))
      setIsLoaded(true)
    }

    loadProducts(window.localStorage.getItem(STORAGE_KEY))

    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        loadProducts(event.key === null ? null : event.newValue)
      }
    }

    window.addEventListener('storage', syncAcrossTabs)
    return () => window.removeEventListener('storage', syncAcrossTabs)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [isLoaded, products])

  return [products, setProducts] as const
}

'use client'

import { useEffect, useState } from 'react'
import { ARTWORK_THEMES, GARMENT_TYPES, assignCategoryProductCodes, getNextArticleCode, initialProducts, type ArtworkTheme, type CatalogProduct, type GarmentType } from './catalog'

const STORAGE_KEY = 'kainchi-catalog-v1'
const CATALOG_MIGRATION_KEY = 'kainchi-catalog-shirt-series-v1'
const PERMANENT_CATALOG_PRODUCTS = initialProducts.filter((product) => /^#KC-(?:SHT-\d{2}|CMB-01)$/.test(product.productCode ?? ''))
const PERMANENT_CATALOG_PRODUCT_IDS = new Set(PERMANENT_CATALOG_PRODUCTS.map((product) => product.id))
const LEGACY_TEMPORARY_PRODUCT_IDS = new Set(['kc-art-shirt-embroidery-01', 'kc-art-combo-trouser-shirt-01'])

function isGarmentType(value: unknown): value is CatalogProduct['garment'] {
  return value === 'Co-ords' || GARMENT_TYPES.some((garment) => garment === value)
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

function readCatalogProducts(serialized: string | null, migrateShirtSeries = false) {
  if (!serialized) return initialProducts

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return initialProducts

    const storedProducts = parsed.filter(isCatalogProduct).map((product) => ({
      ...product,
      stockStatus: product.stockStatus === 'sold-out' ? 'sold-out' as const : product.stockStatus === 'retired' ? 'retired' as const : 'in-stock' as const,
    }))
    const retainedProducts = migrateShirtSeries
      ? storedProducts.filter((product) => {
        if (PERMANENT_CATALOG_PRODUCT_IDS.has(product.id)) return true
        return !LEGACY_TEMPORARY_PRODUCT_IDS.has(product.id) && !/^#?KC-(?:SHT-\d{2}|CMB-01)$/i.test(product.productCode?.trim() ?? '')
      })
      : storedProducts
    const storedIds = new Set(retainedProducts.map((product) => product.id))
    const mergedProducts = [...retainedProducts]

    if (migrateShirtSeries) {
      for (const product of PERMANENT_CATALOG_PRODUCTS) {
        if (storedIds.has(product.id)) continue
        mergedProducts.push({ ...product, stockStatus: product.stockStatus ?? 'in-stock', articleCode: getNextArticleCode(mergedProducts, []) })
        storedIds.add(product.id)
      }
    }

    return assignCategoryProductCodes(mergedProducts)
  } catch {
    return initialProducts
  }
}

export function useCatalogProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadProducts = (serialized: string | null) => {
      const migrateShirtSeries = serialized !== null && window.localStorage.getItem(CATALOG_MIGRATION_KEY) !== 'complete'
      const nextProducts = readCatalogProducts(serialized, migrateShirtSeries)
      setProducts(nextProducts)
      if (migrateShirtSeries) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts))
      window.localStorage.setItem(CATALOG_MIGRATION_KEY, 'complete')
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

'use client'

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react'
import {
  ARTWORK_THEMES,
  GARMENT_TYPES,
  assignCategoryProductCodes,
  getNextArticleCode,
  initialProducts,
  type ArtworkTheme,
  type CatalogProduct,
} from './catalog'
import { getSupabaseClient, uploadProductImageToSupabase } from '@/lib/supabase'
import { getBrowserSupabaseClient } from '@/lib/kainchi-crm'
import { syncSecureCatalogCloudState } from '@/app/admin/actions'

const STORAGE_KEY = 'kainchi-catalog-v1'
const CATALOG_MIGRATION_KEY = 'kainchi-catalog-shirt-series-v1'
const CLOUD_CATALOG_STATE_KEY = 'kainchi-catalog-master-v1'
const PERMANENT_CATALOG_PRODUCTS = initialProducts.filter((product) =>
  /^#KC-(?:SHT-\d{2}|CMB-01)$/.test(product.productCode ?? ''),
)
const PERMANENT_CATALOG_PRODUCT_IDS = new Set(PERMANENT_CATALOG_PRODUCTS.map((product) => product.id))
const LEGACY_TEMPORARY_PRODUCT_IDS = new Set(['kc-art-shirt-embroidery-01', 'kc-art-combo-trouser-shirt-01'])

function getActiveSupabaseClient() {
  return getBrowserSupabaseClient() ?? getSupabaseClient()
}

function isGarmentType(value: unknown): value is CatalogProduct['garment'] {
  return value === 'Co-ords' || GARMENT_TYPES.some((garment) => garment === value)
}

function isArtworkTheme(value: unknown): value is ArtworkTheme {
  return ARTWORK_THEMES.some((theme) => theme === value)
}

function isCatalogProduct(value: unknown): value is CatalogProduct {
  if (!value || typeof value !== 'object') return false
  const product = value as Record<string, unknown>
  return (
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    product.title.trim().length > 0 &&
    isGarmentType(product.garment) &&
    isArtworkTheme(product.theme) &&
    typeof product.price === 'number' &&
    Number.isFinite(product.price) &&
    product.price > 0 &&
    typeof product.image === 'string' &&
    (product.image.startsWith('https://') || product.image.startsWith('data:image/'))
  )
}

function readCatalogProducts(serialized: string | null, migrateShirtSeries = false) {
  if (!serialized) return initialProducts

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return initialProducts

    const storedProducts = parsed.filter(isCatalogProduct).map((product) => ({
      ...product,
      stockStatus:
        product.stockStatus === 'sold-out'
          ? ('sold-out' as const)
          : product.stockStatus === 'retired'
            ? ('retired' as const)
            : ('in-stock' as const),
    }))
    const retainedProducts = migrateShirtSeries
      ? storedProducts.filter((product) => {
          if (PERMANENT_CATALOG_PRODUCT_IDS.has(product.id)) return true
          return (
            !LEGACY_TEMPORARY_PRODUCT_IDS.has(product.id) &&
            !/^#?KC-(?:SHT-\d{2}|CMB-01)$/i.test(product.productCode?.trim() ?? '')
          )
        })
      : storedProducts
    const storedIds = new Set(retainedProducts.map((product) => product.id))
    const mergedProducts = [...retainedProducts]

    if (migrateShirtSeries) {
      for (const product of PERMANENT_CATALOG_PRODUCTS) {
        if (storedIds.has(product.id)) continue
        mergedProducts.push({
          ...product,
          stockStatus: product.stockStatus ?? 'in-stock',
          articleCode: getNextArticleCode(mergedProducts, []),
        })
        storedIds.add(product.id)
      }
    }

    return assignCategoryProductCodes(mergedProducts)
  } catch {
    return initialProducts
  }
}

type DbProductRow = {
  id: string
  product_code: string | null
  title: string
  garment: string | null
  theme: string | null
  price: number
  image: string
  stock_status: string | null
}

function mapRowToCatalogProduct(row: DbProductRow): CatalogProduct | null {
  const garment: CatalogProduct['garment'] = isGarmentType(row.garment) ? row.garment : 'Oversized T-Shirt'
  const theme: ArtworkTheme = isArtworkTheme(row.theme) ? row.theme : 'Streetwear'
  const candidate: CatalogProduct = {
    id: row.id,
    productCode: row.product_code ?? undefined,
    title: row.title,
    garment,
    theme,
    price: Number(row.price),
    image: row.image,
    stockStatus:
      row.stock_status === 'sold-out'
        ? 'sold-out'
        : row.stock_status === 'retired'
          ? 'retired'
          : 'in-stock',
  }
  return isCatalogProduct(candidate) ? candidate : null
}

export function useCatalogProducts() {
  const [products, setProductsState] = useState<CatalogProduct[]>(initialProducts)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    let active = true

    const initCatalog = async () => {
      const serialized = window.localStorage.getItem(STORAGE_KEY)
      const migrateShirtSeries = serialized !== null && window.localStorage.getItem(CATALOG_MIGRATION_KEY) !== 'complete'
      const localProducts = readCatalogProducts(serialized, migrateShirtSeries)

      if (active) {
        setProductsState(localProducts)
        if (migrateShirtSeries) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localProducts))
        }
        window.localStorage.setItem(CATALOG_MIGRATION_KEY, 'complete')
      }

      const supabase = getActiveSupabaseClient()
      if (!supabase) return

      try {
        const { data: cloudSnapshot } = await supabase
          .from('store_cloud_state')
          .select('payload')
          .eq('state_key', CLOUD_CATALOG_STATE_KEY)
          .maybeSingle()

        if (cloudSnapshot?.payload && Array.isArray(cloudSnapshot.payload) && cloudSnapshot.payload.length > 0) {
          const parsedCloud = readCatalogProducts(JSON.stringify(cloudSnapshot.payload), false)
          if (parsedCloud.length > 0 && active) {
            setProductsState(parsedCloud)
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedCloud))
            return
          }
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true })

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data
            .map((row) => mapRowToCatalogProduct(row as DbProductRow))
            .filter((item): item is CatalogProduct => item !== null)

          if (mapped.length > 0 && active) {
            const normalized = assignCategoryProductCodes(mapped)
            setProductsState(normalized)
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
          }
        }
      } catch {}
    }

    void initCatalog()

    const supabase = getActiveSupabaseClient()
    const channel = supabase
      ? supabase
          .channel('kainchi-cloud-catalog-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'store_cloud_state' },
            (payload) => {
              if (isSyncingRef.current || !active) return
              const record = payload.new as { state_key?: string; payload?: unknown } | undefined
              if (record?.state_key === CLOUD_CATALOG_STATE_KEY && Array.isArray(record.payload)) {
                const synced = readCatalogProducts(JSON.stringify(record.payload), false)
                if (synced.length > 0) {
                  setProductsState(synced)
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(synced))
                }
              }
            },
          )
          .subscribe()
      : null

    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setProductsState(readCatalogProducts(event.newValue, false))
      }
    }

    window.addEventListener('storage', syncAcrossTabs)
    return () => {
      active = false
      window.removeEventListener('storage', syncAcrossTabs)
      if (channel && supabase) {
        void supabase.removeChannel(channel)
      }
    }
  }, [])

  const setProducts = useCallback((updater: SetStateAction<CatalogProduct[]>) => {
    setProductsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

      void (async () => {
        isSyncingRef.current = true
        try {
          const cloudReadyProducts = await Promise.all(
            next.map(async (item) => {
              if (item.image.startsWith('data:image/')) {
                const publicUrl = await uploadProductImageToSupabase(item.image, item.id)
                if (publicUrl) {
                  return { ...item, image: publicUrl }
                }
              }
              return item
            }),
          )

          const hasNewUrls = cloudReadyProducts.some((item, idx) => item.image !== next[idx]?.image)
          if (hasNewUrls) {
            setProductsState(cloudReadyProducts)
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudReadyProducts))
          }

          await syncSecureCatalogCloudState(cloudReadyProducts)
        } catch {
          // Non-blocking sync
        } finally {
          isSyncingRef.current = false
        }
      })()

      return next
    })
  }, [])

  return [products, setProducts] as const
}

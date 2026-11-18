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
  type GarmentType,
} from './catalog'
import { getSupabaseClient, uploadProductImageToSupabase } from '@/lib/supabase'

const STORAGE_KEY = 'kainchi-catalog-v1'
const CATALOG_MIGRATION_KEY = 'kainchi-catalog-shirt-series-v1'
const PERMANENT_CATALOG_PRODUCTS = initialProducts.filter((product) =>
  /^#KC-(?:SHT-\d{2}|CMB-01)$/.test(product.productCode ?? ''),
)
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

function mapCatalogProductToRow(product: CatalogProduct): DbProductRow {
  return {
    id: product.id,
    product_code: product.productCode ?? null,
    title: product.title,
    garment: product.garment,
    theme: product.theme,
    price: Math.round(product.price),
    image: product.image,
    stock_status: product.stockStatus ?? 'in-stock',
  }
}

export function useCatalogProducts() {
  const [products, setProductsState] = useState<CatalogProduct[]>(initialProducts)
  const [isLoaded, setIsLoaded] = useState(false)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    let active = true

    const initCatalog = async () => {
      // 1. पहले तेज़ी से localStorage लोड करें ताकि स्क्रीन तुरंत दिखे
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

      // 2. अब Supabase Cloud Database से सिंक करें
      const supabase = getSupabaseClient()
      if (!supabase) {
        if (active) setIsLoaded(true)
        return
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true })

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            const mapped = data
              .map((row) => mapRowToCatalogProduct(row as DbProductRow))
              .filter((item): item is CatalogProduct => item !== null)

            if (mapped.length > 0 && active) {
              const normalized = assignCategoryProductCodes(mapped)
              setProductsState(normalized)
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
            }
          } else {
            // अगर Supabase टेबल पहली बार खाली है, तो मौजूदा कैटलॉग क्लाउड में सीड करें
            const rowsToSeed = localProducts.map(mapCatalogProductToRow)
            await supabase.from('products').upsert(rowsToSeed, { onConflict: 'id' })
          }
        }
      } catch (err) {
        console.error('Supabase catalog sync error:', err)
      } finally {
        if (active) setIsLoaded(true)
      }
    }

    void initCatalog()

    // 3. Realtime listener: किसी भी डिवाइस पर Admin बदलाव करे तो तुरंत लाइव अपडेट हो
    const supabase = getSupabaseClient()
    const channel = supabase
      ? supabase
          .channel('kainchi-products-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            async () => {
              if (isSyncingRef.current) return
              const { data } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: true })
              if (Array.isArray(data) && data.length > 0 && active) {
                const mapped = data
                  .map((row) => mapRowToCatalogProduct(row as DbProductRow))
                  .filter((item): item is CatalogProduct => item !== null)
                if (mapped.length > 0) {
                  const normalized = assignCategoryProductCodes(mapped)
                  setProductsState(normalized)
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
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

  // जब Admin कोई उत्पाद जोड़े, बदले, या हटाए तो स्थानीय + Supabase Cloud दोनों में सेव करें
  const setProducts = useCallback((updater: SetStateAction<CatalogProduct[]>) => {
    setProductsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

      const supabase = getSupabaseClient()
      if (supabase) {
        void (async () => {
          isSyncingRef.current = true
          try {
            // 1. अगर कोई base64 फ़ोटो अपलोड हुई है तो पहले Supabase Storage बकेट में अपलोड करें
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

            // अगर कोई base64 URL क्लाउड URL में बदला है तो स्टेट भी अपडेट करें
            const hasNewUrls = cloudReadyProducts.some((item, idx) => item.image !== next[idx]?.image)
            if (hasNewUrls) {
              setProductsState(cloudReadyProducts)
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudReadyProducts))
            }

            // 2. हटाए गए उत्पादों को Supabase से भी हटाएं
            const nextIds = new Set(cloudReadyProducts.map((p) => p.id))
            const deletedIds = prev.filter((p) => !nextIds.has(p.id)).map((p) => p.id)
            if (deletedIds.length > 0) {
              await supabase.from('products').delete().in('id', deletedIds)
            }

            // 3. सभी उत्पादों को Supabase टेबल में Upsert (सेव/अपडेट) करें
            const rows = cloudReadyProducts.map(mapCatalogProductToRow)
            if (rows.length > 0) {
              await supabase.from('products').upsert(rows, { onConflict: 'id' })
            }
          } catch (err) {
            console.error('Supabase write sync error:', err)
          } finally {
            isSyncingRef.current = false
          }
        })()
      }

      return next
    })
  }, [])

  return [products, setProducts] as const
}

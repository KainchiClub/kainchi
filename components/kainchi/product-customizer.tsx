'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  Minus,
  Pause,
  Play,
  Ruler,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import { formatRupees, type CatalogProduct } from './catalog'
import { openSizeGuide } from './storefront-events'
import { FABRIC_COLORS, GIFT_BOX_PRICE, MAX_ORDER_QUANTITY, type CartLineDetails, type FabricColor } from './order'

const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

type StylistVariant = {
  name: string
  fabricNote: string
  fitTip: string
  imageUrl: string
  swatchHex: string
}

type StylistCategory = {
  slot: 'Bottoms' | 'Footwear' | 'Accent'
  primaryLabel: string
  variants: StylistVariant[]
}

function getSmartOutfitCategories(product: CatalogProduct): StylistCategory[] {
  const g = (product?.garment ?? '').toLowerCase()
  const t = (product?.theme ?? '').toLowerCase()

  if (g.includes('jacket') || g.includes('denim') || g.includes('bomber')) {
    return [
      {
        slot: 'Bottoms',
        primaryLabel: 'Selvedge Denim & Tailored Trousers',
        variants: [
          {
            name: '14 oz Raw Indigo Straight Denim',
            fabricNote: 'Heavyweight Japanese-weave selvedge denim',
            fitTip: 'Creates a crisp structured silhouette under cropped outerwear.',
            imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#1e293b',
          },
          {
            name: 'Charcoal Pleated Wide-Leg Trousers',
            fabricNote: 'Brushed wool-blend twill drape',
            fitTip: 'Elevates casual jackets into a sharp evening atelier look.',
            imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#27272a',
          },
          {
            name: 'Vintage Washed Black Carpenter Pants',
            fabricNote: 'Enzyme-washed 12 oz duck canvas',
            fitTip: 'Adds utilitarian streetwear attitude with relaxed ankle stack.',
            imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#18181b',
          },
        ],
      },
      {
        slot: 'Footwear',
        primaryLabel: 'Leather Boots & Heritage Trainers',
        variants: [
          {
            name: 'Espresso Leather Chelsea Boots',
            fabricNote: 'Full-grain calfskin with stacked leather sole',
            fitTip: 'Clean ankle line that pairs effortlessly with straight denim.',
            imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#3b2314',
          },
          {
            name: 'Matte Black Chunky Derby Shoes',
            fabricNote: 'Brushed box leather with lugged sole',
            fitTip: 'Brings modern runway weight to structured jackets.',
            imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#111111',
          },
          {
            name: 'Off-White Vintage Court Sneakers',
            fabricNote: 'Tumbled leather with suede toe cap',
            fitTip: 'Lightens dark outerwear for effortless daytime wear.',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#f5efe6',
          },
        ],
      },
      {
        slot: 'Accent',
        primaryLabel: 'Atelier Hardware & Eyewear',
        variants: [
          {
            name: 'Brushed Silver Cuff & Signet Ring',
            fabricNote: '925 sterling-finish oxidized metal',
            fitTip: 'Subtle metallic gleam at the wrist without overpowering artwork.',
            imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#a1a1aa',
          },
          {
            name: 'Structured Crossbody Leather Sling',
            fabricNote: 'Pebbled full-grain leather with matte clasp',
            fitTip: 'Keeps daily essentials secure while layering.',
            imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#1c1917',
          },
          {
            name: 'Architectural Acetate Sunglasses',
            fabricNote: 'Hand-polished tortoiseshell frame with UV400 tint',
            fitTip: 'Sharpens the neckline and frames the collar.',
            imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#451a03',
          },
        ],
      },
    ]
  }

  if (g.includes('shirt') || g.includes('polo')) {
    return [
      {
        slot: 'Bottoms',
        primaryLabel: 'Pleated Linen & Tailored Denim',
        variants: [
          {
            name: 'Pleated Off-White Linen Trousers',
            fabricNote: 'Breathable 220 GSM European flax-linen blend',
            fitTip: 'Creates high-contrast resort luxury with dark or embroidered shirts.',
            imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#f3ede2',
          },
          {
            name: 'Tailored Jet-Black Straight Denim',
            fabricNote: '13 oz structured cotton denim, clean hem',
            fitTip: 'Keeps the focus entirely on the shirt’s chest & back artwork.',
            imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
            swatchHex: '#18181b',
          },
          {
            name: 'Sandstone Relaxed Chino Trousers',
            fabricNote: 'Peached organic cotton twill',
            fitTip: 'Warm earthy tone that complements embroidery threads.',
            imageUrl: '

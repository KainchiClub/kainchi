'use client'

import { Scissors } from 'lucide-react'
import { fallbackImageOnError, resolveDriveImageUrl } from '@/lib/utils'
import type { CatalogProduct } from './catalog'
import { requestStudioIntake } from './studio-intake'

export type StoryFilter = 'all' | 'hoodies' | 'tees' | 'polos'

export const STORY_FILTER_PATTERNS: Record<Exclude<StoryFilter, 'all'>, RegExp> = {
  hoodies: /hoodie/i,
  tees: /tee|t-shirt/i,
  polos: /polo|\bshirts\b/i,
}

const STORIES: { id: StoryFilter | 'studio'; label: string }[] = [
  { id: 'all', label: 'All Pieces' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'tees', label: 'Oversized Tees' },
  { id: 'polos', label: 'Polos' },
  { id: 'studio', label: 'Custom Studio' },
]

export function matchesStoryFilter(product: CatalogProduct, filter: StoryFilter) {
  return filter === 'all' || STORY_FILTER_PATTERNS[filter].test(product.garment)
}

export function CollectionStories({ products, activeFilter, onFilterChange }: {
  products: CatalogProduct[]
  activeFilter: StoryFilter
  onFilterChange: (filter: StoryFilter) => void
}) {
  function select(id: StoryFilter | 'studio') {
    if (id === 'studio') {
      requestStudioIntake({})
      return
    }
    onFilterChange(id)
    requestAnimationFrame(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <nav className="bg-[#14100e] px-[clamp(22px,7.2vw,112px)] py-6" aria-label="Shop by collection">
      <ul className="flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-8">
        {STORIES.map((story) => {
          const isStudio = story.id === 'studio'
          const isActive = !isStudio && activeFilter === story.id
          const cover = isStudio ? undefined : products.find((product) => matchesStoryFilter(product, story.id as StoryFilter))
          return (
            <li key={story.id} className="shrink-0">
              <button
                type="button"
                onClick={() => select(story.id)}
                aria-pressed={isStudio ? undefined : isActive}
                className="group flex w-[76px] flex-col items-center gap-2 text-center focus-visible:outline-none"
              >
                <span className={`flex size-[68px] items-center justify-center rounded-full border p-[3px] transition-[border-color,box-shadow,transform] duration-300 group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-[#D4AF37]/60 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${isActive ? 'border-2 border-[#D4AF37] shadow-[0_0_18px_rgb(212_175_55/35%)]' : 'border-[#D4AF37]/70'}`}>
                  <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[#221a16]">
                    {cover
                      ? <img src={resolveDriveImageUrl(cover.image, 200)} alt="" loading="lazy" decoding="async" draggable={false} onError={fallbackImageOnError} className="size-full object-cover" />
                      : <Scissors aria-hidden="true" className="size-6 text-[#D4AF37]" strokeWidth={1.4} />}
                  </span>
                </span>
                <span className={`text-[9px] font-bold uppercase leading-tight tracking-[0.12em] transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-[#e9dfd0] group-hover:text-[#D4AF37]'}`}>{story.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

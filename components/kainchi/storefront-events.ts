export const SIZE_GUIDE_EVENT = 'kainchi:size-guide'
export const CATALOG_FILTER_EVENT = 'kainchi:catalog-filter'

export type GarmentGroup = 'all' | 'tees' | 'fleece' | 'outerwear'

export const GARMENT_GROUPS: Record<Exclude<GarmentGroup, 'all'>, { label: string; pattern: RegExp }> = {
  tees: { label: 'Heavyweight Tees', pattern: /tee|t-shirt/i },
  fleece: { label: 'Hoodies & Sweatshirts', pattern: /hoodie|sweatshirt|fleece/i },
  outerwear: { label: 'Outerwear & Jackets', pattern: /jacket/i },
}

export function openSizeGuide() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SIZE_GUIDE_EVENT))
}

export function filterCatalog(group: GarmentGroup) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<GarmentGroup>(CATALOG_FILTER_EVENT, { detail: group }))
}

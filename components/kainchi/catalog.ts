export const GARMENT_TYPES = [
  'Fleece Hoodie',
  'Oversized T-Shirt',
  'Heavy Boxy Tee',
  'Zip-up Hoodie',
  'Bomber Jacket',
  'Cap',
] as const

export const ARTWORK_THEMES = [
  'Divine & Spiritual',
  'Brahmand',
  'Aesthetic',
  'Nature & Scenic',
  'Automotive/Cars',
  'Abstract',
  'Typography',
] as const

export type GarmentType = (typeof GARMENT_TYPES)[number]
export type ArtworkTheme = (typeof ARTWORK_THEMES)[number]

export type CatalogProduct = {
  id: string
  title: string
  garment: GarmentType
  theme: ArtworkTheme
  price: number
  image: string
  uploaded?: boolean
}

export const initialProducts: CatalogProduct[] = [
  { id: 'boxy-tee', title: 'Sun in the making', garment: 'Heavy Boxy Tee', theme: 'Divine & Spiritual', price: 1299, image: '/products/boxy-tee.png' },
  { id: 'oversized-tee', title: 'Small universe', garment: 'Oversized T-Shirt', theme: 'Brahmand', price: 1199, image: '/products/oversized-tee.png' },
  { id: 'fleece-hoodie', title: 'A softer kind of wild', garment: 'Fleece Hoodie', theme: 'Nature & Scenic', price: 2499, image: '/products/fleece-hoodie.png' },
  { id: 'zip-hoodie', title: 'Where the sky meets earth', garment: 'Zip-up Hoodie', theme: 'Aesthetic', price: 2899, image: '/products/zip-hoodie.png' },
  { id: 'bomber-jacket', title: 'After hours / 01', garment: 'Bomber Jacket', theme: 'Automotive/Cars', price: 3999, image: '/products/bomber-jacket.png' },
  { id: 'cap', title: 'Day & night', garment: 'Cap', theme: 'Abstract', price: 999, image: '/products/cap.png' },
]

export function formatRupees(amount: number) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`
}

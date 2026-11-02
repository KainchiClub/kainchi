export const GARMENT_TYPES = [
  'Fleece Hoodie',
  'Oversized T-Shirt',
  'Shirts',
  'Heavy Boxy Tee',
  'Zip-up Hoodie',
  'Bomber Jacket',
  'Leather Jacket',
  'Biker Jacket',
  'Denim Jacket',
  'Denim Jeans',
  'Printed Sweatshirt',
] as const

export const ARTWORK_THEMES = [
  'Divine & Spiritual',
  'Brahmand',
  'Nature & Scenic',
  'Abstract',
  'Streetwear',
  'Embroidery / Threadwork',
] as const

export type GarmentType = (typeof GARMENT_TYPES)[number]
export type ArtworkTheme = (typeof ARTWORK_THEMES)[number]

export type PricingTier = 'minimal' | 'intricate'

export function getSmartPricingTier(product: Pick<CatalogProduct, 'garment' | 'theme' | 'title'>): PricingTier {
  const label = `${product.garment} ${product.theme} ${product.title}`.toLowerCase()
  return /embroider|thread|dense|painted|archival|sacred|divine|wild|cosmic|flame|mandala|intricate|full/.test(label) ? 'intricate' : 'minimal'
}

export function getSmartPrice(product: Pick<CatalogProduct, 'garment' | 'theme' | 'title'>) {
  const tier = getSmartPricingTier(product)
  const garment = product.garment.toLowerCase()
  if (/jacket/.test(garment)) return tier === 'intricate' ? 6999 : 4499
  if (/hoodie/.test(garment)) return tier === 'intricate' ? 2999 : 1999
  if (/sweatshirt/.test(garment)) return tier === 'intricate' ? 2599 : 1699
  if (/tee|t-shirt|shirt/.test(garment)) return tier === 'intricate' ? 1199 : 799
  return tier === 'intricate' ? 6999 : 4499
}

export type StockStatus = 'in-stock' | 'sold-out' | 'retired'

export type CatalogProduct = {
  id: string
  title: string
  productCode?: string
  articleCode?: string
  garment: GarmentType | 'Co-ords'
  theme: ArtworkTheme
  price: number
  image: string
  stockStatus?: StockStatus
  uploaded?: boolean
}

export function getProductCodePrefix(product: Pick<CatalogProduct, 'garment' | 'title'>) {
  const garment = product.garment.toLowerCase()
  const label = `${garment} ${product.title.toLowerCase()}`

  if (/\b(combo|co[\s-]?ord|set)\b/.test(label)) return 'CMB'
  if (garment === 'denim jeans') return 'DNM'
  if (/hoodie/.test(garment)) return 'HOD'
  if (/sweatshirt/.test(garment)) return 'SWT'
  if (/jacket/.test(garment)) return 'JCK'
  if (/tee|t-shirt/.test(garment)) return 'TEE'
  return 'TEE'
}

export function assignCategoryProductCodes(products: readonly CatalogProduct[]) {
  const reservedCodes = new Set(products.map((product) => product.productCode?.trim().toUpperCase()).filter(Boolean))
  const generatedCodes = new Set<string>()
  const nextByPrefix = new Map<string, number>()

  return products.map((product) => {
    const savedCode = product.productCode?.trim()
    if (savedCode) return { ...product, productCode: savedCode }

    const prefix = getProductCodePrefix(product)
    let sequence = nextByPrefix.get(prefix) ?? 1
    let productCode = `#KC-${prefix}-${String(sequence).padStart(2, '0')}`

    while (reservedCodes.has(productCode.toUpperCase()) || generatedCodes.has(productCode.toUpperCase())) {
      sequence += 1
      productCode = `#KC-${prefix}-${String(sequence).padStart(2, '0')}`
    }

    nextByPrefix.set(prefix, sequence + 1)
    generatedCodes.add(productCode.toUpperCase())
    return { ...product, productCode }
  })
}

export function getNextArticleCode(products: readonly CatalogProduct[], retiredCodes: readonly string[]) {
  const used = new Set([...products.map((product) => product.articleCode), ...retiredCodes].filter(Boolean).map((code) => code!.toUpperCase()))
  let sequence = 1
  while (used.has(`KC-ART-${String(sequence).padStart(3, '0')}`)) sequence += 1
  return `KC-ART-${String(sequence).padStart(3, '0')}`
}

export function getNextProductCode(products: readonly CatalogProduct[], garment: CatalogProduct['garment'], title: string) {
  const prefix = getProductCodePrefix({ garment, title })
  const usedCodes = new Set(products.map((product) => product.productCode?.trim().toUpperCase()).filter(Boolean))
  let sequence = 1
  let productCode = `#KC-${prefix}-${String(sequence).padStart(2, '0')}`

  while (usedCodes.has(productCode.toUpperCase())) {
    sequence += 1
    productCode = `#KC-${prefix}-${String(sequence).padStart(2, '0')}`
  }

  return productCode
}

export const FEATURED_ARTWORK_IDS = [
  'drive-01',
  'drive-02',
  'drive-03',
  'drive-04',
  'drive-05',
  'drive-06',
  'drive-07',
  'drive-08',
] as const

export function getFeaturedProducts(products: CatalogProduct[]) {
  const available = products.filter((product) => product.stockStatus !== 'sold-out' && product.stockStatus !== 'retired')
  const featured = FEATURED_ARTWORK_IDS.flatMap((id) => {
    const product = available.find((item) => item.id === id)
    return product ? [product] : []
  })
  const featuredIds = new Set(featured.map((product) => product.id))
  return [...featured, ...available.filter((product) => !featuredIds.has(product.id))].slice(0, FEATURED_ARTWORK_IDS.length)
}

function driveImage(fileId: string) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000-rw`
}

const catalogSeed: CatalogProduct[] = [
  { id: 'drive-01', title: 'Owl in Bloom', garment: 'Oversized T-Shirt', theme: 'Nature & Scenic', price: 1699, image: driveImage('1wePskySZauoxgUSKc8eTdElz9jv4JkB8') },
  { id: 'drive-02', title: 'Orbit Within', garment: 'Fleece Hoodie', theme: 'Brahmand', price: 2499, image: driveImage('1x9Ej_aTNmiEPzrXT7-PAw2NCNXtEDEM2') },
  { id: 'drive-03', title: 'Moonlit Valley', garment: 'Fleece Hoodie', theme: 'Nature & Scenic', price: 2499, image: driveImage('1Id-SzIYmChj5Jkavm1vwe_IECfcx7u08') },
  { id: 'drive-04', title: 'Painted Denim', garment: 'Denim Jeans', theme: 'Streetwear', price: 2999, image: driveImage('1iwf24k12cLM7FSs3fAc3xZgmhbsLguJo') },
  { id: 'drive-05', title: 'Prints in Motion', garment: 'Heavy Boxy Tee', theme: 'Streetwear', price: 1699, image: driveImage('1To7FK1W_-8Fzw19Mo8xVw1EwMeO9q5uZ') },
  { id: 'drive-06', title: 'Midnight Layers', garment: 'Bomber Jacket', theme: 'Streetwear', price: 3999, image: driveImage('1_UCr3gQM4hAD9IkfU-Sw7-ROkqnJisNe') },
  { id: 'drive-07', title: 'Wild at Heart Jacket', garment: 'Bomber Jacket', theme: 'Abstract', price: 3999, image: driveImage('1L6FdQJ0beKIz-g4kQ2LbSUyjRVYyizZm') },
  { id: 'drive-08', title: 'Midnight Mandala', garment: 'Bomber Jacket', theme: 'Brahmand', price: 4499, image: driveImage('14nr2WlT7log-eLKWbbhNUFM7msizUrMn') },
  { id: 'drive-09', title: 'Electric Denim', garment: 'Denim Jeans', theme: 'Streetwear', price: 2999, image: driveImage('1BsKuDOE0gq4YGnL15VEHd2d09LUDFzPb') },
  { id: 'drive-10', title: 'Blossom Club Hoodies', garment: 'Fleece Hoodie', theme: 'Nature & Scenic', price: 2499, image: driveImage('1zRqSPeKtZwt3ZD5_CBMpVYlciHyukqdt') },
  { id: 'drive-11', title: 'Moon Garden Tees', garment: 'Oversized T-Shirt', theme: 'Nature & Scenic', price: 1699, image: driveImage('1aFXQk_zzDlhS3e_rFn1izdc6iRdWCWZh') },
  { id: 'drive-12', title: 'Patchwork Trail', garment: 'Denim Jeans', theme: 'Streetwear', price: 2999, image: driveImage('1fBPpXcGPDE0g7lmxXd9gdfCmIOLurxiM') },
  { id: 'drive-13', title: 'Canvas of Denim', garment: 'Denim Jeans', theme: 'Streetwear', price: 2999, image: driveImage('1fohsnvahAQvEBryvWf090yYvJFx9mTpF') },
  { id: 'drive-14', title: 'Shakti in Crimson', garment: 'Heavy Boxy Tee', theme: 'Divine & Spiritual', price: 1699, image: driveImage('1vpKzAquvP-AwT255suUuiI0_P0lDFz30') },
  { id: 'drive-15', title: 'Sacred Geometry', garment: 'Fleece Hoodie', theme: 'Brahmand', price: 2499, image: driveImage('1dwGvaO3dA6KjU623s5LuBkV9r1ShWVBF') },
  { id: 'drive-16', title: 'Garden Reverie Set', garment: 'Printed Sweatshirt', theme: 'Nature & Scenic', price: 2499, image: driveImage('1KkCvT9ixdT6J2kPPoK-zqMdd1ND63r02') },
  { id: 'drive-17', title: 'After Dark Graphics', garment: 'Fleece Hoodie', theme: 'Streetwear', price: 2499, image: driveImage('1RxxEf39oavlhQSbg1G0c3ZVfl_JPHqVA') },
  { id: 'drive-18', title: 'The Rorschach Jacket', garment: 'Bomber Jacket', theme: 'Abstract', price: 3999, image: driveImage('1oycZtpBjuRZx3zUNfQR99toVuwOL0BJX') },
  { id: 'drive-19', title: 'Ganesh Garden', garment: 'Fleece Hoodie', theme: 'Divine & Spiritual', price: 2499, image: driveImage('1wTXVIzb5LfX9Eol0YGVorIAtGpvnX5Yn') },
  { id: 'drive-20', title: 'Forest After Hours', garment: 'Fleece Hoodie', theme: 'Nature & Scenic', price: 2499, image: driveImage('1gjnF3sq67xJ9GV2T7kCG-nOdh8cVrzi9') },
  { id: 'drive-21', title: 'Cosmic Guardian', garment: 'Bomber Jacket', theme: 'Divine & Spiritual', price: 3999, image: driveImage('1B9Y5czqId8nT_AA9ZieE8SZBSjJfmh8I') },
  { id: 'drive-22', title: 'Orbit Emblem', garment: 'Bomber Jacket', theme: 'Brahmand', price: 3999, image: driveImage('19B--ISrXmv7jYxQjFRwu5vUsQthd8oYn') },
  { id: 'drive-23', title: 'Petal Study', garment: 'Heavy Boxy Tee', theme: 'Nature & Scenic', price: 1699, image: driveImage('1vm5y2neKm9TZ7HLimrYOpi3EsPYTcwZ_') },
  { id: 'drive-24', title: 'Wild Terrain Denim', garment: 'Denim Jacket', theme: 'Nature & Scenic', price: 3499, image: driveImage('1KRgYJMNSx9bLndTYv1zbLRwIbDhvuvIU') },
  { id: 'drive-25', title: 'Solar Club', garment: 'Oversized T-Shirt', theme: 'Abstract', price: 1699, image: driveImage('1CJ1G6S1THp2G2og10m_FpDUD51YC5tjP') },
  { id: 'drive-26', title: 'Devi in Blue', garment: 'Fleece Hoodie', theme: 'Divine & Spiritual', price: 2499, image: driveImage('1yO0K2-JqyZu1x5os2cqTFpJ7PD1Q3rHG') },
  { id: 'drive-27', title: 'Wildflower Lounge', garment: 'Printed Sweatshirt', theme: 'Nature & Scenic', price: 2499, image: driveImage('1MZYEPXAcALNW7f5RnU333Un3K2tYnthq') },
  { id: 'drive-28', title: 'Owl in Bloom / 02', garment: 'Oversized T-Shirt', theme: 'Nature & Scenic', price: 1699, image: driveImage('1j9bOOMS6v-MYb3j5Kf7MJePym-Aujn7y') },
  { id: 'drive-29', title: 'Kainchi Mark', garment: 'Heavy Boxy Tee', theme: 'Streetwear', price: 1699, image: driveImage('1uNGccal8AtF56RwFcPfbK9cbF1I5kMmR') },
  { id: 'drive-30', title: 'Astral Hoodie', garment: 'Zip-up Hoodie', theme: 'Brahmand', price: 2899, image: driveImage('1chNec24eTsCs9t1x_8FJyxjvf11MHrbr') },
  { id: 'drive-31', title: 'Celestial Badge', garment: 'Fleece Hoodie', theme: 'Brahmand', price: 2499, image: driveImage('1H5xV5vyJ2IL4hqM_ANaRMMsl8dSXNtoX') },
  { id: 'drive-32', title: 'Night Sky Bomber', garment: 'Bomber Jacket', theme: 'Brahmand', price: 3999, image: driveImage('1LvvMq5HQo6CoRgrwexSz5zjbYjY8pgf3') },
  { id: 'drive-33', title: 'Earth & Spirit', garment: 'Zip-up Hoodie', theme: 'Divine & Spiritual', price: 2899, image: driveImage('1KzTeFcCJomEmmg6A3O_LuoGd_8Sn8QYZ') },
  { id: 'drive-34', title: 'Temple in the Night', garment: 'Fleece Hoodie', theme: 'Divine & Spiritual', price: 2499, image: driveImage('1EaJ2X8kEyEUbMB40A9c_Gthaih3udkfA') },
  { id: 'drive-35', title: 'Solar Bloom', garment: 'Heavy Boxy Tee', theme: 'Abstract', price: 1699, image: driveImage('1YDfkXPxuzJ2HiljNheik9ngNC3j3ThAg') },
  { id: 'drive-36', title: 'Divine Muse', garment: 'Heavy Boxy Tee', theme: 'Divine & Spiritual', price: 1699, image: driveImage('1nd7UkFYpLqU39H5-td4cIhAslIViubLy') },
  { id: 'drive-37', title: 'Mountain Horizon', garment: 'Oversized T-Shirt', theme: 'Nature & Scenic', price: 1699, image: driveImage('1ggwPTX2W4QgZbNFRVqihTrZVaDw1_NzG') },
  { id: 'drive-38', title: 'Mahadev Flame', garment: 'Heavy Boxy Tee', theme: 'Divine & Spiritual', price: 1699, image: driveImage('1sBgF-lsR5MtMv2v7SDckCUdNQqnXcOGn') },
  { id: 'drive-39', title: 'Street Poster', garment: 'Heavy Boxy Tee', theme: 'Streetwear', price: 1699, image: driveImage('1n3V9DEHB6HyhXyNTJlktYoBdgSw1TK2I') },
  { id: 'kc-shirt-embroidery-01', productCode: '#KC-SHT-01', title: 'Shirt Embroidery 01', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1qHY3FW2f4I3S2rhGVLDQCehR0CrZdoZ4'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-02', productCode: '#KC-SHT-02', title: 'Shirt Embroidery 02', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1zy-rXUJocYRr6pj0XhB-_qQMTFta_rFa'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-03', productCode: '#KC-SHT-03', title: 'Shirt Embroidery 03', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1H_2Uu2X_8qD5fNGSNKxbGTxMR2iCjib-'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-04', productCode: '#KC-SHT-04', title: 'Shirt Embroidery 04', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1VUMMAjz-HyzDBlwRIrSs1i9L1FF-Q91b'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-05', productCode: '#KC-SHT-05', title: 'Shirt Embroidery 05', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1d48bvcj_m6FmvHu73NUge08ohJDj97T2'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-06', productCode: '#KC-SHT-06', title: 'Shirt Embroidery 06', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1dWqew_hqSHSxel32v2lXMIm5kXIaq5tX'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-07', productCode: '#KC-SHT-07', title: 'Shirt Embroidery 07', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1qOAn0uxa1r7OiBSJhsn0976jUq0rSNmg'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-08', productCode: '#KC-SHT-08', title: 'Shirt Embroidery 08', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1N2ajWgYo4U555y6wOOuI3cbBAVkHUyoY'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-09', productCode: '#KC-SHT-09', title: 'Shirt Embroidery 09', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('17AENN7gDyZS0YVMFTJTfhH6YyewMffWJ'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-10', productCode: '#KC-SHT-10', title: 'Shirt Embroidery 10', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1abQIQM1NF0MycSMIX44pR9EG9uxU7adk'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-11', productCode: '#KC-SHT-11', title: 'Shirt Embroidery 11', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1tp9fdq7WdzxKOh0DbAuzfLywuibAQmt5'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-12', productCode: '#KC-SHT-12', title: 'Shirt Embroidery 12', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('12_X_p8LjY7ckgKthiXthVT1BB9AP-xuU'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-13', productCode: '#KC-SHT-13', title: 'Shirt Embroidery 13', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1lFZpkI-QIn2LJFALmkFbSraII8vSajmF'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-14', productCode: '#KC-SHT-14', title: 'Shirt Embroidery 14', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1-X0liT9tduCTYQifSsp3gIv8sQiojy5i'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-15', productCode: '#KC-SHT-15', title: 'Shirt Embroidery 15', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1unW0YWsIszJIIpPkwTdO0oP9YDn2j663'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-16', productCode: '#KC-SHT-16', title: 'Shirt Embroidery 16', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1WRm6AYLGa9XM2EuNL0d8dl5WUxvQ0q_G'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-17', productCode: '#KC-SHT-17', title: 'Shirt Embroidery 17', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1OYSaOqN8_UTjbWA46FJB37TiyV1lNDaR'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-18', productCode: '#KC-SHT-18', title: 'Shirt Embroidery 18', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1K57-VgZVRy-PwJ-SS8t9zE8_Wy0_xiKx'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-19', productCode: '#KC-SHT-19', title: 'Shirt Embroidery 19', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1mf5k4Xe2oCStZrUwiHfcIT1beqNeFZA_'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-20', productCode: '#KC-SHT-20', title: 'Shirt Embroidery 20', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1LG3_CyhnOvHNLZCenWk-gWP3iB62pt3l'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-21', productCode: '#KC-SHT-21', title: 'Shirt Embroidery 21', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1OJNNq5tAREzGOaKwGBatGtxpHFZPudWw'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-22', productCode: '#KC-SHT-22', title: 'Shirt Embroidery 22', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1p_ru_p1tpJ-NpkrWbWo_6T0Qz7HsddAG'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-23', productCode: '#KC-SHT-23', title: 'Shirt Embroidery 23', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1GjTaOrds6fjscXjSWnq58qRN8IcM-u7U'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-24', productCode: '#KC-SHT-24', title: 'Shirt Embroidery 24', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1n5WJNyXMsQlffN-MJ-IWTcUy1ajx1IF9'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-25', productCode: '#KC-SHT-25', title: 'Shirt Embroidery 25', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1VFr_dxfIeoGSbs8ywmbOopFBO0OxRBDU'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-26', productCode: '#KC-SHT-26', title: 'Shirt Embroidery 26', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1e9cTt4QvAVv-zj5MF5zc8JBlr2gmY3Ps'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-27', productCode: '#KC-SHT-27', title: 'Shirt Embroidery 27', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1Xi8g7LV91vXoHXphtq_wrdstS-mFktZb'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-28', productCode: '#KC-SHT-28', title: 'Shirt Embroidery 28', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('15yIgkaWDRvizAFq8JbCf1D0UM9_YIeso'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-embroidery-29', productCode: '#KC-SHT-29', title: 'Shirt Embroidery 29', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 1699, image: driveImage('1mfnI-YLokWNqrBcNevPIwSoxetPx9IXq'), stockStatus: 'in-stock' },
  { id: 'kc-shirt-trouser-duo', productCode: '#KC-CMB-01', title: 'Artisan Trouser & Shirt Duo', garment: 'Shirts', theme: 'Embroidery / Threadwork', price: 2999, image: driveImage('1qHY3FW2f4I3S2rhGVLDQCehR0CrZdoZ4'), stockStatus: 'in-stock' },
]

function assignInitialArticleCodes(products: CatalogProduct[]) {
  return products.map((product, index) => ({ ...product, articleCode: `KC-ART-${String(index + 1).padStart(3, '0')}` }))
}

const FIXED_PRICE_CATALOG_CODE = /^#KC-(?:SHT-\d{2}|CMB-01)$/

export const initialProducts: CatalogProduct[] = assignInitialArticleCodes(assignCategoryProductCodes(catalogSeed).map((product) => ({
  ...product,
  price: FIXED_PRICE_CATALOG_CODE.test(product.productCode ?? '') ? product.price : getSmartPrice(product),
})))

export function formatRupees(amount: number) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`
}

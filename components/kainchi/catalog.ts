export const GARMENT_TYPES = [
  'Fleece Hoodie',
  'Oversized T-Shirt',
  'Heavy Boxy Tee',
  'Zip-up Hoodie',
  'Bomber Jacket',
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

function driveImage(fileId: string) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1200`
}

export const initialProducts: CatalogProduct[] = [
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
]

export function formatRupees(amount: number) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`
}

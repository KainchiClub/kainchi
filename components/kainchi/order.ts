import { formatRupees, type CatalogProduct } from './catalog'

export const WHATSAPP_PHONE = '918863075356'
export const GIFT_BOX_PRICE = 99
export const FREE_GIFT_THRESHOLD = 5000
export const FREE_GIFT_VALUE = 499
export const FREE_GIFT_RECEIPT_LINE = `🎁 KAINCHI SPECIAL GIFT - FREE (Value ₹${FREE_GIFT_VALUE})`
export const MAX_ORDER_QUANTITY = 99

export const FABRIC_COLORS = [
  { name: 'Jet Black', sample: '#181715' },
  { name: 'Off-White', sample: '#e6dccb' },
  { name: 'Charcoal', sample: '#454340' },
  { name: 'Crimson Red', sample: '#792333' },
  { name: 'Forest Green', sample: '#29483b' },
  { name: 'Chocolate Brown', sample: '#4b2d22' },
  { name: 'Navy Blue', sample: '#26364a' },
  { name: 'Black & Red', sample: 'linear-gradient(90deg, #181715 50%, #792333 50%)' },
  { name: 'Off-White & Chocolate', sample: 'linear-gradient(90deg, #e6dccb 50%, #4b2d22 50%)' },
] as const

export type FabricColor = (typeof FABRIC_COLORS)[number]

export type CartLineDetails = {
  product: CatalogProduct
  size: string
  color: FabricColor
  quantity: number
  includesGiftBox: boolean
}

export type CartLineItem = CartLineDetails & {
  cartId: string
}

export function getCartLineTotal(item: CartLineDetails) {
  return item.product.price * item.quantity + (item.includesGiftBox ? GIFT_BOX_PRICE * item.quantity : 0)
}

export function getCartTotal(items: readonly CartLineDetails[]) {
  return items.reduce((total, item) => total + getCartLineTotal(item), 0)
}

export function hasFreeGiftUnlocked(items: readonly CartLineDetails[]) {
  return getCartTotal(items) >= FREE_GIFT_THRESHOLD
}

export function getGiftBoxQuantity(items: readonly CartLineDetails[]) {
  return items.reduce((total, item) => total + (item.includesGiftBox ? item.quantity : 0), 0)
}

export function createWhatsAppOrderMessage(items: readonly CartLineItem[]) {
  const itemSummaries = items.map((item) => [
    `• Item: ${item.product.title}`,
    `• Size: ${item.size}`,
    `• Packaging Tier: ${item.includesGiftBox ? `+${formatRupees(GIFT_BOX_PRICE)} Luxury Upgrade` : 'Standard'}`,
    ...(item.quantity > 1 ? [`• Quantity: ${item.quantity}`] : []),
  ].join('\n'))
  const orderInquiry = items.length === 1
    ? 'Hi Kainchi Club, I would like to place an order for this piece. Please let me know how to proceed with confirmation.'
    : 'Hi Kainchi Club, I would like to place an order for these pieces. Please let me know how to proceed with confirmation.'

  return [
    '✂️ *KAINCHI CLUB — ORDER INQUIRY* ✂️',
    '────────────────────────',
    itemSummaries.join('\n\n'),
    `• Estimated Total: ${formatRupees(getCartTotal(items))}`,
    '',
    `"${orderInquiry}"`,
    '────────────────────────',
  ].join('\n')
}

export function createWhatsAppOrderUrl(items: readonly CartLineItem[]) {
  const orderMessage = createWhatsAppOrderMessage(items)
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(orderMessage)}`
}

export function openWhatsAppOrder(items: readonly CartLineItem[]) {
  if (items.length === 0) return
  window.open(createWhatsAppOrderUrl(items), '_blank', 'noopener,noreferrer')
}

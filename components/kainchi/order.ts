import { formatRupees, type CatalogProduct } from './catalog'

export const WHATSAPP_PHONE = '918863075356'
export const GIFT_BOX_PRICE = 99
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

export function getGiftBoxQuantity(items: readonly CartLineDetails[]) {
  return items.reduce((total, item) => total + (item.includesGiftBox ? item.quantity : 0), 0)
}

export function createWhatsAppOrderMessage(items: readonly CartLineItem[]) {
  const giftBoxQuantity = getGiftBoxQuantity(items)
  const itemSummaries = items.map((item, index) => {
    const productAmount = item.product.price * item.quantity
    const packaging = item.includesGiftBox ? `Yes (+${formatRupees(GIFT_BOX_PRICE)} per item)` : 'No'

    return [
      `${index + 1}. ${item.product.title}`,
      `   • Artwork Category: ${item.product.theme}`,
      `   • Garment: ${item.product.garment}`,
      `   • Fabric Shade: ${item.color.name}`,
      `   • Size: ${item.size}`,
      `   • Qty: ${item.quantity}`,
      `   • Packaging: ${packaging}`,
      `   • Price: ${formatRupees(productAmount)} (${formatRupees(item.product.price)} × ${item.quantity})`,
      `   • Final item total: ${formatRupees(getCartLineTotal(item))}`,
    ].join('\n')
  })

  const packagingSummary = giftBoxQuantity === 0
    ? 'No'
    : giftBoxQuantity === 1
      ? `Yes (+${formatRupees(GIFT_BOX_PRICE)})`
      : `Yes (+${formatRupees(GIFT_BOX_PRICE)} × ${giftBoxQuantity} items)`

  return [
    '*KAINCHI CLUB - ORDER SUMMARY*',
    '────────────────────────',
    '🛍️ *ITEMS ORDERED:*',
    itemSummaries.join('\n\n'),
    '────────────────────────',
    `📦 *Packaging Box Add-on:* ${packagingSummary}`,
    `💰 *TOTAL PAYABLE:* ${formatRupees(getCartTotal(items))}`,
    '────────────────────────',
    'Please share payment details and dispatch timeline for this order.',
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

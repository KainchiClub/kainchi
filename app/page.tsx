import { StorefrontClient } from '@/components/kainchi/storefront-client'
import { StorefrontErrorBoundary } from '@/components/kainchi/storefront-error-boundary'

export default function Page() {
  return (
    <StorefrontErrorBoundary>
      <StorefrontClient />
    </StorefrontErrorBoundary>
  )
}

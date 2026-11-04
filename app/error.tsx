'use client'

import { useEffect } from 'react'
import { StorefrontRecoveryScreen } from '@/components/kainchi/storefront-error-boundary'

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[kainchi] route error', error)
  }, [error])

  return <StorefrontRecoveryScreen onRecover={reset} />
}

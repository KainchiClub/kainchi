'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type StorefrontErrorBoundaryProps = { children: ReactNode }
type StorefrontErrorBoundaryState = { hasError: boolean; resetKey: number; recentFailures: number[] }

const AUTO_RECOVER_LIMIT = 2
const FAILURE_WINDOW_MS = 10_000

export function StorefrontRecoveryScreen({ onRecover }: { onRecover: () => void }) {
  return (
    <main className="storefront-recovery" role="alert">
      <p className="eyebrow"><span className="eyebrow-dot" /> Kainchi Club</p>
      <h1>Just a stitch out of place.</h1>
      <p>The collection hit a small snag. Your selections are safe — tap below to head straight back to the storefront.</p>
      <button className="button button-crimson" type="button" onClick={onRecover}>Back to the collection</button>
    </main>
  )
}

export class StorefrontErrorBoundary extends Component<StorefrontErrorBoundaryProps, StorefrontErrorBoundaryState> {
  state: StorefrontErrorBoundaryState = { hasError: false, resetKey: 0, recentFailures: [] }

  static getDerivedStateFromError(): Partial<StorefrontErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kainchi] storefront render error', error, info.componentStack)
    const now = Date.now()
    const recentFailures = [...this.state.recentFailures.filter((time) => now - time < FAILURE_WINDOW_MS), now]
    this.setState({ recentFailures })
    // Transient navigation glitches usually clear on a fresh mount, so retry silently first.
    if (recentFailures.length <= AUTO_RECOVER_LIMIT) this.recover()
  }

  recover = () => {
    this.setState((state) => ({ hasError: false, resetKey: state.resetKey + 1 }))
  }

  handleManualRecover = () => {
    this.setState({ recentFailures: [] })
    this.recover()
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  }

  render() {
    if (this.state.hasError) return <StorefrontRecoveryScreen onRecover={this.handleManualRecover} />
    return <div key={this.state.resetKey} className="contents">{this.props.children}</div>
  }
}

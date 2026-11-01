'use client'

import { useState, type FormEvent } from 'react'
import { Check, Copy, WalletCards } from 'lucide-react'
import { readWalletLedger, readWalletSettings, upsertWallet, type StudioWallet } from './studio-wallet-store'

const WHATSAPP_NUMBER = '918863075356'
function maskPhone(phone: string) { return `+${phone.slice(0, 2)} ${phone.slice(2, 7)} *****` }
function walletHref(wallet: StudioWallet) { return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hey Studio, I want to redeem my ${wallet.coins} coins on my next piece`)}` }

export function StudioWallet() {
  const [query, setQuery] = useState('')
  const [wallet, setWallet] = useState<StudioWallet | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function openWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const match = readWalletLedger().find((item) => item.phone === query.replace(/\D/g, '') || item.passCode.toUpperCase() === query.trim().toUpperCase())
    if (!match) { setError('No Studio Wallet found in this browser. Enter your registered WhatsApp number or Studio Pass Code.'); setWallet(null); return }
    setError(''); setWallet(match)
  }

  function copyReferral() {
    if (!wallet) return
    void navigator.clipboard?.writeText(wallet.passCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const rupees = wallet ? Math.floor((wallet.coins / 1000) * readWalletSettings().rupeesPerUnit) : 0
  return (
    <section className="studio-wallet" aria-labelledby="studio-wallet-title">
      <div className="studio-wallet-heading"><WalletCards aria-hidden="true" /><h3 id="studio-wallet-title">Studio Wallet</h3></div>
      <form className="studio-wallet-form" onSubmit={openWallet}>
        <label htmlFor="studio-wallet-access">Enter your Registered WhatsApp Number / Studio Pass Code</label>
        <div className="studio-wallet-form-row"><input id="studio-wallet-access" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="+91 88630 5356 or KC-WALLET-5356" required /><button type="submit">Open Studio Wallet <span aria-hidden="true">➔</span></button></div>
      </form>
      {error && <p className="studio-wallet-error" role="alert">{error}</p>}
      {wallet && <div className="studio-wallet-card" role="status">
        <div className="studio-wallet-card-top"><div><p>Kainchi Studio Vault Wallet</p><strong>{wallet.memberName}</strong><span>{maskPhone(wallet.phone)}</span></div><span className="studio-wallet-seal">VAULT<br />ACTIVE</span></div>
        <div className="studio-wallet-balance"><span>Current Balance</span><strong>{wallet.coins.toLocaleString()} Studio Coins</strong><em>≈ ₹{rupees.toLocaleString('en-IN')} Store Credit</em></div>
        <div className="studio-wallet-stats"><span><b>{wallet.referrals}</b> Friends invited</span><span><b>{wallet.ordersCompleted}</b> Orders completed</span><span><b>{wallet.redemptions}</b> Coins redeemed</span></div>
        <div className="studio-wallet-actions"><button type="button" onClick={copyReferral}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Copied' : 'Copy referral pass'}</button><a href={walletHref(wallet)} target="_blank" rel="noopener noreferrer">Redeem Coins on WhatsApp Order</a></div>
      </div>}
      <p className="studio-wallet-note">New to the Studio? Your first bespoke piece automatically activates your Wallet.</p>
    </section>
  )
}

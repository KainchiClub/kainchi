'use client'

import { useState } from 'react'
import { Minus, Plus, Save } from 'lucide-react'
import { adjustWallet, saveWalletSettings, useStudioWallets, STUDIO_WALLET_COINS_PER_UNIT } from '@/components/kainchi/studio-wallet-store'

export function StudioWalletControl() {
  const { wallets, settings } = useStudioWallets()
  const [rate, setRate] = useState(String(settings.rupeesPerUnit))
  const [message, setMessage] = useState('')

  function saveRate() {
    const value = Number(rate)
    if (!Number.isSafeInteger(value) || value <= 0 || value > 100000) { setMessage('Enter a whole-number rupee value greater than zero.'); return }
    saveWalletSettings({ rupeesPerUnit: value }); setMessage(`Conversion saved: ${STUDIO_WALLET_COINS_PER_UNIT.toLocaleString()} coins = ₹${value}.`)
  }

  function adjust(phone: string, amount: number) {
    adjustWallet(phone, 'coins', amount)
    setMessage(`${amount > 0 ? 'Credited' : 'Debited'} ${Math.abs(amount).toLocaleString()} coins.`)
  }

  return <section className="admin-panel studio-wallet-admin" aria-labelledby="studio-wallet-admin-title">
    <div className="admin-panel-heading"><div><h2 id="studio-wallet-admin-title">Studio Wallet &amp; Coin Ledger</h2><p>Manage local customer wallets after verified WhatsApp purchases.</p></div><span className="admin-count">{String(wallets.length).padStart(2, '0')} WALLETS</span></div>
    <div className="studio-wallet-admin-rate"><label htmlFor="wallet-rate">Store credit per {STUDIO_WALLET_COINS_PER_UNIT.toLocaleString()} coins</label><div><span aria-hidden="true">₹</span><input id="wallet-rate" type="number" min="1" max="100000" step="1" value={rate} onChange={(event) => setRate(event.target.value)} /><button className="button button-crimson" type="button" onClick={saveRate}><Save aria-hidden="true" /> Save rate</button></div></div>
    {message && <p className="admin-partner-pass-message" role="status">{message}</p>}
    {wallets.length ? <div className="studio-wallet-ledger-wrap"><table className="admin-table studio-wallet-ledger"><caption className="sr-only">Studio wallet customer ledger</caption><thead><tr><th>Customer</th><th>Phone</th><th>Referrals</th><th>Coins</th><th>Redemptions</th><th>Adjust</th></tr></thead><tbody>{wallets.map((wallet) => <tr key={wallet.phone}><td><strong>{wallet.memberName}</strong><span className="admin-product-garment">{wallet.passCode}</span></td><td>{wallet.phone}</td><td>{wallet.referrals}</td><td><strong>{wallet.coins.toLocaleString()}</strong></td><td>{wallet.redemptions.toLocaleString()}</td><td><div className="studio-wallet-adjust"><button type="button" onClick={() => adjust(wallet.phone, -100)} aria-label={`Debit 100 coins from ${wallet.memberName}`}><Minus aria-hidden="true" />100</button><button type="button" onClick={() => adjust(wallet.phone, 100)} aria-label={`Credit 100 coins to ${wallet.memberName}`}><Plus aria-hidden="true" />100</button></div></td></tr>)}</tbody></table></div> : <p className="admin-partner-pass-empty">No wallets registered in this browser yet.</p>}
  </section>
}

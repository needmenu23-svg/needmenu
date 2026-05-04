'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { PrimaryButton } from '@/components/Field'
import { supabase } from '@/lib/supabase'

function CartInner() {
  const cart = useCart()
  const { lang, profile } = useApp()
  const t = T[lang]
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!profile || cart.lines.length === 0) return
    setBusy(true); setErr('')
    const restaurant_id = cart.lines[0].restaurant_id
    const tableId = (() => { try { return localStorage.getItem('nm-table') } catch { return null } })()
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({ restaurant_id, customer_id: profile.id, table_id: tableId, total: cart.total, notes })
      .select('id').single()
    if (oErr || !order) { setErr(oErr?.message ?? 'error'); setBusy(false); return }
    const items = cart.lines.map(l => ({ order_id: order.id, menu_item_id: l.menu_item_id, qty: l.qty, price_at_order: l.price }))
    const { error: iErr } = await supabase.from('order_items').insert(items)
    if (iErr) { setErr(iErr.message); setBusy(false); return }
    cart.clear()
    setBusy(false)
    router.replace(`/orders/${order.id}`)
  }

  return (
    <main className="min-h-dvh px-5 pt-6 pb-32">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 -ml-2 flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold ml-1">{t.cart}</h1>
      </div>

      {cart.lines.length === 0 ? (
        <p className="text-sm text-center py-16" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cart.lines.map(l => (
            <div key={l.menu_item_id} className="flex gap-3 p-3 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-2)' }}>
                {l.image_url && <img src={l.image_url} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-tight">{l.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{l.price.toFixed(0)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => cart.setQty(l.menu_item_id, l.qty - 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)' }}><Minus size={12} /></button>
                    <span className="text-sm font-medium w-5 text-center">{l.qty}</span>
                    <button onClick={() => cart.setQty(l.menu_item_id, l.qty + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)' }}><Plus size={12} /></button>
                  </div>
                  <button onClick={() => cart.setQty(l.menu_item_id, 0)} className="w-7 h-7 flex items-center justify-center" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t.notes}
            rows={2}
            className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          />
        </div>
      )}

      {cart.lines.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full px-5 py-4" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div className="flex justify-between mb-3 text-sm">
            <span style={{ color: 'var(--text-2)' }}>{t.total}</span>
            <span className="font-bold">{cart.total.toFixed(0)}</span>
          </div>
          {err && <p className="text-xs mb-2" style={{ color: 'var(--danger)' }}>{err}</p>}
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? '…' : t.placeOrder}</PrimaryButton>
        </div>
      )}
    </main>
  )
}

export default function Page() { return <AuthGuard><CartInner /></AuthGuard> }

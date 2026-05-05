'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'

type OrderItem = { id: number; qty: number; price_at_order: number; menu_item_id: string; menu_items: { name_en: string | null; name_ru: string | null; name_hy: string | null } | null }
type Order = { id: string; status: string; total: number; created_at: string; notes: string | null; restaurants: { name: string; currency: string } | null }

function Inner() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useApp()
  const t = T[lang]
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const [{ data: o }, { data: i }] = await Promise.all([
        supabase.from('orders').select('id, status, total, created_at, notes, restaurants(name, currency)').eq('id', id).single(),
        supabase.from('order_items').select('id, qty, price_at_order, menu_item_id, menu_items(name_en, name_ru, name_hy)').eq('order_id', id),
      ])
      setOrder(o as unknown as Order)
      setItems((i ?? []) as unknown as OrderItem[])
    }
    load()
    const sub = supabase.channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (p) => setOrder(prev => prev ? { ...prev, ...p.new } : prev))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [id])

  if (!order) return <div className="min-h-dvh flex items-center justify-center text-sm">{t.loading}</div>
  const statusLabel = (t as Record<string, string>)[order.status] || order.status
  const cur = order.restaurants?.currency || ''
  const localized = (it: OrderItem) => {
    const n = it.menu_items
    if (!n) return '—'
    return (lang === 'ru' && n.name_ru) || (lang === 'hy' && n.name_hy) || n.name_en || '—'
  }

  return (
    <main className="min-h-dvh px-5 pt-6 pb-12">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 -ml-2 flex items-center justify-center"><ArrowLeft size={20} /></button>
      </div>

      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(77,163,77,0.12)' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--green)' }} strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-bold">{t.orderPlaced}</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>#{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs mt-4 font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--green)' }}>{statusLabel}</p>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>{order.restaurants?.name}</h3>
        <div className="flex flex-col gap-2">
          {items.map(it => (
            <div key={it.id} className="flex justify-between items-baseline">
              <span className="text-sm">{localized(it)} <span style={{ color: 'var(--text-3)' }}>× {it.qty}</span></span>
              <span className="text-sm font-medium">{(Number(it.price_at_order) * it.qty).toFixed(0)} {cur}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="font-semibold">{t.total}</span>
          <span className="font-bold">{Number(order.total).toFixed(0)} {cur}</span>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-2xl p-4 text-xs" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>
          {order.notes}
        </div>
      )}
    </main>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

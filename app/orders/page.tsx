'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { BottomNav } from '@/components/BottomNav'

type OrderRow = {
  id: string
  status: string
  total: number
  created_at: string
  restaurants: { name: string } | null
}

function OrdersInner() {
  const { lang, profile } = useApp()
  const t = T[lang]
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('orders').select('id, status, total, created_at, restaurants(name)')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders((data ?? []) as unknown as OrderRow[]); setLoading(false) })
  }, [profile])

  return (
    <main className="min-h-dvh px-5 pt-8 pb-24">
      <h1 className="text-2xl font-bold mb-6">{t.orders}</h1>
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t.loading}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(o => (
            <Link key={o.id} href={`/orders/${o.id}`} className="block p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{o.restaurants?.name ?? '—'}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number(o.total).toFixed(0)}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--accent)' }}>{(t as Record<string, string>)[o.status] || o.status}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  )
}

export default function Page() { return <AuthGuard><OrdersInner /></AuthGuard> }

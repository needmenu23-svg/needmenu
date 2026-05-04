'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'

type Order = {
  id: string
  status: string
  total: number
  created_at: string
  notes: string | null
  restaurant_id: string
  restaurant_tables: { label: string } | null
  profiles: { full_name: string | null } | null
}

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: 'paid',
  paid: null,
  cancelled: null,
}

function Inner() {
  const { lang, profile } = useApp()
  const t = T[lang]
  const [orders, setOrders] = useState<Order[]>([])
  const [restaurantIds, setRestaurantIds] = useState<string[] | null>(null)

  const loadAssignment = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase.from('restaurant_staff').select('restaurant_id').eq('profile_id', profile.id)
    setRestaurantIds((data ?? []).map((d: { restaurant_id: string }) => d.restaurant_id))
  }, [profile])

  const loadOrders = useCallback(async () => {
    if (!restaurantIds || restaurantIds.length === 0) { setOrders([]); return }
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, created_at, notes, restaurant_id, restaurant_tables(label), profiles(full_name)')
      .in('restaurant_id', restaurantIds)
      .not('status', 'in', '(paid,cancelled)')
      .order('created_at', { ascending: false })
    setOrders((data ?? []) as unknown as Order[])
  }, [restaurantIds])

  useEffect(() => { loadAssignment() }, [loadAssignment])
  useEffect(() => {
    if (!restaurantIds) return
    loadOrders()
    const sub = supabase.channel('waiter-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [restaurantIds, loadOrders])

  const advance = async (id: string, current: string) => {
    const next = NEXT_STATUS[current]
    if (!next) return
    await supabase.from('orders').update({ status: next, updated_at: new Date().toISOString() }).eq('id', id)
  }

  const cancel = async (id: string) => {
    await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id)
  }

  return (
    <main className="min-h-dvh px-5 pt-8 pb-12">
      <h1 className="text-2xl font-bold mb-1">Waiter</h1>
      <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>{profile?.full_name}</p>

      {restaurantIds && restaurantIds.length === 0 && (
        <p className="text-sm rounded-xl p-4" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>
          You are not assigned to any restaurant yet.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {orders.map(o => (
          <div key={o.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{(t as Record<string, string>)[o.status] || o.status}</p>
                <h3 className="font-semibold mt-1">
                  {o.restaurant_tables?.label ? `${t.table} ${o.restaurant_tables.label}` : '—'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{o.profiles?.full_name ?? ''}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{new Date(o.created_at).toLocaleTimeString()}</p>
              </div>
              <p className="font-bold">{Number(o.total).toFixed(0)}</p>
            </div>
            {o.notes && <p className="text-xs mt-2 p-2 rounded" style={{ background: 'var(--bg-2)' }}>{o.notes}</p>}
            <div className="flex gap-2 mt-3">
              {NEXT_STATUS[o.status] && (
                <button
                  onClick={() => advance(o.id, o.status)}
                  className="flex-1 h-10 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  → {(t as Record<string, string>)[NEXT_STATUS[o.status] as string] || NEXT_STATUS[o.status]}
                </button>
              )}
              <button
                onClick={() => cancel(o.id)}
                className="h-10 px-4 rounded-xl text-xs font-medium"
                style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {restaurantIds && restaurantIds.length > 0 && orders.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
        )}
      </div>
    </main>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

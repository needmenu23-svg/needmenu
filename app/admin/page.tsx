'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { supabase, type Restaurant } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { AuthGuard } from '@/components/Guard'
import { PrimaryButton } from '@/components/Field'

function Inner() {
  const { profile } = useApp()
  const [items, setItems] = useState<Restaurant[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => {
    if (!profile) return
    supabase.from('restaurants').select('*').eq('owner_id', profile.id).order('created_at')
      .then(({ data }) => setItems((data ?? []) as Restaurant[]))
  }
  useEffect(load, [profile])

  const create = async () => {
    if (!profile || !name) return
    setBusy(true); setErr('')
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
    const { error } = await supabase.from('restaurants').insert({ owner_id: profile.id, name, slug })
    setBusy(false)
    if (error) { setErr(error.message); return }
    setName(''); load()
  }

  return (
    <main className="min-h-dvh px-5 pt-8 pb-12">
      <h1 className="text-2xl font-bold mb-1">Admin</h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-3)' }}>Your restaurants</p>

      <div className="flex flex-col gap-3 mb-8">
        {items.map(r => (
          <Link key={r.id} href={`/admin/${r.id}`} className="block p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>/{r.slug}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{
                color: r.is_published ? 'var(--success)' : 'var(--text-3)',
                background: r.is_published ? 'rgba(22,163,74,0.1)' : 'var(--bg-2)',
              }}>
                {r.is_published ? 'Live' : 'Draft'}
              </span>
            </div>
          </Link>
        ))}
        {items.length === 0 && <p className="text-sm" style={{ color: 'var(--text-3)' }}>No restaurants yet</p>}
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-2)' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Plus size={14} /> New restaurant</h3>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Restaurant name"
          className="w-full h-12 rounded-xl px-4 text-sm outline-none mb-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        />
        {err && <p className="text-xs mb-2" style={{ color: 'var(--danger)' }}>{err}</p>}
        <PrimaryButton onClick={create} disabled={busy || !name}>{busy ? '…' : 'Create'}</PrimaryButton>
      </div>
    </main>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { supabase, type Restaurant } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { BottomNav } from '@/components/BottomNav'

function HomeInner() {
  const { lang, profile } = useApp()
  const t = T[lang]
  const [items, setItems] = useState<Restaurant[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('is_published', true).order('name')
      .then(({ data }) => { setItems((data ?? []) as Restaurant[]); setLoading(false) })
  }, [])

  const filtered = items.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <main className="min-h-dvh pb-24 px-5 pt-8">
      <header className="mb-6">
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{lang === 'ru' ? 'Привет' : lang === 'hy' ? 'Ողջույն' : 'Hi'}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</p>
        <h1 className="text-2xl font-bold mt-1">{t.restaurants}</h1>
      </header>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t.search}
          className="w-full h-12 pl-12 pr-4 rounded-2xl text-sm outline-none"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => (
            <Link
              key={r.id}
              href={`/r/${r.slug}`}
              className="flex gap-4 items-center p-3 rounded-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-2)' }}>
                {r.logo_url && <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{r.name}</h3>
                <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{r.description ?? r.address ?? ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  )
}

export default function Page() {
  return <AuthGuard><HomeInner /></AuthGuard>
}

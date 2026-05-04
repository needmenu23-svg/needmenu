'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { supabase, type MenuItem } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T, pickLocalized } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { BottomNav } from '@/components/BottomNav'

type FavItem = MenuItem & { restaurants: { slug: string; currency: string; name: string } | null }

function Inner() {
  const { lang, profile } = useApp()
  const t = T[lang]
  const [items, setItems] = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('favorites').select('menu_items(*, restaurants(slug, currency, name))').eq('profile_id', profile.id)
      .then(({ data }) => {
        const list = (data ?? []).flatMap((d: { menu_items: FavItem | FavItem[] | null }) => {
          if (!d.menu_items) return []
          return Array.isArray(d.menu_items) ? d.menu_items : [d.menu_items]
        })
        setItems(list); setLoading(false)
      })
  }, [profile])

  return (
    <main className="min-h-dvh px-5 pt-8 pb-24">
      <h1 className="text-2xl font-bold mb-6">{t.favorites}</h1>
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t.loading}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(it => (
            <Link key={it.id} href={`/r/${it.restaurants?.slug ?? ''}`} className="flex gap-3 p-3 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-2)' }}>
                {it.image_url && <img src={it.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{pickLocalized(it, 'name', lang)}</h3>
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{it.restaurants?.name}</p>
                <p className="text-sm font-medium mt-1">{Number(it.price).toFixed(0)} {it.restaurants?.currency}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

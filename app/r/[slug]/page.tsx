'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react'
import { supabase, type Restaurant, type MenuItem, type MenuCategory } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T, pickLocalized } from '@/lib/i18n'
import { useCart } from '@/lib/cart'

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>()
  const sp = useSearchParams()
  const tableId = sp.get('table')
  const router = useRouter()
  const { lang, profile } = useApp()
  const t = T[lang]
  const cart = useCart()

  const [r, setR] = useState<Restaurant | null>(null)
  const [cats, setCats] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [activeCat, setActiveCat] = useState<string | 'all'>('all')

  useEffect(() => {
    if (tableId) try { localStorage.setItem('nm-table', tableId) } catch {}
  }, [tableId])

  useEffect(() => {
    (async () => {
      const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
      if (!rest) return
      setR(rest as Restaurant)
      const [{ data: c }, { data: m }] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('restaurant_id', rest.id).order('sort_order'),
        supabase.from('menu_items').select('*').eq('restaurant_id', rest.id).eq('is_available', true).order('sort_order'),
      ])
      setCats((c ?? []) as MenuCategory[])
      setItems((m ?? []) as MenuItem[])
      if (profile) {
        const { data: f } = await supabase.from('favorites').select('menu_item_id').eq('profile_id', profile.id)
        if (f) setFavIds(new Set(f.map((x: { menu_item_id: string }) => x.menu_item_id)))
      }
    })()
  }, [slug, profile])

  const toggleFav = async (id: string) => {
    if (!profile) return
    const has = favIds.has(id)
    const next = new Set(favIds)
    if (has) {
      next.delete(id)
      await supabase.from('favorites').delete().eq('profile_id', profile.id).eq('menu_item_id', id)
    } else {
      next.add(id)
      await supabase.from('favorites').insert({ profile_id: profile.id, menu_item_id: id })
    }
    setFavIds(next)
  }

  const filteredItems = activeCat === 'all' ? items : items.filter(i => i.category_id === activeCat)

  if (!r) return <div className="min-h-dvh flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>{t.loading}</div>

  return (
    <main className="min-h-dvh pb-28">
      <div className="relative h-44" style={{ background: 'var(--bg-2)' }}>
        {r.cover_url && <img src={r.cover_url} alt={r.name} className="w-full h-full object-cover" />}
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center backdrop-blur">
          <ArrowLeft size={18} />
        </button>
      </div>
      <div className="px-5 -mt-6 relative">
        <h1 className="text-2xl font-bold">{r.name}</h1>
        {r.description && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{r.description}</p>}
      </div>

      {cats.length > 0 && (
        <div className="mt-6 px-5 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <CatChip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>All</CatChip>
          {cats.map(c => (
            <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {pickLocalized(c, 'name', lang) || '—'}
            </CatChip>
          ))}
        </div>
      )}

      <div className="px-5 mt-4 flex flex-col gap-3">
        {filteredItems.map(it => (
          <div key={it.id} className="flex gap-3 p-3 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-2)' }}>
              {it.image_url && <img src={it.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="font-semibold leading-tight">{pickLocalized(it, 'name', lang)}</h3>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-2)' }}>{pickLocalized(it, 'description', lang)}</p>
              <div className="flex items-center justify-between mt-auto pt-1.5">
                <span className="font-semibold text-sm">{it.price.toFixed(0)} {r.currency}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFav(it.id)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border)' }}>
                    <Heart size={14} fill={favIds.has(it.id) ? 'var(--accent)' : 'transparent'} stroke={favIds.has(it.id) ? 'var(--accent)' : 'currentColor'} />
                  </button>
                  <button
                    onClick={() => cart.add({ menu_item_id: it.id, restaurant_id: r.id, name: pickLocalized(it, 'name', lang), price: Number(it.price), image_url: it.image_url })}
                    className="h-8 px-4 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {t.add}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="text-sm py-12 text-center" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
        )}
      </div>

      {cart.count > 0 && (
        <button
          onClick={() => router.push('/cart')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 h-14 px-6 rounded-full text-white font-semibold flex items-center gap-3 z-30 shadow-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <ShoppingBag size={18} />
          <span>{cart.count} · {cart.total.toFixed(0)} {r.currency}</span>
          <span className="opacity-80">→ {t.cart}</span>
        </button>
      )}
    </main>
  )
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="h-9 px-4 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-2)',
        color: active ? '#fff' : 'var(--text-2)',
        border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
      }}
    >
      {children}
    </button>
  )
}

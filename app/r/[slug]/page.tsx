'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Heart, Search, Grid3x3, List, ArrowLeft, Plus, ShoppingBag, Bell } from 'lucide-react'
import Link from 'next/link'
import { supabase, type Restaurant, type MenuItem, type MenuCategory } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T, pickLocalized, LANGS } from '@/lib/i18n'
import { useCart } from '@/lib/cart'

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>()
  const sp = useSearchParams()
  const tableId = sp.get('table')
  const router = useRouter()
  const { lang, setLang, profile } = useApp()
  const t = T[lang]
  const cart = useCart()

  const [r, setR] = useState<Restaurant | null>(null)
  const [cats, setCats] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [activeCat, setActiveCat] = useState<string | 'all'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [q, setQ] = useState('')
  const [showSearch, setShowSearch] = useState(false)

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

  const filtered = items.filter(i => {
    if (activeCat !== 'all' && i.category_id !== activeCat) return false
    if (q.trim()) {
      const needle = q.toLowerCase()
      return [i.name_en, i.name_ru, i.name_hy, i.description_en, i.description_ru, i.description_hy]
        .some(v => v?.toLowerCase().includes(needle))
    }
    return true
  })

  const cycleLang = () => {
    const i = LANGS.findIndex(l => l.code === lang)
    setLang(LANGS[(i + 1) % LANGS.length].code)
  }

  if (!r) return <div className="min-h-dvh flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>{t.loading}</div>

  return (
    <main className="min-h-dvh pb-28" style={{ background: 'var(--bg)' }}>
      {/* Sticky header bar */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ background: 'var(--bg-2)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={16} />
          </button>
          {/* view toggle */}
          <button onClick={() => setView('grid')} aria-label="Grid view" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: view === 'grid' ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)' }}>
            <Grid3x3 size={16} color={view === 'grid' ? '#fff' : undefined} />
          </button>
          <button onClick={() => setView('list')} aria-label="List view" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: view === 'list' ? 'var(--green)' : 'var(--surface)', border: '1px solid var(--border)' }}>
            <List size={16} color={view === 'list' ? '#fff' : undefined} />
          </button>
          <div className="flex-1" />
          <button onClick={() => setShowSearch(s => !s)} aria-label="Search" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)' }}>
            <Search size={16} color="#fff" />
          </button>
          <button onClick={cycleLang} aria-label="Language" className="h-9 px-2 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--green)' }}>
            {lang.toUpperCase()}
          </button>
          <Link href="/call" aria-label={t.callWaiter} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Bell size={16} color="#fff" />
          </Link>
        </div>

        {showSearch && (
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
            placeholder={t.search}
            className="w-full h-10 mt-3 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          />
        )}

        {/* category chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar -mx-4 px-4">
          <Chip active={activeCat === 'all'} onClick={() => setActiveCat('all')} primary>
            {lang === 'ru' ? 'Всё' : lang === 'hy' ? 'Բոլորը' : 'All'}
          </Chip>
          {cats.map(c => (
            <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} primary>
              {pickLocalized(c, 'name', lang) || '—'}
            </Chip>
          ))}
        </div>
      </header>

      {/* Grid view (Figma style) */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {filtered.map(it => (
            <ItemCard
              key={it.id}
              item={it}
              currency={r.currency}
              fav={favIds.has(it.id)}
              onFav={() => toggleFav(it.id)}
              onAdd={() => cart.add({
                menu_item_id: it.id,
                restaurant_id: r.id,
                name: pickLocalized(it, 'name', lang),
                price: Number(it.price),
                image_url: it.image_url,
              })}
              orderLabel={lang === 'ru' ? 'Заказать' : lang === 'hy' ? 'Պատվիրել' : 'Order'}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* List view (existing horizontal layout) */}
      {view === 'list' && (
        <div className="flex flex-col gap-3 px-4 pt-4">
          {filtered.map(it => (
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
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm py-12 text-center" style={{ color: 'var(--text-3)' }}>{t.empty}</p>
      )}

      {/* Floating cart pill */}
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

function Chip({ active, onClick, children, primary }: { active: boolean; onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  const activeBg = primary ? 'var(--green)' : 'var(--accent)'
  return (
    <button
      onClick={onClick}
      className="h-10 px-4 rounded-xl text-xs font-medium whitespace-nowrap uppercase tracking-wide"
      style={{
        background: active ? activeBg : 'var(--surface)',
        color: active ? '#fff' : 'var(--text-2)',
        border: '1px solid ' + (active ? activeBg : 'var(--border)'),
      }}
    >
      {children}
    </button>
  )
}

function ItemCard({ item, currency, fav, onFav, onAdd, orderLabel, lang }: {
  item: MenuItem; currency: string; fav: boolean; onFav: () => void; onAdd: () => void; orderLabel: string; lang: 'en' | 'ru' | 'hy'
}) {
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: 'var(--surface)' }}>
      <div className="relative aspect-square" style={{ background: 'var(--bg-2)' }}>
        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
        <button
          onClick={onFav}
          aria-label="favorite"
          className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <Heart size={14} fill={fav ? 'var(--accent)' : 'transparent'} stroke={fav ? 'var(--accent)' : 'var(--text-2)'} />
        </button>
        <button
          onClick={onAdd}
          aria-label="add to cart"
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: 'var(--green)' }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold leading-tight uppercase tracking-tight line-clamp-2" style={lang === 'hy' ? { fontFamily: 'Noto Sans Armenian, sans-serif' } : undefined}>
          {pickLocalized(item, 'name', lang)}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold">{Number(item.price).toLocaleString('en-US')} {currency}</span>
          <button onClick={onAdd} className="h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: 'var(--accent)' }}>
            {orderLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

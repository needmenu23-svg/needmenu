'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { supabase, type Restaurant, type MenuCategory, type MenuItem } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { AuthGuard } from '@/components/Guard'
import { PrimaryButton } from '@/components/Field'

type Table = { id: string; label: string; qr_token: string }

function Inner() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useApp()
  const [r, setR] = useState<Restaurant | null>(null)
  const [tab, setTab] = useState<'info' | 'menu' | 'tables' | 'staff'>('info')

  useEffect(() => {
    if (!id) return
    supabase.from('restaurants').select('*').eq('id', id).single().then(({ data }) => setR(data as Restaurant))
  }, [id])

  if (!r) return <div className="min-h-dvh flex items-center justify-center text-sm">…</div>

  return (
    <main className="min-h-dvh px-5 pt-6 pb-12">
      <Link href="/admin" className="text-sm flex items-center gap-1 mb-6" style={{ color: 'var(--text-2)' }}>
        <ArrowLeft size={14} /> back
      </Link>
      <h1 className="text-2xl font-bold">{r.name}</h1>
      <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>/{r.slug}</p>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {(['info', 'menu', 'tables', 'staff'] as const).map(k => (
          <button key={k} onClick={() => setTab(k)} className="h-9 px-4 rounded-full text-xs font-medium whitespace-nowrap" style={{
            background: tab === k ? 'var(--accent)' : 'var(--bg-2)',
            color: tab === k ? '#fff' : 'var(--text-2)',
          }}>{k}</button>
        ))}
      </div>

      {tab === 'info' && <InfoTab r={r} onSaved={setR} />}
      {tab === 'menu' && <MenuTab restaurantId={r.id} />}
      {tab === 'tables' && <TablesTab restaurantId={r.id} />}
      {tab === 'staff' && <StaffTab restaurantId={r.id} ownerId={profile?.id ?? null} />}
    </main>
  )
}

function InfoTab({ r, onSaved }: { r: Restaurant; onSaved: (r: Restaurant) => void }) {
  const [form, setForm] = useState(r)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    const { data } = await supabase.from('restaurants').update({
      name: form.name,
      description: form.description,
      logo_url: form.logo_url,
      cover_url: form.cover_url,
      address: form.address,
      phone: form.phone,
      currency: form.currency,
      is_published: form.is_published,
    }).eq('id', r.id).select('*').single()
    setBusy(false)
    if (data) onSaved(data as Restaurant)
  }

  return (
    <div className="flex flex-col gap-3">
      <Inp label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
      <Inp label="Description" value={form.description ?? ''} onChange={v => setForm({ ...form, description: v })} />
      <Inp label="Logo URL" value={form.logo_url ?? ''} onChange={v => setForm({ ...form, logo_url: v })} />
      <Inp label="Cover URL" value={form.cover_url ?? ''} onChange={v => setForm({ ...form, cover_url: v })} />
      <Inp label="Address" value={form.address ?? ''} onChange={v => setForm({ ...form, address: v })} />
      <Inp label="Phone" value={form.phone ?? ''} onChange={v => setForm({ ...form, phone: v })} />
      <Inp label="Currency (AMD/USD/EUR)" value={form.currency} onChange={v => setForm({ ...form, currency: v.toUpperCase() })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
        Published
      </label>
      <PrimaryButton onClick={save} disabled={busy}>{busy ? '…' : 'Save'}</PrimaryButton>
    </div>
  )
}

function MenuTab({ restaurantId }: { restaurantId: string }) {
  const [cats, setCats] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [newCat, setNewCat] = useState('')
  const [newItem, setNewItem] = useState({ name: '', price: '', category_id: '', image_url: '' })

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurantId).order('sort_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('sort_order'),
    ])
    setCats((c.data ?? []) as MenuCategory[])
    setItems((i.data ?? []) as MenuItem[])
  }, [restaurantId])
  useEffect(() => { load() }, [load])

  const addCat = async () => {
    if (!newCat) return
    await supabase.from('menu_categories').insert({ restaurant_id: restaurantId, name_en: newCat, sort_order: cats.length })
    setNewCat(''); load()
  }
  const delCat = async (id: string) => { await supabase.from('menu_categories').delete().eq('id', id); load() }
  const addItem = async () => {
    if (!newItem.name || !newItem.price) return
    await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      category_id: newItem.category_id || null,
      name_en: newItem.name,
      price: Number(newItem.price),
      image_url: newItem.image_url || null,
      sort_order: items.length,
    })
    setNewItem({ name: '', price: '', category_id: '', image_url: '' })
    load()
  }
  const delItem = async (id: string) => { await supabase.from('menu_items').delete().eq('id', id); load() }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-sm font-semibold mb-2">Categories</h3>
        <div className="flex flex-col gap-2 mb-3">
          {cats.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background: 'var(--bg-2)' }}>
              <span>{c.name_en ?? '—'}</span>
              <button onClick={() => delCat(c.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Drinks" className="flex-1 h-11 rounded-xl px-3 text-sm outline-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
          <button onClick={addCat} className="h-11 px-4 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}><Plus size={14} /></button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2">Items</h3>
        <div className="flex flex-col gap-2 mb-3">
          {items.map(i => (
            <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{i.name_en}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{Number(i.price).toFixed(0)}</p>
              </div>
              <button onClick={() => delItem(i.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
          <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" className="h-10 rounded-lg px-3 text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          <input value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} placeholder="Price" type="number" className="h-10 rounded-lg px-3 text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          <select value={newItem.category_id} onChange={e => setNewItem({ ...newItem, category_id: e.target.value })} className="h-10 rounded-lg px-3 text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <option value="">— category —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
          <input value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} placeholder="Image URL (optional)" className="h-10 rounded-lg px-3 text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          <button onClick={addItem} className="h-10 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>Add item</button>
        </div>
      </section>
    </div>
  )
}

function TablesTab({ restaurantId }: { restaurantId: string }) {
  const [tables, setTables] = useState<Table[]>([])
  const [label, setLabel] = useState('')
  const load = useCallback(() => {
    supabase.from('restaurant_tables').select('id, label, qr_token').eq('restaurant_id', restaurantId).order('label')
      .then(({ data }) => setTables((data ?? []) as Table[]))
  }, [restaurantId])
  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!label) return
    await supabase.from('restaurant_tables').insert({ restaurant_id: restaurantId, label })
    setLabel(''); load()
  }
  const del = async (id: string) => { await supabase.from('restaurant_tables').delete().eq('id', id); load() }

  return (
    <div className="flex flex-col gap-3">
      {tables.map(tt => (
        <div key={tt.id} className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background: 'var(--bg-2)' }}>
          <div>
            <p className="font-medium">{tt.label}</p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{tt.qr_token}</p>
          </div>
          <button onClick={() => del(tt.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="T1, T2, ..." className="flex-1 h-11 rounded-xl px-3 text-sm outline-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
        <button onClick={add} className="h-11 px-4 rounded-xl text-white" style={{ background: 'var(--accent)' }}><Plus size={14} /></button>
      </div>
    </div>
  )
}

function StaffTab({ restaurantId, ownerId }: { restaurantId: string; ownerId: string | null }) {
  const [staff, setStaff] = useState<{ id: number; profile_id: string; role: string; profiles: { full_name: string | null } | null }[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'waiter' | 'admin'>('waiter')
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    supabase.from('restaurant_staff').select('id, profile_id, role, profiles(full_name)').eq('restaurant_id', restaurantId)
      .then(({ data }) => setStaff((data ?? []) as unknown as typeof staff))
  }, [restaurantId])
  useEffect(() => { load() }, [load])

  const add = async () => {
    setMsg('')
    if (!email) return
    // find profile by email via auth.users isn't accessible; instruct: have staff sign up first, then add by their email
    // Use profiles table joined via auth.users? Profiles has only id. We need to look up via auth admin (server-side).
    // Workaround: use RPC or ask user to share their profile id. For MVP, we tell them.
    setMsg('Ask staff member to sign up first, then share their account ID with you to add them. (Lookup-by-email needs server-side admin API — coming next.)')
  }
  const remove = async (id: number) => { await supabase.from('restaurant_staff').delete().eq('id', id); load() }

  return (
    <div className="flex flex-col gap-3">
      {ownerId && <p className="text-xs" style={{ color: 'var(--text-3)' }}>Owner: {ownerId.slice(0, 8)}…</p>}
      {staff.map(s => (
        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background: 'var(--bg-2)' }}>
          <div>
            <p className="font-medium">{s.profiles?.full_name ?? '—'}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{s.role}</p>
          </div>
          <button onClick={() => remove(s.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" className="flex-1 h-11 rounded-xl px-3 text-sm outline-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
        <select value={role} onChange={e => setRole(e.target.value as 'waiter' | 'admin')} className="h-11 px-3 rounded-xl text-sm" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <option value="waiter">waiter</option>
          <option value="admin">admin</option>
        </select>
        <button onClick={add} className="h-11 px-4 rounded-xl text-white" style={{ background: 'var(--accent)' }}><Plus size={14} /></button>
      </div>
      {msg && <p className="text-xs" style={{ color: 'var(--text-2)' }}>{msg}</p>}
    </div>
  )
}

function Inp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="h-11 rounded-xl px-3 text-sm outline-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
    </label>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

'use client'
import { useState } from 'react'
import { Bell, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'

const COPY = {
  en: { title: 'Call waiter', sub: 'Tap a request below — we\'ll notify your waiter immediately.', bill: 'Bring the bill', water: 'Bring water', clean: 'Clean the table', help: 'Other help', sent: 'Request sent', back: 'Back to menu' },
  ru: { title: 'Позвать официанта', sub: 'Нажми запрос — официант получит уведомление.', bill: 'Принести счёт', water: 'Принести воду', clean: 'Убрать со стола', help: 'Другая помощь', sent: 'Запрос отправлен', back: 'Назад в меню' },
  hy: { title: 'Կանչել մատուցողին', sub: 'Սեղմեք պահանջը — մատուցողը անմիջապես կտեղեկացվի:', bill: 'Բերեք հաշիվը', water: 'Բերեք ջուր', clean: 'Մաքրեք սեղանը', help: 'Այլ օգնություն', sent: 'Պահանջը ուղարկվեց', back: 'Հետ դեպի մենյու' },
}

function Inner() {
  const { lang, profile } = useApp()
  const c = COPY[lang]
  const t = T[lang]
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async (kind: string) => {
    if (!profile) return
    setBusy(true); setErr('')
    const tableId = (() => { try { return localStorage.getItem('nm-table') } catch { return null } })()
    // store as a special "service request" order with notes; staff sees it on /waiter
    if (!tableId) { setErr('Scan QR at your table first'); setBusy(false); return }
    const { data: tt } = await supabase.from('restaurant_tables').select('restaurant_id').eq('id', tableId).maybeSingle()
    if (!tt) { setErr('Invalid table'); setBusy(false); return }
    const { error } = await supabase.from('orders').insert({
      restaurant_id: tt.restaurant_id,
      table_id: tableId,
      customer_id: profile.id,
      total: 0,
      status: 'pending',
      notes: `[CALL] ${kind}`,
    })
    if (error) { setErr(error.message); setBusy(false); return }
    setSent(kind); setBusy(false)
  }

  const requests = [
    { key: 'bill', label: c.bill, emoji: '🧾' },
    { key: 'water', label: c.water, emoji: '💧' },
    { key: 'clean', label: c.clean, emoji: '🧽' },
    { key: 'help', label: c.help, emoji: '🙋' },
  ]

  if (sent) {
    return (
      <main className="min-h-dvh px-6 pt-12 pb-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(77,163,77,0.12)' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--green)' }} strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-bold">{c.sent}</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{requests.find(r => r.key === sent)?.label}</p>
        <Link href="/home" className="mt-8 h-12 px-6 rounded-2xl text-white font-semibold flex items-center" style={{ background: 'var(--green)' }}>
          {c.back}
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-dvh px-5 pt-6 pb-12">
      <Link href="/home" className="w-9 h-9 rounded-lg flex items-center justify-center mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <ArrowLeft size={16} />
      </Link>
      <div className="flex items-center gap-3 mb-2">
        <Bell size={24} style={{ color: 'var(--green)' }} />
        <h1 className="text-2xl font-bold">{c.title}</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>{c.sub}</p>

      <div className="grid grid-cols-2 gap-3">
        {requests.map(r => (
          <button
            key={r.key}
            disabled={busy}
            onClick={() => send(r.key)}
            className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-transform active:scale-95"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-4xl">{r.emoji}</span>
            <span className="text-xs font-semibold text-center leading-tight">{r.label}</span>
          </button>
        ))}
      </div>

      {err && <p className="text-sm mt-4" style={{ color: 'var(--danger)' }}>{err}</p>}
    </main>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

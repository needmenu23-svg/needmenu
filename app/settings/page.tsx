'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Globe, Lock, LogOut, User, Info } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { BottomNav } from '@/components/BottomNav'

function Inner() {
  const { lang, profile, signOut } = useApp()
  const t = T[lang]
  const router = useRouter()

  const items = [
    { href: '/settings/account', icon: User, label: t.account },
    { href: '/language', icon: Globe, label: t.language },
    { href: '/settings/password', icon: Lock, label: t.changePassword },
    { href: '/settings/about', icon: Info, label: t.about },
  ]

  return (
    <main className="min-h-dvh px-5 pt-8 pb-24">
      <h1 className="text-2xl font-bold mb-6">{t.settings}</h1>
      <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--accent)' }}>
          {(profile?.full_name ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold">{profile?.full_name ?? '—'}</h3>
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{profile?.role}</p>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {items.map(({ href, icon: Icon, label }, i) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 h-14" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
            <Icon size={18} style={{ color: 'var(--text-2)' }} />
            <span className="text-sm flex-1">{label}</span>
            <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
          </Link>
        ))}
      </div>
      <button
        onClick={async () => { await signOut(); router.replace('/') }}
        className="w-full mt-4 h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
        style={{ background: 'var(--bg-2)', color: 'var(--danger)' }}
      >
        <LogOut size={16} /> {t.signOut}
      </button>

      {(profile?.role === 'admin' || profile?.role === 'owner') && (
        <Link href="/admin" className="mt-3 block text-center text-xs" style={{ color: 'var(--accent)' }}>
          → Admin dashboard
        </Link>
      )}
      {profile?.role === 'waiter' && (
        <Link href="/waiter" className="mt-3 block text-center text-xs" style={{ color: 'var(--accent)' }}>
          → Waiter dashboard
        </Link>
      )}

      <BottomNav />
    </main>
  )
}

export default function Page() { return <AuthGuard><Inner /></AuthGuard> }

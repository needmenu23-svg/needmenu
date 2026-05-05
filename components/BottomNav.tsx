'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, QrCode, Heart, ShoppingBag, Settings } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'

export function BottomNav() {
  const pathname = usePathname()
  const { lang } = useApp()
  const t = T[lang]
  const items = [
    { href: '/home', icon: Home, label: t.restaurants },
    { href: '/scan', icon: QrCode, label: t.scanQR },
    { href: '/favorites', icon: Heart, label: t.favorites },
    { href: '/orders', icon: ShoppingBag, label: t.orders },
    { href: '/settings', icon: Settings, label: t.settings },
  ]
  return (
    <nav
      className="fixed bottom-0 inset-x-0 mx-auto max-w-md h-16 flex items-center justify-around px-2"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-2"
            style={{ color: active ? 'var(--green)' : 'var(--text-3)' }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px]">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'
import Link from 'next/link'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Welcome() {
  const { lang, profile, loading } = useApp()
  const t = T[lang]
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) router.replace('/home')
  }, [loading, profile, router])

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-between px-6 py-16 text-center">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center"
          style={{ background: 'var(--green)', boxShadow: '0 12px 40px rgba(77,163,77,0.3)' }}
          aria-label="Need Menu"
        >
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round">
            <path d="M14 50 Q14 28 36 28" />
            <path d="M14 50 Q14 14 50 14" />
            <circle cx="14" cy="50" r="3" fill="white" stroke="none" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span style={{ color: 'var(--green)' }}>Need</span>{' '}
          <span style={{ color: 'var(--accent)' }}>Menu</span>
        </h1>
        <p className="text-base" style={{ color: 'var(--text-2)' }}>{t.tagline}</p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <Link
          href="/language"
          className="h-14 rounded-2xl font-semibold text-white flex items-center justify-center"
          style={{ background: 'var(--accent)' }}
        >
          {t.getStarted}
        </Link>
        <div className="flex justify-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
          <span>{t.haveAccount}</span>
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>{t.signIn}</Link>
        </div>
      </div>
    </main>
  )
}

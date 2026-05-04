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
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hi))', boxShadow: '0 20px 60px rgba(255,90,31,0.35)' }}
        >
          NM
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{t.appName}</h1>
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

'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/AppContext'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useApp()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !profile) router.replace('/login')
  }, [loading, profile, router])
  if (loading || !profile) return <div className="min-h-dvh flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>…</div>
  return <>{children}</>
}

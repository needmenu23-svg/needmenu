'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type Lang, type Profile } from './supabase'

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('nm-lang', l) } catch {}
    if (profile) supabase.from('profiles').update({ preferred_language: l }).eq('id', profile.id).then(() => {})
  }

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setProfile(null); setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setProfile(data as Profile)
      if (data.preferred_language) setLangState(data.preferred_language as Lang)
    }
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nm-lang') as Lang | null
      if (saved && ['en','ru','hy'].includes(saved)) setLangState(saved)
    } catch {}
    refresh()
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh())
    return () => sub.subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppCtx.Provider value={{ lang, setLang, profile, loading, refresh, signOut }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside AppProvider')
  return c
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { Field, PrimaryButton } from '@/components/Field'

export default function LoginPage() {
  const { lang } = useApp()
  const t = T[lang]
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    setBusy(false)
    if (error) { setErr(error.message); return }
    router.replace('/home')
  }

  return (
    <main className="min-h-dvh flex flex-col px-6 py-12">
      <Link href="/" className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>← {t.appName}</Link>
      <h1 className="text-3xl font-bold mb-8">{t.signIn}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label={t.password} type="password" value={pwd} onChange={setPwd} autoComplete="current-password" />
        {err && <p className="text-sm" style={{ color: 'var(--danger)' }}>{err}</p>}
        <div className="flex justify-end">
          <Link href="/forgot" className="text-sm" style={{ color: 'var(--accent)' }}>{t.forgotPassword}</Link>
        </div>
        <PrimaryButton type="submit" disabled={busy || !email || !pwd}>
          {busy ? '…' : t.signIn}
        </PrimaryButton>
      </form>
      <p className="text-sm mt-6 text-center" style={{ color: 'var(--text-2)' }}>
        {t.noAccount} <Link href="/signup" className="font-semibold" style={{ color: 'var(--accent)' }}>{t.signUp}</Link>
      </p>
    </main>
  )
}

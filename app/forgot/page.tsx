'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { Field, PrimaryButton } from '@/components/Field'

export default function ForgotPage() {
  const { lang } = useApp()
  const t = T[lang]
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset` : undefined,
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <main className="min-h-dvh flex flex-col px-6 py-12">
      <Link href="/login" className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>← {t.signIn}</Link>
      <h1 className="text-3xl font-bold mb-8">{t.resetPassword}</h1>
      {sent ? (
        <p className="text-sm" style={{ color: 'var(--success)' }}>✓ {t.email} →</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
          {err && <p className="text-sm" style={{ color: 'var(--danger)' }}>{err}</p>}
          <PrimaryButton type="submit" disabled={busy || !email}>
            {busy ? '…' : t.sendResetLink}
          </PrimaryButton>
        </form>
      )}
    </main>
  )
}

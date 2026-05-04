'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { BottomNav } from '@/components/BottomNav'
import { PrimaryButton } from '@/components/Field'

function ScanInner() {
  const { lang } = useApp()
  const t = T[lang]
  const router = useRouter()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    const { data } = await supabase
      .from('restaurant_tables')
      .select('id, restaurant_id, restaurants(slug)')
      .eq('qr_token', code.trim())
      .maybeSingle()
    if (!data) { setErr('Invalid QR code'); return }
    const r = (data as unknown as { id: string; restaurants: { slug: string } | { slug: string }[] | null }).restaurants
    const slug = Array.isArray(r) ? r[0]?.slug : r?.slug
    if (!slug) { setErr('Invalid QR code'); return }
    router.push(`/r/${slug}?table=${data.id}`)
  }

  return (
    <main className="min-h-dvh pb-24 px-6 pt-12 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">{t.scanQR}</h1>
      <p className="text-sm text-center mb-10" style={{ color: 'var(--text-2)' }}>
        {lang === 'ru' ? 'Наведи камеру на QR-код на столе' : lang === 'hy' ? 'Ուղղեք տեսախցիկը սեղանի QR-ին' : 'Point your camera at the QR on the table'}
      </p>
      <div
        className="w-64 h-64 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: 'var(--bg-2)', border: '2px dashed var(--border)' }}
      >
        <QrCode size={120} style={{ color: 'var(--text-3)' }} />
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        {lang === 'ru' ? 'или введи код вручную' : lang === 'hy' ? 'կամ մուտքագրեք ձեռքով' : 'or enter the code manually'}
      </p>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="abcd1234"
        className="w-full h-12 rounded-xl px-4 text-sm outline-none mb-3 text-center font-mono tracking-wider"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      />
      {err && <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{err}</p>}
      <PrimaryButton onClick={submit} disabled={!code}>{t.continue}</PrimaryButton>
      <BottomNav />
    </main>
  )
}

export default function Page() { return <AuthGuard><ScanInner /></AuthGuard> }

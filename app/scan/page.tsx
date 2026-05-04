'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'
import { T } from '@/lib/i18n'
import { AuthGuard } from '@/components/Guard'
import { BottomNav } from '@/components/BottomNav'
import { PrimaryButton } from '@/components/Field'
import { QrScannerView } from '@/components/QrScannerView'

function ScanInner() {
  const { lang } = useApp()
  const t = T[lang]
  const router = useRouter()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState(false)

  const tryToken = useCallback(async (raw: string) => {
    setBusy(true); setErr('')
    let token = raw.trim()
    // accept full URL like https://needmenu.app/scan?t=xxxx
    try {
      const u = new URL(token)
      const t = u.searchParams.get('t') || u.searchParams.get('token')
      if (t) token = t
      else token = u.pathname.split('/').filter(Boolean).pop() || token
    } catch {}
    const { data } = await supabase
      .from('restaurant_tables')
      .select('id, restaurant_id, restaurants(slug)')
      .eq('qr_token', token)
      .maybeSingle()
    setBusy(false)
    if (!data) { setErr('Invalid QR code'); return }
    const r = (data as unknown as { id: string; restaurants: { slug: string } | { slug: string }[] | null }).restaurants
    const slug = Array.isArray(r) ? r[0]?.slug : r?.slug
    if (!slug) { setErr('Invalid QR code'); return }
    router.push(`/r/${slug}?table=${data.id}`)
  }, [router])

  return (
    <main className="min-h-dvh pb-24 px-6 pt-10 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">{t.scanQR}</h1>
      <p className="text-sm text-center mb-8" style={{ color: 'var(--text-2)' }}>
        {lang === 'ru' ? 'Наведи камеру на QR-код на столе' : lang === 'hy' ? 'Ուղղեք տեսախցիկը սեղանի QR-ին' : 'Point your camera at the QR on the table'}
      </p>

      {!manual && (
        <div className="w-full max-w-xs">
          <QrScannerView onResult={tryToken} onError={() => setManual(true)} />
        </div>
      )}

      <button
        onClick={() => setManual(m => !m)}
        className="text-xs mt-4"
        style={{ color: 'var(--text-2)' }}
      >
        {manual ? '← Back to camera' : (lang === 'ru' ? 'Ввести вручную' : lang === 'hy' ? 'Մուտքագրել ձեռքով' : 'Enter manually')}
      </button>

      {manual && (
        <div className="w-full max-w-xs mt-4 flex flex-col gap-3">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="abcd1234"
            className="w-full h-12 rounded-xl px-4 text-sm outline-none text-center font-mono tracking-wider"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          />
          <PrimaryButton onClick={() => tryToken(code)} disabled={!code || busy}>{busy ? '…' : t.continue}</PrimaryButton>
        </div>
      )}

      {err && <p className="text-xs mt-3" style={{ color: 'var(--danger)' }}>{err}</p>}

      <BottomNav />
    </main>
  )
}

export default function Page() { return <AuthGuard><ScanInner /></AuthGuard> }

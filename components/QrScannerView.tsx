'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  onResult: (text: string) => void
  onError?: (msg: string) => void
}

export function QrScannerView({ onResult, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<{ stop: () => void; destroy: () => void } | null>(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { default: QrScanner } = await import('qr-scanner')
        if (cancelled || !videoRef.current) return
        const s = new QrScanner(
          videoRef.current,
          (r: { data: string }) => onResult(r.data),
          { highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true },
        )
        await s.start()
        scannerRef.current = s
        setReady(true)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'camera unavailable'
        setErr(msg)
        onError?.(msg)
      }
    })()
    return () => {
      cancelled = true
      try { scannerRef.current?.stop(); scannerRef.current?.destroy() } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden" style={{ background: '#000' }}>
      <video ref={videoRef} className="w-full h-full object-cover" />
      {!ready && !err && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs">starting camera…</div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-xs text-white">{err}</div>
      )}
    </div>
  )
}

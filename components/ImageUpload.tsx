'use client'
import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/AppContext'

type Props = {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = 'Image' }: Props) {
  const { profile } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const upload = async (file: File) => {
    if (!profile) return
    setBusy(true); setErr('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${profile.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('menu').upload(path, file, { contentType: file.type, upsert: false })
    if (error) { setErr(error.message); setBusy(false); return }
    const { data } = supabase.storage.from('menu').getPublicUrl(path)
    onChange(data.publicUrl)
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover" />
            <button onClick={() => onChange('')} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow" style={{ color: 'var(--danger)' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-2)', border: '1px dashed var(--border)' }}>
            <Upload size={16} style={{ color: 'var(--text-3)' }} />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="h-10 px-4 rounded-lg text-xs font-medium flex-1"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          {busy ? '…' : (value ? 'Replace' : 'Upload')}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }}
      />
      {err && <p className="text-xs" style={{ color: 'var(--danger)' }}>{err}</p>}
    </div>
  )
}

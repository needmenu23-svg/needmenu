'use client'
import { useState } from 'react'

type Props = {
  label: string
  type?: 'text' | 'email' | 'password' | 'tel'
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  placeholder?: string
}

export function Field({ label, type = 'text', value, onChange, autoComplete, placeholder }: Props) {
  const [show, setShow] = useState(false)
  const isPwd = type === 'password'
  const inputType = isPwd ? (show ? 'text' : 'password') : type
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</span>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full h-12 rounded-xl px-4 text-sm outline-none"
          style={{ background: 'var(--bg-2)', border: '1.5px solid var(--border)' }}
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: 'var(--text-2)' }}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </label>
  )
}

export function PrimaryButton({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-14 rounded-2xl font-semibold text-white w-full transition-opacity"
      style={{ background: 'var(--accent)', opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  )
}

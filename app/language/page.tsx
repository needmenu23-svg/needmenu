'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/AppContext'
import { LANGS, T } from '@/lib/i18n'

export default function LanguagePage() {
  const { lang, setLang } = useApp()
  const router = useRouter()
  const t = T[lang]

  const pick = (code: typeof LANGS[number]['code']) => {
    setLang(code)
    router.push('/signup')
  }

  return (
    <main className="min-h-dvh flex flex-col px-6 py-12">
      <h1 className="text-2xl font-bold mb-8 text-center">{t.chooseLanguage}</h1>
      <div className="flex flex-col gap-3">
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => pick(l.code)}
            className="h-16 rounded-2xl px-5 flex items-center gap-4 text-left transition-colors"
            style={{
              background: lang === l.code ? 'rgba(255,90,31,0.08)' : 'var(--bg-2)',
              border: `1.5px solid ${lang === l.code ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <span className="text-3xl">{l.flag}</span>
            <span className="font-medium text-base">{l.label}</span>
            <span className="ml-auto text-sm" style={{ color: lang === l.code ? 'var(--accent)' : 'var(--text-3)' }}>
              {lang === l.code ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}

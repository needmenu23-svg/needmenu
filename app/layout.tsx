import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/lib/AppContext'

export const metadata: Metadata = {
  title: 'Need Menu',
  description: 'Scan. Choose. Enjoy.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ff5a1f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppProvider>
          <div className="mx-auto w-full max-w-md min-h-dvh">{children}</div>
        </AppProvider>
      </body>
    </html>
  )
}

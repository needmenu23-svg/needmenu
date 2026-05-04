'use client'
import { useEffect, useState } from 'react'

export type CartLine = {
  menu_item_id: string
  restaurant_id: string
  name: string
  price: number
  image_url: string | null
  qty: number
}

const KEY = 'nm-cart'

function read(): CartLine[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function write(v: CartLine[]) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); window.dispatchEvent(new Event('nm-cart')) } catch {}
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])
  useEffect(() => {
    setLines(read())
    const sync = () => setLines(read())
    window.addEventListener('nm-cart', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('nm-cart', sync); window.removeEventListener('storage', sync) }
  }, [])
  return {
    lines,
    add: (l: Omit<CartLine, 'qty'>) => {
      const cur = read()
      const i = cur.findIndex(x => x.menu_item_id === l.menu_item_id)
      if (i >= 0) cur[i].qty += 1
      else cur.push({ ...l, qty: 1 })
      // single-restaurant cart: drop other restaurants
      const filtered = cur.filter(x => x.restaurant_id === l.restaurant_id)
      write(filtered)
    },
    setQty: (id: string, qty: number) => {
      const cur = read()
      const i = cur.findIndex(x => x.menu_item_id === id)
      if (i < 0) return
      if (qty <= 0) cur.splice(i, 1)
      else cur[i].qty = qty
      write(cur)
    },
    clear: () => write([]),
    total: lines.reduce((s, l) => s + l.price * l.qty, 0),
    count: lines.reduce((s, l) => s + l.qty, 0),
  }
}

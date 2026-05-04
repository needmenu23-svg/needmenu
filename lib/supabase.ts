import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export type Lang = 'en' | 'ru' | 'hy'

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  preferred_language: Lang
  role: 'customer' | 'waiter' | 'admin' | 'owner'
}

export type Restaurant = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  phone: string | null
  currency: string
  is_published: boolean
}

export type MenuItem = {
  id: string
  restaurant_id: string
  category_id: string | null
  name_en: string | null
  name_ru: string | null
  name_hy: string | null
  description_en: string | null
  description_ru: string | null
  description_hy: string | null
  price: number
  image_url: string | null
  is_available: boolean
}

export type MenuCategory = {
  id: string
  restaurant_id: string
  name_en: string | null
  name_ru: string | null
  name_hy: string | null
  sort_order: number
}

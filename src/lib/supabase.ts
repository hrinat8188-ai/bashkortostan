import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvermbogfdmbqtiibquq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'СЮДА_ВСТАВЬ_СВОЙ_ANON_КЛЮЧ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createServerClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
    { auth: { persistSession: false } }
  )
}

export type User = {
  id: string
  telegram_id: number
  telegram_username: string | null
  first_name: string
  last_name: string | null
  current_level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  xp: number
  total_words: number
  streak_days: number
  last_activity_at: string
  is_premium: boolean
  referral_code: string
  created_at: string
}

export type Course = {
  id: string
  level: string
  title_ru: string
  title_bashkir: string
  description: string
  total_lessons: number
  order_index: number
  is_free: boolean
  color: string
  icon: string
}

export type Lesson = {
  id: string
  module_id: string
  title_ru: string
  title_bashkir: string
  content: Record<string, unknown>
  audio_url: string | null
  duration_minutes: number
  order_index: number
  is_premium: boolean
  xp_reward: number
}

export type Exercise = {
  id: string
  lesson_id: string
  type: 'multiple_choice' | 'fill_blank' | 'translation' | 'listening' | 'word_match' | 'sentence_build' | 'speaking'
  question: {
    text: string
    audio_url?: string
    image_url?: string
    translation?: string
  }
  answers: Array<{ id: string; text: string; is_correct: boolean }>
  explanation: { ru?: string; bashkir?: string; hint?: string }
  difficulty: number
}

export type VocabWord = {
  id: string
  bashkir: string
  russian: string
  transcription: string
  audio_url: string | null
  topic: string
  level: string
  example_bashkir: string | null
  example_russian: string | null
}

export type UserVocab = {
  id: string
  user_id: string
  vocab_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_quality: number
  is_favorite: boolean
  vocabulary?: VocabWord
}

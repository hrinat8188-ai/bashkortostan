'use client'

import { useEffect, useState } from 'react'
import { supabase, type User } from '@/lib/supabase'
import { useTelegram } from './useTelegram'

export function useUser() {
  const { user: tgUser, isReady } = useTelegram()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !tgUser) return

    async function loadOrCreateUser() {
      try {
        // Ищем пользователя по telegram_id
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', tgUser!.id)
          .single()

        if (fetchError && fetchError.code === 'PGRST116') {
          // Пользователь не найден — создаём нового
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              telegram_id: tgUser!.id,
              telegram_username: tgUser!.username ?? null,
              first_name: tgUser!.first_name,
              last_name: tgUser!.last_name ?? null,
              language_code: tgUser!.language_code ?? 'ru',
            })
            .select()
            .single()

          if (createError) throw createError
          setUser(newUser)
        } else if (fetchError) {
          throw fetchError
        } else {
          setUser(data)
          // Обновляем last_activity_at
          await supabase
            .from('users')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('id', data.id)
        }
      } catch (err) {
        setError('Ошибка загрузки профиля')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadOrCreateUser()
  }, [isReady, tgUser])

  async function addXP(amount: number) {
    if (!user) return
    const newXP = user.xp + amount
    const { data } = await supabase
      .from('users')
      .update({ xp: newXP })
      .eq('id', user.id)
      .select()
      .single()
    if (data) setUser(data)
  }

  async function refreshUser() {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setUser(data)
  }

  return { user, loading, error, addXP, refreshUser }
}

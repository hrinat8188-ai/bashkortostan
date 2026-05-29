'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTelegramWebApp, getTelegramUser, type TelegramUser, DEV_USER } from '@/lib/telegram'

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const tg = getTelegramWebApp()

    if (tg) {
      tg.ready()
      tg.expand()
      tg.enableClosingConfirmation()

      const tgUser = getTelegramUser()
      setUser(tgUser)
      setIsDark(tg.colorScheme === 'dark')

      // Применяем цвета Telegram к CSS
      const root = document.documentElement
      if (tg.themeParams.bg_color) {
        root.style.setProperty('--tg-bg', tg.themeParams.bg_color)
      }
      if (tg.themeParams.text_color) {
        root.style.setProperty('--tg-text', tg.themeParams.text_color)
      }
      if (tg.colorScheme === 'dark') {
        root.classList.add('dark')
      }
    } else {
      // Режим разработки — используем мок-пользователя
      setUser(DEV_USER)
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }

    setIsReady(true)
  }, [])

  const haptic = useCallback((type: 'light' | 'success' | 'error' | 'warning' = 'light') => {
    const tg = getTelegramWebApp()
    if (!tg) return
    if (type === 'light') tg.HapticFeedback.impactOccurred('light')
    else tg.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning')
  }, [])

  const showAlert = useCallback((message: string) => {
    const tg = getTelegramWebApp()
    if (tg) tg.showAlert(message)
    else alert(message)
  }, [])

  const getInitData = useCallback(() => {
    return getTelegramWebApp()?.initData ?? ''
  }, [])

  return { user, isDark, isReady, haptic, showAlert, getInitData }
}

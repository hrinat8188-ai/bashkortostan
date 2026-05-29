'use client'

// Типы для Telegram WebApp
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    start_param?: string
    auth_date: number
    hash: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    setText: (text: string) => void
    onClick: (fn: () => void) => void
    offClick: (fn: () => void) => void
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
    offClick: (fn: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  expand: () => void
  close: () => void
  ready: () => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  openLink: (url: string) => void
  openTelegramLink: (url: string) => void
  openInvoice: (url: string, callback: (status: string) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback: (ok: boolean) => void) => void
  showPopup: (params: {
    title?: string
    message: string
    buttons?: Array<{ id: string; type?: string; text: string }>
  }, callback?: (id: string) => void) => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  sendData: (data: string) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp()
  return tg?.initDataUnsafe?.user ?? null
}

export function isTelegramWebApp(): boolean {
  const tg = getTelegramWebApp()
  return !!(tg && tg.initData)
}

export function haptic(type: 'light' | 'success' | 'error' | 'warning' = 'light') {
  const tg = getTelegramWebApp()
  if (!tg) return
  if (type === 'light') tg.HapticFeedback.impactOccurred('light')
  else tg.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning')
}

// Мок-пользователь для разработки без Telegram
export const DEV_USER: TelegramUser = {
  id: 123456789,
  first_name: 'Тест',
  last_name: 'Пользователь',
  username: 'testuser',
  language_code: 'ru',
}

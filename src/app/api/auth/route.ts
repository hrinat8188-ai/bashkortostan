import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { createServerClient } from '@/lib/supabase'

// Верификация подписи Telegram initData
function verifyTelegramData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return false

  params.delete('hash')
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  return expectedHash === hash
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()
    const botToken = process.env.TELEGRAM_BOT_TOKEN!

    // В dev режиме пропускаем верификацию
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev && !verifyTelegramData(initData, botToken)) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 })
    }

    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return NextResponse.json({ error: 'No user data' }, { status: 400 })

    const tgUser = JSON.parse(userStr)
    const supabase = createServerClient()

    // Upsert пользователя
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        telegram_id: tgUser.id,
        telegram_username: tgUser.username ?? null,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name ?? null,
        language_code: tgUser.language_code ?? 'ru',
        last_activity_at: new Date().toISOString(),
      }, { onConflict: 'telegram_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ user, isNew: false })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}

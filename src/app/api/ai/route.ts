import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, userLevel } = await req.json()

    const systemPrompt = `Ты — AI-преподаватель башкирского языка для русскоязычных студентов.
Текущий уровень студента: ${userLevel ?? 'A0'}.
Объясняй грамматику на русском языке, давай транскрипцию башкирских слов в [скобках].
Будь дружелюбным и поддерживающим преподавателем.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.slice(-20),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? 'Извините, не удалось получить ответ.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json({ reply: 'Произошла ошибка. Попробуй ещё раз.' }, { status: 200 })
  }
}

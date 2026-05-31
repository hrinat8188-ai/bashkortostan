import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, userLevel } = await req.json()

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Ты — AI-преподаватель башкирского языка для русскоязычных студентов. Уровень студента: ${userLevel ?? 'A0'}. Объясняй грамматику на русском языке. Башкирские слова давай с транскрипцией в [скобках]. Будь дружелюбным.`
          },
          ...messages.slice(-20)
        ],
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Извините, попробуй ещё раз.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ reply: 'Произошла ошибка. Попробуй ещё раз.' })
  }
}

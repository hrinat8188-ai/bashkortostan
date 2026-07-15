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
        model: 'openai/gpt-oss-120b',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Ты — преподаватель башкирского языка. Уровень студента: ${userLevel ?? 'A0'}.

СТРОГИЕ ПРАВИЛА:
- Отвечай ТОЛЬКО на вопросы о башкирском языке и башкирской культуре
- Если не знаешь точного ответа — скажи честно
- Не выдумывай факты, слова или грамматические правила
- Башкирские слова давай с транскрипцией в [скобках]
- Объясняй на русском языке просто и понятно
- Приводи только проверенные примеры

Основные факты о башкирском:
- Тюркский язык, близок к татарскому и казахскому
- Особые буквы: Ғ, Ҙ, Ҡ, Ң, Ө, Ҫ, Ү, Һ
- Агглютинативный язык — значение добавляется суффиксами
- Порядок слов: Подлежащее + Дополнение + Сказуемое
- Официальный язык Республики Башкортостан`,
          },
          ...messages.slice(-20)
        ],
      }),
    })
if (!response.ok) {
  const errText = await response.text()
  return NextResponse.json({ reply: `Ошибка API: ${response.status} - ${errText}` })
}
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Извините, попробуй ещё раз.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ reply: 'Произошла ошибка. Попробуй ещё раз.' })
  }
}

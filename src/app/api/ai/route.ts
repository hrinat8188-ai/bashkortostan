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
            const systemPrompt = `Ты — помощник по изучению башкирского языка. Уровень студента: ${userLevel ?? 'A0'}.

СТРОГИЕ ПРАВИЛА (нарушение недопустимо):
1. Отвечай КОРОТКО — максимум 5-7 предложений, без таблиц и длинных списков
2. НЕ используй markdown-таблицы, заголовки ##, жирный текст — только простой текст
3. НЕ называй имена поэтов, писателей, деятелей культуры, даты, названия произведений — если студент спросит о культуре, говори только общими фактами: Сабантуй — праздник плуга, курай — духовой инструмент из тростника, кумыс — напиток из кобыльего молока, Салават Юлаев — национальный герой, Мустай Карим — народный поэт
4. НЕ выдумывай башкирские слова. Используй только те, в которых уверен
5. Если не знаешь точного ответа — скажи: "Точно не знаю, лучше уточнить в словаре"
6. Башкирские слова пиши с транскрипцией в [скобках]

Твоя главная задача: помогать с переводами простых слов, объяснять грамматику (падежи, времена, суффиксы), давать простые упражнения.

Проверенная грамматика:
- Настоящее время: -айым/-эйем (барайым — иду)
- Прошедшее: -дым/-дем (бардым — пошёл)
- Будущее: -асаҡ/-әсәк (барасаҡмын — пойду)
- Множ. число: -дар/-дәр (балалар — дети)
- Дательный падеж: -ға/-гә (өйгә — домой)
- Исходный: -дан/-дән (өйҙән — из дома)
- Местный: -да/-дә (өйҙә — дома)`
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

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, userLevel } = await req.json()

    const systemPrompt = `Ты — AI-преподаватель башкирского языка для русскоязычных студентов.
Текущий уровень студента: ${userLevel ?? 'A0'}.

Твои задачи:
- Объяснять грамматику башкирского на простом русском языке
- Исправлять ошибки мягко, объясняя причину
- Вести диалоги на башкирском с переводом и транскрипцией
- Генерировать упражнения, адаптированные под уровень студента
- Объяснять культурный контекст башкирского народа

Правила формата:
- Башкирские слова и фразы всегда сопровождай транскрипцией в [скобках]
- При переводах давай транскрипцию: Ғаилә [ğaɪ̯lə] = семья
- Упражнения делай интерактивными: задавай вопрос и жди ответа
- Объяснения делай краткими и с примерами
- Используй эмодзи умеренно для дружелюбного тона
- Для уровня A0-A1 пиши проще и короче; для B1-C1 можно сложнее

Особые башкирские буквы для справки:
Ғғ [ğ] — фрикативное Г; Ҙҙ [ð] — как "th" в "this"; Ҡҡ [q] — увулярное К;
Ңң [ŋ] — как "ng" в "sing"; Өө [ø] — как нем. "ö"; Ҫҫ [θ] — как "th" в "think";
Үү [y] — как нем. "ü"; Һһ [h] — мягкое Х; Ыы [ɯ] — задний ряд "ы"`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.slice(-20), // последние 20 сообщений
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? 'Извините, не удалось получить ответ.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json(
      { reply: '😔 Произошла ошибка. Попробуй ещё раз.' },
      { status: 200 } // Возвращаем 200 чтобы клиент не крашился
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, level, count } = await req.json()

    const levelVocab: Record<string, string> = {
      'A0': 'Исәнмесегеҙ=здравствуйте, Сәлам=привет, Рәхмәт=спасибо, Хуш=пока, Эйе=да, Юҡ=нет, Ғаилә=семья, Атай=папа, Инәй=мама, Өй=дом, Ҡала=город, Мин=я, Бер=один, Ике=два, Өс=три',
      'A1': 'Ағай=брат, Апай=сестра, Бала=ребёнок, Ҡарт=дедушка, Дуҫ=друг, Мәктәп=школа, Китап=книга, Ун=десять, Егерме=двадцать, Йоз=сто, Матур=красивый, Ҙур=большой',
      'A2': 'Кибет=магазин, Ҡиммәт=дорого, Арзан=дёшево, Дүшәмбе=понедельник, Йома=пятница, Хәҙер=сейчас, Барам=иду, Килдем=пришёл, Яҙ=весна, Ҡыш=зима',
      'B1': 'Табип=врач, Уҡытыусы=учитель, Хезмэт=труд, Бал=мёд, Ҡымыҙ=кумыс, Сабантуй=праздник, Курай=музыкальный инструмент, Тукталыш=остановка',
      'B2': 'Килешеу=договор, Хөрмәтле=уважаемый, Хормат белэн=с уважением, Тэклиф=предложение, Имза=подпись, Мерэжэгать=обращение, Шарт=условие, Нэтижэ=заключение, Кереш=введение',
      'C1': 'Хокук=право, Бурыс=обязанность, Азатлык=свобода, Канун=закон, Шагыйрь=поэт, Шигырь=стихотворение, Дэлил=аргумент, Бэхэс=спор, Имза=подпись',
    }

    const vocab = levelVocab[level] ?? levelVocab['A0']

    const msg = `Ты преподаватель башкирского языка. Создай ${count} упражнений СТРОГО по теме "${lessonTitle}" для уровня ${level}.

Тема урока: ${lessonTitle}
Словарь уровня ${level}: ${vocab}

Упражнения должны быть ТОЛЬКО по теме "${lessonTitle}". Используй слова из словаря уровня.
Верни ТОЛЬКО JSON массив: [{"question":"вопрос на русском","answers":[{"text":"правильный ответ","is_correct":true},{"text":"неверно1","is_correct":false},{"text":"неверно2","is_correct":false},{"text":"неверно3","is_correct":false}],"explanation":"объяснение"}]`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 3000,
        temperature: 0.5,
        messages: [{ role: 'user', content: msg }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq error:', err)
      return NextResponse.json({ exercises: [] }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ exercises: [] }, { status: 500 })
    }

    const exercises = JSON.parse(jsonMatch[0])
    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ exercises: [] }, { status: 500 })
  }
}

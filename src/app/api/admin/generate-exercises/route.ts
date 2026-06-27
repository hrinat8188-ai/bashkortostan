import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, level, count } = await req.json()

    const msg = `Ты преподаватель башкирского языка. Создай ${count} упражнений для урока "${lessonTitle}" уровня ${level}.

ВАЖНО: Используй ТОЛЬКО эти проверенные башкирские слова и не выдумывай новые.
Базовый словарь: Исәнмесегеҙ=здравствуйте, Сәлам=привет, Рәхмәт=спасибо, Хуш=пока, Эйе=да, Юҡ=нет, Ғаилә=семья, Атай=папа, Инәй=мама, Өй=дом, Ҡала=город, Мин=я, Бер=один, Ике=два, Өс=три, Дүрт=четыре, Биш=пять, Ун=десять, Ат=лошадь, Бал=мёд, Ҡымыҙ=кумыс, Табип=врач, Уҡытыусы=учитель, Китап=книга, Ыуаҙ=вода, Аша=еда, Ҡош=птица, Айыу=медведь, Ҡыҙ=девочка, Малай=мальчик

Верни ТОЛЬКО JSON массив: [{"question":"вопрос","answers":[{"text":"правильный","is_correct":true},{"text":"неверно1","is_correct":false},{"text":"неверно2","is_correct":false},{"text":"неверно3","is_correct":false}],"explanation":"объяснение с транскрипцией"}]`

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

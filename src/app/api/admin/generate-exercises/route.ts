import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, level, count } = await req.json()

    const msg = `Ты эксперт по башкирскому языку. Создай ${count} упражнений для урока по теме "${lessonTitle}" уровня ${level}. Вопросы на русском, ответы содержат башкирские слова. Верни ТОЛЬКО JSON массив: [{"question":"вопрос","answers":[{"text":"башкирское слово","is_correct":true},{"text":"неверно1","is_correct":false},{"text":"неверно2","is_correct":false},{"text":"неверно3","is_correct":false}],"explanation":"объяснение"}]`

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

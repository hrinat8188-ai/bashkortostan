import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, level, count } = await req.json()
    const prompt = `Ты эксперт по башкирскому языку. Создай ${count} упражнений с выбором ответа для урока "${lessonTitle}" уровня ${level}.
Каждое упражнение: вопрос на русском, 4 варианта (1 правильный). Используй реальные башкирские слова.
Отвечай ТОЛЬКО JSON без лишнего текста:
{"exercises":[{"question":"вопрос","answers":[{"text":"правильный","is_correct":true},{"text":"неправильный","is_correct":false},{"text":"неправильный","is_correct":false},{"text":"неправильный","is_correct":false}],"explanation":"объяснение"}]}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ exercises: [] }, { status: 500 })
  }
}

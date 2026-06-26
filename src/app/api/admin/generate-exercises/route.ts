import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, level, count } = await req.json()

    const prompt = `Create ${count} multiple choice exercises about Bashkir language for lesson "${lessonTitle}" level ${level}. Answer in Russian language.

Return ONLY a JSON array, no other text:
[
  {
    "question": "Question in Russian",
    "answers": [
      {"text": "Correct answer", "is_correct": true},
      {"text": "Wrong answer 1", "is_correct": false},
      {"text": "Wrong answer 2", "is_correct": false},
      {"text": "Wrong answer 3", "is_correct": false}
    ],
    "explanation": "Brief explanation in Russian"
  }
]`

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
        messages: [{ role: 'user', content: prompt }],
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
      console.error('No JSON found:', text.substring(0, 200))
      return NextResponse.json({ exercises: [] }, { status: 500 })
    }

    const exercises = JSON.parse(jsonMatch[0])
    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ exercises: [] }, { status: 500 })
  }
}

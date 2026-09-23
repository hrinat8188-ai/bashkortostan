import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GRAMMAR_REFERENCE = `
ПРОВЕРЕННАЯ ГРАММАТИКА БАШКИРСКОГО (источник: академическая грамматика tel.bashqort.com, basic.bashlang.ru):
- Настоящее время: -айым/-әйем (барайым=иду, уҡыйым=читаю)
- Прошедшее время: -дым/-дем/-тым/-тем (бардым=пошёл, килдем=пришёл)
- Будущее время: -асаҡ/-әсәк (барасаҡмын=пойду)
- Притяжательность: -ым/-ем (атайым=мой папа, өйөм=мой дом)
- Множественное число: -дар/-дәр/-тар/-тәр (китаптар=книги, балалар=дети)
- Дательный падеж: -ға/-гә (өйгә=домой, ҡалаға=в город)
- Исходный падеж: -дан/-дән (өйҙән=из дома, ҡаладан=из города)
- Местный падеж: -да/-дә (өйҙә=дома, ҡалала=в городе)
- Числа 1-10: бер,ике,өс,дүрт,биш,алты,ете,һигеҙ,туғыҙ,ун
- Числа десятки: ун=10,егерме=20,утыҙ=30,ҡырҡ=40,илле=50,алтмыш=60,етмеш=70,һикһән=80,туҡһан=90,йөҙ=100,мең=1000
- Дни недели: дүшәмбе,шишәмбе,шаршамбы,кесаҙна,йома,шәмбе,йәкшәмбе
- Движение: барыу(идти/ехать в общем смысле), килеү(приходить/приезжать), китеү(уходить/уезжать/отправляться), инеү(входить/въезжать), сығыу(выходить), төшөү(спускаться), үрләү(подниматься), ҡайтыу(возвращаться), йөгереү/йүгереү(бежать), осоу(лететь), йөҙөү(плыть)
`

const KNOWN_WRONG_WORDS = `
СЛОВА, КОТОРЫЕ НИКОГДА НЕ ИСПОЛЬЗУЙ (они неверны или не существуют, были ранее ошибочно сгенерированы):
йыйылт, мәр, өтәү, аяу, абый(это татарское слово, не башкирское), олатай=бабушка(неверно, олатай=дедушка), ағай=отец(неверно, ағай=брат), ыуаҙ=вода(неверно, вода=һыу), ҡырыҡ(неверно писать через лишнюю ы, правильно ҡырҡ), үтереү=бежать(неверно, үтереү=убивать), туган как денежная единица(туган=родственник, не деньги)
`

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, level, count } = await req.json()

    // Достаём реальные проверенные слова уровня прямо из базы —
    // это надёжнее статичного списка, так как база уже вычищена от ошибок
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1']
    const levelIndex = levelOrder.indexOf(level)
    const levelsToInclude = levelOrder.slice(0, Math.max(levelIndex + 1, 1))

    const { data: vocabWords } = await supabase
      .from('vocabulary')
      .select('bashkir, russian, transcription')
      .in('level', levelsToInclude)
      .limit(100)

    const vocabList = (vocabWords ?? [])
      .map(w => `${w.bashkir}=${w.russian}`)
      .join(', ')

    const msg = `Ты преподаватель башкирского языка. Строго следуй правилам:

1. Используй ТОЛЬКО слова из списков ниже. НИКОГДА не выдумывай новые башкирские слова.
2. Если для темы "${lessonTitle}" нет подходящего слова в списке — сформулируй упражнение на грамматику вместо лексики.
3. Никогда не используй слова из чёрного списка ниже.

ПРОВЕРЕННЫЙ СЛОВАРЬ УРОВНЯ ${level} И НИЖЕ (из очищенной базы данных):
${vocabList}

${GRAMMAR_REFERENCE}

${KNOWN_WRONG_WORDS}

Создай ${count} РАЗНЫХ уникальных упражнений по теме "${lessonTitle}" для уровня ${level}.
Используй разные форматы: перевод с башкирского, перевод на башкирский, грамматика.
Перед тем как завершить — проверь каждое использованное башкирское слово: есть ли оно в списке выше? Если слова нет в списке — не используй его.

Верни ТОЛЬКО JSON массив:
[{"question":"вопрос","answers":[{"text":"правильный","is_correct":true},{"text":"неверно1","is_correct":false},{"text":"неверно2","is_correct":false},{"text":"неверно3","is_correct":false}],"explanation":"объяснение с транскрипцией"}]`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        max_tokens: 4000,
        temperature: 0.6,
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

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Слова, которые ранее были подтверждены как неверные или несуществующие
// во время ручной проверки базы (сентябрь 2026). Если появляются как
// ПРАВИЛЬНЫЙ ответ — это почти наверняка та же старая ошибка вернулась.
const KNOWN_WRONG_WORDS = [
  'йыйылт', 'мәр', 'өтәү', 'аяу', 'абый', 'ыуаҙ',
  'үтереү', // в значении "бежать" — это "убивать"
]

// Слова, которые должны были быть заменены на верное написание.
const OLD_SPELLING_VARIANTS = [
  'Хормат белэн', 'хормат белэн', 'Мерэжэгать', 'мерэжэгать',
  'Тэклиф', 'тэклиф', 'Тэкдим', 'тэкдим', 'Килешеу', 'килешеу',
  'Хокук', 'хокук', 'Нэтижэ', 'нэтижэ', 'Ҡырыҡ', 'ҡырыҡ',
  'Ыуаҙ', 'ыуаҙ',
]

type Answer = { id?: string; text?: string; is_correct?: boolean }

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Отсутствуют переменные окружения Supabase на сервере' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Уроки с недостаточным количеством упражнений
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title_ru, exercises(id)')

    if (lessonsError) {
      return NextResponse.json({ error: 'Ошибка запроса уроков: ' + lessonsError.message }, { status: 500 })
    }

    const lessonsBelow15 = (allLessons ?? [])
      .map((l: any) => ({ id: l.id, title: l.title_ru, count: (l.exercises ?? []).length }))
      .filter((l: any) => l.count < 15)

    // 2. Все упражнения
    const { data: allExercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, lesson_id, question, answers, explanation, lessons(title_ru)')

    if (exercisesError) {
      return NextResponse.json({ error: 'Ошибка запроса упражнений: ' + exercisesError.message }, { status: 500 })
    }

    const noCorrectAnswer: any[] = []
    const multiCorrectAnswer: any[] = []
    const duplicateAnswerText: any[] = []
    const knownWrongWords: any[] = []
    const oldSpelling: any[] = []
    const tatarLetterZh: any[] = []
    const globalWordMeanings = new Map<string, Set<string>>()

    for (const ex of allExercises ?? []) {
      const answers: Answer[] = Array.isArray(ex.answers) ? ex.answers : []
      const questionText: string = (ex.question as any)?.text ?? ''
      const explanationText: string = (ex.explanation as any)?.ru ?? ''
      const lessonTitle: string = (ex.lessons as any)?.title_ru ?? '?'
      const fullText = JSON.stringify(answers) + questionText + explanationText

      const correctAnswers = answers.filter(a => a?.is_correct)
      if (correctAnswers.length === 0) {
        noCorrectAnswer.push({ id: ex.id, lesson: lessonTitle, question: questionText })
      }
      if (correctAnswers.length > 1) {
        multiCorrectAnswer.push({ id: ex.id, lesson: lessonTitle, question: questionText })
      }

      const texts = answers.map(a => a?.text ?? '')
      if (new Set(texts).size < texts.length) {
        duplicateAnswerText.push({ id: ex.id, lesson: lessonTitle, question: questionText })
      }

      const correctText = (correctAnswers[0]?.text ?? '').toLowerCase()
      for (const word of KNOWN_WRONG_WORDS) {
        if (correctText === word.toLowerCase()) {
          knownWrongWords.push({ id: ex.id, lesson: lessonTitle, question: questionText, word })
        }
      }

      for (const old of OLD_SPELLING_VARIANTS) {
        if (old && fullText.includes(old)) {
          oldSpelling.push({ id: ex.id, lesson: lessonTitle, question: questionText, found: old })
          break
        }
      }

      if (fullText.includes('җ')) {
        tatarLetterZh.push({ id: ex.id, lesson: lessonTitle, question: questionText })
      }

      if (/означает|переводится/.test(questionText) && correctAnswers[0]) {
        const match = questionText.match(/'([^']+)'/)
        if (match) {
          const key = match[1].toLowerCase()
          if (!globalWordMeanings.has(key)) globalWordMeanings.set(key, new Set())
          globalWordMeanings.get(key)!.add(correctAnswers[0].text?.toLowerCase() ?? '')
        }
      }
    }

    const contradictions = Array.from(globalWordMeanings.entries())
      .filter(([, meanings]) => meanings.size > 1)
      .map(([word, meanings]) => ({ word, meanings: Array.from(meanings) }))

    const issueCount =
      lessonsBelow15.length + noCorrectAnswer.length + multiCorrectAnswer.length +
      duplicateAnswerText.length + knownWrongWords.length + oldSpelling.length +
      tatarLetterZh.length + contradictions.length

    return NextResponse.json({
      lessons_below_15: lessonsBelow15,
      no_correct_answer: noCorrectAnswer,
      multi_correct_answer: multiCorrectAnswer,
      duplicate_answer_text: duplicateAnswerText,
      known_wrong_words: knownWrongWords,
      old_spelling_variants: oldSpelling,
      tatar_letter_zh: tatarLetterZh,
      word_meaning_contradictions: contradictions,
      total_exercises: (allExercises ?? []).length,
      total_lessons: (allLessons ?? []).length,
      total_issues_found: issueCount,
      checked_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Verify content error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка: ' + (error?.message ?? String(error)) },
      { status: 500 }
    )
  }
}

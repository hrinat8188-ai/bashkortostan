import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Слова, которые ранее были подтверждены как неверные или несуществующие
// во время ручной проверки базы (сентябрь 2026). Если появляются как
// ПРАВИЛЬНЫЙ ответ — это почти наверняка та же старая ошибка вернулась.
const KNOWN_WRONG_WORDS = [
  'йыйылт', 'мәр', 'өтәү', 'аяу', 'абый', 'ыуаҙ', 'ызуаҙ',
  'үтереү', // в значении "бежать" — это "убивать"
]

// Слова, которые должны были быть заменены на верное написание.
// Если встречаются — значит проверка орфографии не сработала.
const OLD_SPELLING_VARIANTS = [
  'Хормат белэн', 'хормат белэн', 'Мерэжэгать', 'мерэжэгать',
  'Тэклиф', 'тэклиф', 'Тэкдим', 'тэкдим', 'Килешеу', 'килешеу',
  'Хокук', 'хокук', 'Нэтижэ', 'нэтижэ', 'Ҡырыҡ', 'ҡырыҡ',
  'Ыуаҙ', 'ыуаҙ',
]

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const report: Record<string, unknown> = {}

  // 1. Уроки с недостаточным количеством упражнений
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title_ru, exercises(id)')

  const lessonsBelow15 = (allLessons ?? [])
    .map((l: any) => ({ id: l.id, title: l.title_ru, count: (l.exercises ?? []).length }))
    .filter((l: any) => l.count < 15)
  report.lessons_below_15 = lessonsBelow15

  // 2. Упражнения без правильного ответа (сломанные)
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, lesson_id, question, answers, explanation, lessons(title_ru)')

  const noCorrectAnswer: any[] = []
  const multiCorrectAnswer: any[] = []
  const duplicateAnswerText: any[] = []
  const knownWrongWords: any[] = []
  const oldSpelling: any[] = []
  const tatarLetterZh: any[] = []
  const questionCorrectMap = new Map<string, Map<string, string>>() // lesson -> question -> correct
  const lessonQuestionSeen = new Map<string, Set<string>>() // lesson -> Set(question text) for dup detection

  for (const ex of allExercises ?? []) {
    const answers = ex.answers as { id: string; text: string; is_correct: boolean }[]
    const questionText = (ex.question as any)?.text ?? ''
    const explanationText = (ex.explanation as any)?.ru ?? ''
    const lessonTitle = (ex.lessons as any)?.title_ru ?? '?'
    const fullText = JSON.stringify(answers) + questionText + explanationText

    const correctAnswers = answers.filter(a => a.is_correct)
    if (correctAnswers.length === 0) {
      noCorrectAnswer.push({ id: ex.id, lesson: lessonTitle, question: questionText })
    }
    if (correctAnswers.length > 1) {
      multiCorrectAnswer.push({ id: ex.id, lesson: lessonTitle, question: questionText })
    }

    const texts = answers.map(a => a.text)
    if (new Set(texts).size < texts.length) {
      duplicateAnswerText.push({ id: ex.id, lesson: lessonTitle, question: questionText })
    }

    for (const word of KNOWN_WRONG_WORDS) {
      const correctText = correctAnswers[0]?.text?.toLowerCase() ?? ''
      if (correctText === word.toLowerCase()) {
        knownWrongWords.push({ id: ex.id, lesson: lessonTitle, question: questionText, word })
      }
    }

    for (const old of OLD_SPELLING_VARIANTS) {
      if (old && fullText.includes(old)) {
        oldSpelling.push({ id: ex.id, lesson: lessonTitle, question: questionText, found: old })
      }
    }

    if (fullText.includes('җ')) {
      tatarLetterZh.push({ id: ex.id, lesson: lessonTitle, question: questionText })
    }

    // Для поиска противоречий: "означает"/"переводится" + кавычки
    if (/означает|переводится/.test(questionText)) {
      const match = questionText.match(/'([^']+)'/)
      if (match && correctAnswers[0]) {
        const key = match[1].toLowerCase()
        if (!questionCorrectMap.has(lessonTitle)) questionCorrectMap.set(lessonTitle, new Map())
        // Используем глобальную карту (без привязки к уроку) — противоречия ищем по всей базе
      }
    }

    if (!lessonQuestionSeen.has(ex.lesson_id)) lessonQuestionSeen.set(ex.lesson_id, new Set())
  }

  // Глобальный поиск противоречий (слово -> разные значения)
  const globalWordMeanings = new Map<string, Set<string>>()
  for (const ex of allExercises ?? []) {
    const questionText = (ex.question as any)?.text ?? ''
    const answers = ex.answers as { text: string; is_correct: boolean }[]
    const correct = answers.find(a => a.is_correct)
    if (!correct) continue
    if (/означает|переводится/.test(questionText)) {
      const match = questionText.match(/'([^']+)'/)
      if (match) {
        const key = match[1].toLowerCase()
        if (!globalWordMeanings.has(key)) globalWordMeanings.set(key, new Set())
        globalWordMeanings.get(key)!.add(correct.text.toLowerCase())
      }
    }
  }
  const contradictions = Array.from(globalWordMeanings.entries())
    .filter(([, meanings]) => meanings.size > 1)
    .map(([word, meanings]) => ({ word, meanings: Array.from(meanings) }))

  report.no_correct_answer = noCorrectAnswer
  report.multi_correct_answer = multiCorrectAnswer
  report.duplicate_answer_text = duplicateAnswerText
  report.known_wrong_words = knownWrongWords
  report.old_spelling_variants = oldSpelling
  report.tatar_letter_zh = tatarLetterZh
  report.word_meaning_contradictions = contradictions
  report.total_exercises = (allExercises ?? []).length
  report.total_lessons = (allLessons ?? []).length
  report.checked_at = new Date().toISOString()

  const issueCount =
    lessonsBelow15.length + noCorrectAnswer.length + multiCorrectAnswer.length +
    duplicateAnswerText.length + knownWrongWords.length + oldSpelling.length +
    tatarLetterZh.length + contradictions.length
  report.total_issues_found = issueCount

  return NextResponse.json(report)
}

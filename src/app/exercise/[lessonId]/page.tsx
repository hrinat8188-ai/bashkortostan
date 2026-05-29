'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Exercise } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { haptic } from '@/lib/telegram'

type AnswerState = 'idle' | 'correct' | 'wrong'

export default function ExercisePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const router = useRouter()
  const { user, addXP } = useUser()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonXP, setLessonXP] = useState(15)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('title_ru, xp_reward')
        .eq('id', lessonId)
        .single()
      if (lesson) { setLessonTitle(lesson.title_ru); setLessonXP(lesson.xp_reward) }

      const { data: exs } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index')
      if (exs) setExercises(exs as Exercise[])
      setLoading(false)
    }
    load()
  }, [lessonId])

  const ex = exercises[current]
  const progress = exercises.length > 0 ? (current / exercises.length) * 100 : 0

  const handleAnswer = useCallback((answerId: string) => {
    if (answerState !== 'idle') return
    setSelected(answerId)

    const correctAnswer = ex.answers.find(a => a.is_correct)
    const isCorrect = answerId === correctAnswer?.id

    if (isCorrect) {
      setAnswerState('correct')
      setScore(s => s + 1)
      haptic('success')
    } else {
      setAnswerState('wrong')
      setLives(l => l - 1)
      haptic('error')
    }
  }, [answerState, ex])

  const handleNext = useCallback(async () => {
    if (lives <= 0 && answerState === 'wrong') {
      // Проигрыш
      setFinished(true)
      return
    }
    if (current + 1 >= exercises.length) {
      // Завершили все упражнения
      setFinished(true)
      if (user) {
        // Сохраняем прогресс
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          score: Math.round((score / exercises.length) * 100),
          completed_at: new Date().toISOString(),
        })
        // Начисляем XP
        await addXP(lessonXP)
        // Обновляем серию
        await supabase.from('streaks').upsert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          xp_earned: lessonXP,
        }, { onConflict: 'user_id,date' })
      }
      return
    }
    setSelected(null)
    setAnswerState('idle')
    setCurrent(c => c + 1)
  }, [current, exercises.length, lives, answerState, user, lessonId, score, addXP, lessonXP])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>📝</div>
      <div style={{ color: 'var(--text-2)' }}>Загружаем упражнения…</div>
    </div>
  )

  if (exercises.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: '0 32px' }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ fontSize: 16, fontWeight: 500, textAlign: 'center' }}>Упражнения пока не добавлены</div>
      <button className="btn-primary" onClick={() => router.back()}>Назад</button>
    </div>
  )

  if (finished) {
    const accuracy = Math.round((score / exercises.length) * 100)
    const passed = accuracy >= 60
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '32px 24px', gap: 20, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ fontSize: 72 }}>{passed ? '🎉' : '💪'}</div>
        <div style={{ fontSize: 24, fontWeight: 600, textAlign: 'center' }}>
          {passed ? 'Урок завершён!' : 'Почти получилось!'}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 15 }}>
          {passed ? `Правильных ответов: ${score} из ${exercises.length}` : 'Попробуй ещё раз — с каждым разом лучше!'}
        </div>
        {passed && (
          <div style={{
            background: 'var(--accent-light)', borderRadius: 16, padding: '16px 24px',
            textAlign: 'center', width: '100%',
          }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent)' }}>+{lessonXP} XP</div>
            <div style={{ fontSize: 13, color: 'var(--accent-dark)' }}>Точность {accuracy}%</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {!passed && (
            <button className="btn-primary" onClick={() => {
              setCurrent(0); setSelected(null); setAnswerState('idle')
              setLives(3); setScore(0); setFinished(false)
            }}>
              🔄 Попробовать снова
            </button>
          )}
          <button
            className={passed ? 'btn-primary' : 'btn-outline'}
            onClick={() => router.back()}
          >
            {passed ? '→ Следующий урок' : '← Назад к урокам'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Шапка */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', fontSize: 22,
          color: 'var(--text-2)', cursor: 'pointer', padding: 0,
        }}>✕</button>
        <div style={{ flex: 1 }}>
          <div style={{
            height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: 'var(--accent)', borderRadius: 3,
              width: `${progress}%`, transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, fontSize: 18 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>❤️</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', fontSize: 12, color: 'var(--text-2)' }}>
        {lessonTitle} · {current + 1} из {exercises.length}
      </div>

      {/* Вопрос */}
      <div style={{ margin: '12px 16px 0', background: 'var(--surface)', borderRadius: 'var(--radius-card)', padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
          {getTypeLabel(ex.type)}
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
          {ex.question.text}
        </div>
        {ex.question.translation && (
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>
            {ex.question.translation}
          </div>
        )}
        {ex.question.audio_url && (
          <button
            onClick={() => {
              const audio = new Audio(ex.question.audio_url!)
              audio.play()
              haptic('light')
            }}
            style={{
              marginTop: 12, background: 'var(--accent-light)', color: 'var(--accent)',
              border: 'none', borderRadius: 20, padding: '8px 16px',
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔊 Послушать
          </button>
        )}
      </div>

      {/* Варианты ответов */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: ex.answers.length <= 2 ? '1fr' : '1fr 1fr',
        gap: 10, padding: '14px 16px 0',
      }}>
        {ex.answers.map(answer => {
          const isSelected = selected === answer.id
          const showResult = answerState !== 'idle' && isSelected
          const isCorrectAnswer = answer.is_correct && answerState !== 'idle'

          let bg = 'var(--bg)'
          let border = 'var(--border)'
          let color = 'var(--text)'
          if (isCorrectAnswer) { bg = 'var(--accent-light)'; border = 'var(--accent)'; color = 'var(--accent-dark)' }
          else if (showResult && !answer.is_correct) { bg = '#FCEBEB'; border = '#E24B4A'; color = '#A32D2D' }

          return (
            <button key={answer.id}
              onClick={() => handleAnswer(answer.id)}
              style={{
                background: bg, border: `1.5px solid ${border}`, borderRadius: 'var(--radius-card)',
                padding: '14px 12px', fontSize: 14, fontWeight: 500, color,
                cursor: answerState === 'idle' ? 'pointer' : 'default',
                textAlign: 'center', transition: 'all 0.15s',
                animation: showResult && !answer.is_correct ? 'shake 0.4s ease' : 'none',
              }}
            >
              {answer.is_correct && answerState !== 'idle' ? '✓ ' : ''}{answer.text}
            </button>
          )
        })}
      </div>

      {/* Объяснение */}
      {answerState !== 'idle' && ex.explanation?.ru && (
        <div style={{
          margin: '14px 16px 0',
          background: answerState === 'correct' ? 'var(--accent-light)' : '#FCEBEB',
          borderRadius: 12, padding: '12px 14px',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: answerState === 'correct' ? 'var(--accent-dark)' : '#A32D2D', marginBottom: 4 }}>
            {answerState === 'correct' ? '✅ Правильно!' : '❌ Неправильно'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
            {ex.explanation.ru}
          </div>
        </div>
      )}

      {/* Кнопка далее */}
      <div style={{ flex: 1 }} />
      {answerState !== 'idle' && (
        <div style={{ padding: '16px', animation: 'slideUp 0.3s ease' }}>
          <button className="btn-primary" onClick={handleNext}>
            {current + 1 >= exercises.length ? '🏁 Завершить урок' : 'Далее →'}
          </button>
        </div>
      )}
    </div>
  )
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    multiple_choice: '🔤 Выберите правильный ответ',
    translation: '🔄 Переведите на русский',
    listening: '🎧 Выберите услышанное слово',
    fill_blank: '✏️ Вставьте пропущенное слово',
    word_match: '🔗 Сопоставьте слова',
    sentence_build: '🧩 Составьте предложение',
    speaking: '🎤 Произнесите вслух',
  }
  return map[type] ?? '❓ Вопрос'
}

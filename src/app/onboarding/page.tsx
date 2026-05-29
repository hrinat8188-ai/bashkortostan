'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { haptic } from '@/lib/telegram'

type Step = 'welcome' | 'goal' | 'time' | 'test' | 'result'

const PLACEMENT_QUESTIONS = [
  {
    q: 'Что означает "Исәнмесегеҙ"?',
    opts: ['Пока!', 'Здравствуйте', 'Спасибо', 'Извините'],
    correct: 1, level: 'A0'
  },
  {
    q: 'Переведи: "Минең ғаиләм"',
    opts: ['Мой друг', 'Моя семья', 'Мой дом', 'Моя работа'],
    correct: 1, level: 'A1'
  },
  {
    q: 'Какое слово означает "город" по-башкирски?',
    opts: ['Ҡала', 'Өй', 'Ҡош', 'Ер'],
    correct: 0, level: 'A1'
  },
  {
    q: 'Какой звук обозначает буква Ҡ?',
    opts: ['Обычный К', 'Увулярный К (глубже)', 'Щ', 'Х'],
    correct: 1, level: 'A2'
  },
  {
    q: '"Рәхмәт" означает:',
    opts: ['Привет', 'Пожалуйста', 'Спасибо', 'До свидания'],
    correct: 2, level: 'A0'
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState<Step>('welcome')
  const [goal, setGoal] = useState('')
  const [time, setTime] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  function handleAnswer(i: number) {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    haptic(i === PLACEMENT_QUESTIONS[qIndex].correct ? 'success' : 'error')
    if (i === PLACEMENT_QUESTIONS[qIndex].correct) setCorrectCount(c => c + 1)
  }

  async function nextQuestion() {
    if (qIndex + 1 >= PLACEMENT_QUESTIONS.length) {
      setStep('result')
    } else {
      setQIndex(q => q + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  async function finish() {
    if (!user) return
    const detectedLevel = correctCount <= 1 ? 'A0' : correctCount <= 3 ? 'A1' : 'A2'
    await supabase.from('users').update({ current_level: detectedLevel }).eq('id', user.id)
    router.push('/')
  }

  if (step === 'welcome') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 24, animation: 'fadeIn 0.5s ease' }}>
      <div style={{ fontSize: 72 }}>🌿</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Башкортса</div>
        <div style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Изучай башкирский язык<br />от нуля до свободного общения
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {['🎯 Пошаговые уроки A0 → C1', '🤖 AI-помощник по грамматике', '🔁 Умное повторение слов', '🔥 Ежедневные серии и достижения'].map((f, i) => (
          <div key={i} style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 12, fontSize: 14, color: 'var(--text)' }}>{f}</div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => setStep('goal')}>Начать → </button>
    </div>
  )

  if (step === 'goal') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '48px 24px 32px', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Шаг 1 из 3</div>
      <div style={{ fontSize: 22, fontWeight: 500 }}>Зачем учишь башкирский? 🎯</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['heritage', '👨‍👩‍👧 Корни и семья', 'Общение с родственниками'],
          ['travel', '✈️ Путешествия', 'Поездки в Башкортостан'],
          ['culture', '🎭 Культура', 'Литература, кино, музыка'],
          ['work', '💼 Работа', 'Карьера в регионе'],
          ['curious', '🧠 Интерес', 'Просто хочу знать'],
        ].map(([key, title, desc]) => (
          <button key={key} onClick={() => { setGoal(key); haptic('light') }}
            style={{
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              border: `1.5px solid ${goal === key ? 'var(--accent)' : 'var(--border)'}`,
              background: goal === key ? 'var(--accent-light)' : 'var(--bg)',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{desc}</div>
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={() => goal && setStep('time')} style={{ marginTop: 'auto', opacity: goal ? 1 : 0.5 }}>
        Далее →
      </button>
    </div>
  )

  if (step === 'time') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '48px 24px 32px', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Шаг 2 из 3</div>
      <div style={{ fontSize: 22, fontWeight: 500 }}>Сколько минут в день? ⏱</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[[5, '5 мин', 'Быстро'], [10, '10 мин', 'Стабильно'], [15, '15 мин', 'Активно'], [20, '20+ мин', 'Интенсивно']].map(([val, label, desc]) => (
          <button key={val} onClick={() => { setTime(val as number); haptic('light') }}
            style={{
              padding: '16px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              border: `1.5px solid ${time === val ? 'var(--accent)' : 'var(--border)'}`,
              background: time === val ? 'var(--accent-light)' : 'var(--bg)',
            }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: time === val ? 'var(--accent)' : 'var(--text)' }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{desc}</div>
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={() => time && setStep('test')} style={{ marginTop: 'auto', opacity: time ? 1 : 0.5 }}>
        Пройти тест на уровень →
      </button>
    </div>
  )

  if (step === 'test') {
    const q = PLACEMENT_QUESTIONS[qIndex]
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>Тест · {qIndex + 1} из {PLACEMENT_QUESTIONS.length}</div>
        <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: '100%', background: 'var(--accent)', width: `${((qIndex) / PLACEMENT_QUESTIONS.length) * 100}%`, transition: 'width 0.4s' }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, lineHeight: 1.4 }}>{q.q}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.opts.map((opt, i) => {
            let bg = 'var(--bg)', border = 'var(--border)', color = 'var(--text)'
            if (answered) {
              if (i === q.correct) { bg = 'var(--accent-light)'; border = 'var(--accent)'; color = 'var(--accent-dark)' }
              else if (i === selected) { bg = '#FCEBEB'; border = '#E24B4A'; color = '#A32D2D' }
            } else if (i === selected) { border = 'var(--accent)' }
            return (
              <button key={i} onClick={() => handleAnswer(i)}
                style={{ padding: '14px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                {i === q.correct && answered ? '✓ ' : ''}{opt}
              </button>
            )
          })}
        </div>
        {answered && (
          <button className="btn-primary" onClick={nextQuestion} style={{ marginTop: 'auto', marginTop: 24, animation: 'slideUp 0.3s ease' }}>
            {qIndex + 1 >= PLACEMENT_QUESTIONS.length ? 'Посмотреть результат →' : 'Следующий вопрос →'}
          </button>
        )}
      </div>
    )
  }

  if (step === 'result') {
    const detectedLevel = correctCount <= 1 ? 'A0' : correctCount <= 3 ? 'A1' : 'A2'
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 20, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Твой уровень: {detectedLevel}</div>
          <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Правильных ответов: {correctCount} из {PLACEMENT_QUESTIONS.length}<br />
            {detectedLevel === 'A0' ? 'Начнём с самых основ — алфавита и приветствий.' : detectedLevel === 'A1' ? 'Базовые знания есть! Продолжим с семьёй и числами.' : 'Хороший старт! Начнём с элементарного уровня.'}
          </div>
        </div>
        <button className="btn-primary" onClick={finish} style={{ width: '100%' }}>
          Начать обучение →
        </button>
      </div>
    )
  }

  return null
}

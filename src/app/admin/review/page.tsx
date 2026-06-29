'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Exercise = {
  id: string
  lesson_id: string
  question: { text: string }
  answers: { id: string; text: string; is_correct: boolean }[]
  explanation: { ru: string }
  lesson_title?: string
  level?: string
}

export default function ReviewPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState('all')
  const [deleted, setDeleted] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('exercises')
      .select('*, lessons(title_ru, modules(courses(level)))')
      .order('lesson_id')
      .limit(200)

    if (data) {
      setExercises(data.map((e: any) => ({
        ...e,
        lesson_title: e.lessons?.title_ru ?? '?',
        level: e.lessons?.modules?.courses?.level ?? '?',
      })))
    }
    setLoading(false)
  }

  async function deleteExercise(id: string) {
    await supabase.from('exercises').delete().eq('id', id)
    setExercises(prev => prev.filter(e => e.id !== id))
    setDeleted(d => d + 1)
  }

  const filtered = filterLevel === 'all'
    ? exercises
    : exercises.filter(e => e.level === filterLevel)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px', fontFamily: 'system-ui' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F6E56, #1D9E75)', borderRadius: 16, padding: '16px 20px', color: 'white', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Проверка упражнений</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Всего: {exercises.length} · Удалено: {deleted}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', 'A0', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => (
          <button key={level} onClick={() => setFilterLevel(level)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: '1px solid #ddd',
            background: filterLevel === level ? '#1D9E75' : '#f5f5f5',
            color: filterLevel === level ? 'white' : '#333',
          }}>{level === 'all' ? `Все (${exercises.length})` : `${level} (${exercises.filter(e => e.level === level).length})`}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Загружаем...</div>
      ) : (
        filtered.map((ex, i) => (
          <div key={ex.id} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: 20 }}>
                {ex.level} · {ex.lesson_title}
              </span>
              <button onClick={() => deleteExercise(ex.id)} style={{
                background: '#FCEBEB', color: '#E24B4A', border: '1px solid #E24B4A',
                borderRadius: 8, padding: '3px 10px', fontSize: 12, cursor: 'pointer',
              }}>🗑 Удалить</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{i + 1}. {ex.question?.text}</div>
            {ex.answers?.map((a, j) => (
              <div key={j} style={{
                padding: '5px 10px', borderRadius: 8, marginBottom: 4, fontSize: 13,
                background: a.is_correct ? '#E1F5EE' : '#f5f5f5',
                color: a.is_correct ? '#0F6E56' : '#555',
              }}>{a.is_correct ? '✓ ' : ''}{a.text}</div>
            ))}
            {ex.explanation?.ru && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                💡 {ex.explanation.ru}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

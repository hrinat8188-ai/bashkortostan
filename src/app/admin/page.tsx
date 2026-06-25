'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Lesson = { id: string; title_ru: string; level: string }
type GeneratedExercise = {
  question: string
  answers: { text: string; is_correct: boolean }[]
  explanation: string
}

export default function AdminPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedExercise[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentCount, setCurrentCount] = useState(0)
  const [filterLevel, setFilterLevel] = useState('all')

  useEffect(() => {
    supabase.from('lessons').select('id, title_ru, modules(courses(level))').then(({ data }) => {
      if (!data) return
      const list = data.map((l: any) => ({
        id: l.id,
        title_ru: l.title_ru,
        level: l.modules?.courses?.level ?? '?'
      })).sort((a: Lesson, b: Lesson) => a.level.localeCompare(b.level))
      setLessons(list)
    })
  }, [])

  async function loadCurrentCount(lessonId: string) {
    const { count } = await supabase
      .from('exercises').select('*', { count: 'exact', head: true }).eq('lesson_id', lessonId)
    setCurrentCount(count ?? 0)
  }

  async function generate() {
    if (!selectedLesson) return
    setLoading(true)
    setGenerated([])
    setSaved(false)
    try {
      const res = await fetch('/api/admin/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle: selectedLesson.title_ru, level: selectedLesson.level, count }),
      })
      const data = await res.json()
      setGenerated(data.exercises ?? [])
    } catch {
      alert('Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  async function saveAll() {
    if (!selectedLesson || generated.length === 0) return
    setSaving(true)
    const { data: existing } = await supabase.from('exercises').select('order_index')
      .eq('lesson_id', selectedLesson.id).order('order_index', { ascending: false }).limit(1)
    const startIndex = (existing?.[0]?.order_index ?? 0) + 1
    const difficulty = selectedLesson.level === 'A0' ? 1 : selectedLesson.level === 'A1' ? 1 :
      selectedLesson.level === 'A2' ? 2 : selectedLesson.level === 'B1' ? 3 :
      selectedLesson.level === 'B2' ? 4 : 5
    const rows = generated.map((ex, i) => ({
      lesson_id: selectedLesson.id,
      type: 'multiple_choice',
      question: { text: ex.question },
      answers: ex.answers.map((a, j) => ({ id: String(j + 1), text: a.text, is_correct: a.is_correct })),
      explanation: { ru: ex.explanation },
      difficulty,
      order_index: startIndex + i,
    }))
    const { error } = await supabase.from('exercises').insert(rows)
    if (error) alert('Ошибка: ' + error.message)
    else { setSaved(true); setCurrentCount(c => c + generated.length); setGenerated([]) }
    setSaving(false)
  }

  const filteredLessons = filterLevel === 'all' ? lessons : lessons.filter(l => l.level === filterLevel)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', fontFamily: 'system-ui' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F6E56, #1D9E75)', borderRadius: 16, padding: '16px 20px', color: 'white', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Башкортса — Админ</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>AI-генератор упражнений</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Уровень:</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'A0', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => (
            <button key={level} onClick={() => setFilterLevel(level)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: '1px solid #ddd',
              background: filterLevel === level ? '#1D9E75' : '#f5f5f5',
              color: filterLevel === level ? 'white' : '#333',
            }}>{level === 'all' ? 'Все' : level}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Урок:</div>
        <select onChange={e => {
          const lesson = lessons.find(l => l.id === e.target.value) ?? null
          setSelectedLesson(lesson); setGenerated([]); setSaved(false)
          if (lesson) loadCurrentCount(lesson.id)
        }} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14 }}>
          <option value="">-- Выбери урок --</option>
          {filteredLessons.map(l => <option key={l.id} value={l.id}>[{l.level}] {l.title_ru}</option>)}
        </select>
      </div>

      {selectedLesson && (
        <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          <strong>{selectedLesson.title_ru}</strong> · {selectedLesson.level}<br />
          <span style={{ color: '#0F6E56' }}>Упражнений сейчас: {currentCount}</span>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Сколько генерировать:</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[5, 10, 15, 20].map(n => (
            <button key={n} onClick={() => setCount(n)} style={{
              flex: 1, padding: 10, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              border: '1px solid #ddd',
              background: count === n ? '#1D9E75' : '#f5f5f5',
              color: count === n ? 'white' : '#333',
            }}>{n}</button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={!selectedLesson || loading} style={{
        width: '100%', padding: 14, borderRadius: 50, fontSize: 15, fontWeight: 500,
        background: !selectedLesson || loading ? '#ccc' : '#1D9E75',
        color: 'white', border: 'none', cursor: 'pointer', marginBottom: 16,
      }}>
        {loading ? 'Генерирую...' : 'Сгенерировать упражнения'}
      </button>

      {generated.length > 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Сгенерировано {generated.length}:</div>
          {generated.map((ex, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{i + 1}. {ex.question}</div>
              {ex.answers.map((a, j) => (
                <div key={j} style={{
                  padding: '6px 10px', borderRadius: 8, marginBottom: 4, fontSize: 13,
                  background: a.is_correct ? '#E1F5EE' : '#f5f5f5',
                  color: a.is_correct ? '#0F6E56' : '#555',
                  fontWeight: a.is_correct ? 500 : 400,
                }}>{a.is_correct ? '✓ ' : ''}{a.text}</div>
              ))}
              {ex.explanation && <div style={{ marginTop: 8, fontSize: 12, color: '#888', fontStyle: 'italic' }}>💡 {ex.explanation}</div>}
            </div>
          ))}
          <button onClick={saveAll} disabled={saving} style={{
            width: '100%', padding: 14, borderRadius: 50, fontSize: 15, fontWeight: 500,
            background: saving ? '#ccc' : '#0F6E56', color: 'white', border: 'none', cursor: 'pointer',
          }}>{saving ? 'Сохраняю...' : `Сохранить ${generated.length} упражнений`}</button>
        </div>
      )}

      {saved && (
        <div style={{ background: '#E1F5EE', border: '1px solid #1D9E75', borderRadius: 12, padding: '14px 16px', textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 28 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0F6E56' }}>Сохранено! Выбери следующий урок.</div>
        </div>
      )}
    </div>
  )
}

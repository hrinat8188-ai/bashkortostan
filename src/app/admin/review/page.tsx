'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Exercise = {
  id: string
  lesson_id: string
  question: { text: string }
  answers: { id: string; text: string; is_correct: boolean }[]
  explanation: { ru: string }
}

type Lesson = {
  id: string
  title_ru: string
  level: string
  exercises: Exercise[]
}

export default function ReviewPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState('all')
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [deletedCount, setDeletedCount] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title_ru, modules(courses(level, order_index))')
      .order('title_ru')
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .order('order_index')

    if (lessonsData && exercisesData) {
      const merged = lessonsData.map((l: any) => ({
        id: l.id,
        title_ru: l.title_ru,
        level: l.modules?.courses?.level ?? '?',
        orderIndex: l.modules?.courses?.order_index ?? 0,
        exercises: exercisesData.filter(e => e.lesson_id === l.id),
      })).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      setLessons(merged)
    }
    setLoading(false)
  }

  async function deleteExercise(id: string, lessonId: string) {
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) { alert('Ошибка удаления: ' + error.message); return }
    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, exercises: l.exercises.filter(e => e.id !== id) } : l
    ))
    setDeletedCount(c => c + 1)
  }

  const filteredLessons = filterLevel === 'all' ? lessons : lessons.filter(l => l.level === filterLevel)
  const totalExercises = lessons.reduce((sum, l) => sum + l.exercises.length, 0)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px', fontFamily: 'system-ui' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F6E56, #1D9E75)', borderRadius: 16, padding: '16px 20px', color: 'white', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Проверка упражнений</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Всего: {totalExercises} · Уроков: {lessons.length} · Удалено: {deletedCount}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', 'A0', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => {
          const count = level === 'all' ? lessons.length : lessons.filter(l => l.level === level).length
          return (
            <button key={level} onClick={() => setFilterLevel(level)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: '1px solid #ddd',
              background: filterLevel === level ? '#1D9E75' : '#f5f5f5',
              color: filterLevel === level ? 'white' : '#333',
            }}>{level === 'all' ? `Все (${count})` : `${level} (${count})`}</button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Загружаем...</div>
      ) : filteredLessons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Уроков не найдено</div>
      ) : (
        filteredLessons.map(lesson => (
          <div key={lesson.id} style={{ marginBottom: 10 }}>
            <div onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)} style={{
              background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
            }}>
              <div>
                <span style={{ fontSize: 11, background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: 20, marginRight: 8 }}>
                  {lesson.level}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{lesson.title_ru}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: lesson.exercises.length === 0 ? '#E24B4A' : lesson.exercises.length < 5 ? '#BA7517' : '#1D9E75',
                }}>{lesson.exercises.length} упр.</span>
                <span style={{ color: '#999' }}>{expandedLesson === lesson.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedLesson === lesson.id && (
              <div style={{ padding: '10px 4px' }}>
                {lesson.exercises.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>
                    Нет упражнений — сгенерируй в /admin
                  </div>
                ) : (
                  lesson.exercises.map((ex, i) => (
                    <div key={ex.id} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#999' }}>#{i + 1}</span>
                        <button onClick={() => deleteExercise(ex.id, lesson.id)} style={{
                          background: '#FCEBEB', color: '#E24B4A', border: '1px solid #E24B4A',
                          borderRadius: 8, padding: '2px 10px', fontSize: 11, cursor: 'pointer',
                        }}>Удалить</button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{ex.question?.text}</div>
                      {ex.answers?.map((a, j) => (
                        <div key={j} style={{
                          padding: '4px 10px', borderRadius: 6, marginBottom: 3, fontSize: 13,
                          background: a.is_correct ? '#E1F5EE' : '#f0f0f0',
                          color: a.is_correct ? '#0F6E56' : '#555',
                        }}>{a.is_correct ? '✓ ' : ''}{a.text}</div>
                      ))}
                      {ex.explanation?.ru && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#888', fontStyle: 'italic' }}>💡 {ex.explanation.ru}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

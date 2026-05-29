'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { supabase, type Course } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

const LEVEL_META: Record<string, { emoji: string; color: string; bg: string }> = {
  A0: { emoji: '🌱', color: '#1D9E75', bg: '#E1F5EE' },
  A1: { emoji: '📗', color: '#378ADD', bg: '#E6F1FB' },
  A2: { emoji: '📘', color: '#BA7517', bg: '#FAEEDA' },
  B1: { emoji: '🏆', color: '#D4537E', bg: '#FBEAF0' },
  B2: { emoji: '⭐', color: '#533AB7', bg: '#EEEDFE' },
  C1: { emoji: '👑', color: '#26215C', bg: '#E8E7F5' },
}

export default function CoursesPage() {
  const { user } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase.from('courses').select('*').order('order_index').then(({ data }) => {
      if (data) setCourses(data)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    // Подсчёт прогресса по каждому курсу
    supabase
      .from('user_progress')
      .select('lesson_id, status, lessons(module_id, modules(course_id))')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .then(({ data }) => {
        if (!data) return
        const counts: Record<string, number> = {}
        data.forEach((p: any) => {
          const courseId = p.lessons?.modules?.course_id
          if (courseId) counts[courseId] = (counts[courseId] ?? 0) + 1
        })
        setProgress(counts)
      })
  }, [user])

  const userLevelIndex = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'].indexOf(user?.current_level ?? 'A0')

  return (
    <div className="safe-bottom">
      <TopBar title="Курсы" subtitle="A0 → C1 · Полный путь" />

      {/* Алфавит */}
      <div style={{ margin: '12px 16px 0' }}>
        <Link href="/courses/alphabet" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #BA7517, #E8A020)',
            borderRadius: 'var(--radius-card)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14, color: 'white',
          }}>
            <div style={{ fontSize: 36 }}>🔤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Башкирский алфавит</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>42 буквы · Озвучка · Произношение</div>
            </div>
            <span style={{ fontSize: 20 }}>→</span>
          </div>
        </Link>
      </div>

      <div className="section-title">Уровни языка</div>

      {courses.map((course, idx) => {
        const meta = LEVEL_META[course.level] ?? LEVEL_META.A0
        const isUnlocked = idx <= userLevelIndex + 1
        const isActive = course.level === user?.current_level
        const completedCount = progress[course.id] ?? 0
        const pct = course.total_lessons > 0
          ? Math.min(100, Math.round((completedCount / course.total_lessons) * 100))
          : 0

        return (
          <div key={course.id} style={{ margin: '6px 16px' }}>
            <Link href={isUnlocked ? `/courses/${course.level}` : '#'} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                display: 'flex', alignItems: 'center', gap: 14, cursor: isUnlocked ? 'pointer' : 'default',
                opacity: isUnlocked ? 1 : 0.45,
                border: isActive ? `2px solid ${meta.color}` : undefined,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {meta.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{course.level} — {course.title_ru}</span>
                    {isActive && <span className="badge badge-green">Активный</span>}
                    {pct === 100 && <span style={{ fontSize: 16 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{course.description}</div>
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                      {pct === 0 ? 'Не начат' : pct === 100 ? 'Завершён' : `${pct}% · ${completedCount} из ${course.total_lessons} уроков`}
                    </div>
                  </div>
                </div>
                <span style={{ color: isUnlocked ? meta.color : 'var(--text-3)', fontSize: 18 }}>
                  {isUnlocked ? '→' : '🔒'}
                </span>
              </div>
            </Link>
          </div>
        )
      })}

      <BottomNav />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

type Module = {
  id: string
  title: string
  type: string
  order_index: number
  xp_reward: number
  is_premium: boolean
  lessons: Lesson[]
}

type Lesson = {
  id: string
  title_ru: string
  title_bashkir: string
  duration_minutes: number
  order_index: number
  is_premium: boolean
  xp_reward: number
}

const TYPE_EMOJI: Record<string, string> = {
  vocabulary: '📝', grammar: '📐', audio: '🎧',
  dialogue: '💬', test: '✅', speaking: '🎤', default: '📚',
}

export default function LevelPage() {
  const { level } = useParams<{ level: string }>()
  const { user } = useUser()
  const [modules, setModules] = useState<Module[]>([])
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: course } = await supabase
        .from('courses').select('id').eq('level', level).single()
      if (!course) return

      const { data: mods } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', course.id)
        .order('order_index')
      if (mods) setModules(mods as Module[])
      setLoading(false)
    }
    load()
  }, [level])

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .then(({ data }) => {
        if (data) setCompletedLessons(new Set(data.map(d => d.lesson_id)))
      })
  }, [user])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ color: 'var(--text-2)' }}>Загружаем уроки…</div>
    </div>
  )

  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0)
  const completedInLevel = modules.reduce((s, m) =>
    s + (m.lessons?.filter(l => completedLessons.has(l.id)).length ?? 0), 0)

  return (
    <div className="safe-bottom">
      <TopBar title={`Уровень ${level}`} subtitle={`${completedInLevel} из ${totalLessons} уроков`} showBack />

      {/* Прогресс уровня */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-2)' }}>
          <span>Прогресс уровня</span>
          <span>{totalLessons > 0 ? Math.round((completedInLevel / totalLessons) * 100) : 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: totalLessons > 0 ? `${(completedInLevel / totalLessons) * 100}%` : '0%'
          }} />
        </div>
      </div>

      {modules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--text-2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Уроки в разработке</div>
          <div style={{ fontSize: 14 }}>Контент для уровня {level} скоро появится!</div>
        </div>
      ) : (
        modules.map(mod => (
          <div key={mod.id}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{TYPE_EMOJI[mod.type] ?? TYPE_EMOJI.default}</span>
              <span>{mod.title}</span>
              {mod.is_premium && <span className="badge badge-gold">Premium</span>}
            </div>

            {(mod.lessons ?? []).sort((a, b) => a.order_index - b.order_index).map((lesson, idx) => {
              const done = completedLessons.has(lesson.id)
              const isLocked = lesson.is_premium && !user?.is_premium
              const prevDone = idx === 0 || completedLessons.has(mod.lessons[idx - 1]?.id)
              const accessible = !isLocked && (idx === 0 || prevDone || done)

              return (
                <div key={lesson.id} style={{ margin: '5px 16px' }}>
                  <Link href={accessible ? `/exercise/${lesson.id}` : '#'} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      opacity: accessible ? 1 : 0.45,
                      border: done ? '0.5px solid var(--accent)' : undefined,
                      cursor: accessible ? 'pointer' : 'default',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: done ? 'var(--accent)' : 'var(--surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: done ? 18 : 14, color: done ? 'white' : 'var(--text-2)',
                        fontWeight: 500,
                      }}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{lesson.title_ru}</div>
                        {lesson.title_bashkir && (
                          <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>{lesson.title_bashkir}</div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                          {lesson.duration_minutes} мин · +{lesson.xp_reward} XP
                        </div>
                      </div>
                      <span style={{ color: accessible ? 'var(--accent)' : 'var(--text-3)', fontSize: 18 }}>
                        {isLocked ? '🔒' : done ? '🏅' : '→'}
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ))
      )}

      <BottomNav />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import { useUser } from '@/hooks/useUser'
import { useTelegram } from '@/hooks/useTelegram'
import { supabase } from '@/lib/supabase'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function HomePage() {
  const { user, loading } = useUser()
  const { haptic } = useTelegram()
  const [streakDates, setStreakDates] = useState<string[]>([])
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (!user) return
    // Загружаем серию за последние 7 дней
    const loadStreak = async () => {
      const from = new Date()
      from.setDate(from.getDate() - 6)
      const { data } = await supabase
        .from('streaks')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', from.toISOString().split('T')[0])
      if (data) setStreakDates(data.map(d => d.date))
    }
    // Слова на повторение сегодня
    const loadReview = async () => {
      const { count } = await supabase
        .from('user_vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
      setReviewCount(count ?? 0)
    }
    loadStreak()
    loadReview()
  }, [user])

  // Получаем даты последних 7 дней
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐴</div>
          <div style={{ color: 'var(--text-2)', fontSize: 14 }}>Загружаем…</div>
        </div>
      </div>
    )
  }

  const levelProgress = (user?.xp ?? 0) % 500
  const levelPct = Math.round((levelProgress / 500) * 100)

  return (
    <div className="safe-bottom">
      {/* Шапка */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)',
        borderBottom: '0.5px solid var(--border)',
        padding: '14px 16px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 500 }}>Башкортса 🌿</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Изучай башкирский язык</div>
        </div>
        <Link href="/profile">
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 500,
          }}>
            {(user?.first_name?.[0] ?? '?').toUpperCase()}
          </div>
        </Link>
      </div>

      {/* Героический блок */}
      <div style={{
        margin: '16px 16px 0',
        background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 60%, #5DCAA5 100%)',
        borderRadius: 'var(--radius-card)', padding: 20, color: 'white',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
          {getGreeting()}, {user?.first_name ?? 'друг'}!
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 14 }}>
          Хәйерле {getDayBashkir()}! 🌿
        </div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{user?.total_words ?? 0}</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>слов</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{user?.current_level ?? 'A0'}</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>уровень</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{user?.streak_days ?? 0}</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>🔥 дней</div>
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', background: 'white', borderRadius: 3, width: `${levelPct}%`, transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>{levelPct}% до следующего уровня · {user?.xp ?? 0} XP</div>
      </div>

      {/* Кнопка продолжить */}
      <div style={{ padding: '12px 16px 0' }}>
        <Link href="/courses">
          <button className="btn-primary" onClick={() => haptic('light')}>
            ▶ Продолжить обучение
          </button>
        </Link>
      </div>

      {/* Повторение если есть */}
      {reviewCount > 0 && (
        <div style={{ margin: '12px 16px 0' }}>
          <Link href="/vocabulary?tab=review">
            <div style={{
              background: 'var(--gold-light)',
              border: '0.5px solid var(--gold)',
              borderRadius: 'var(--radius-card)',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>🔁</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#7a4f0a' }}>
                  {reviewCount} слов ждут повторения
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold)' }}>Нажми, чтобы повторить сейчас</div>
              </div>
              <span style={{ color: 'var(--gold)' }}>→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Серия дней */}
      <div className="section-title">Серия дней</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px' }}>
        {last7Days.map((date, i) => {
          const done = streakDates.includes(date)
          const isToday = date === new Date().toISOString().split('T')[0]
          return (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 16 : 12,
                background: done ? 'var(--accent)' : isToday ? 'var(--accent-light)' : 'var(--surface)',
                color: done ? 'white' : isToday ? 'var(--accent)' : 'var(--text-2)',
                border: isToday ? '2px solid var(--accent)' : '0.5px solid var(--border)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{DAYS[i]}</div>
            </div>
          )
        })}
      </div>

      {/* Статистика */}
      <div className="section-title">Сегодня</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
        <div className="card-surface" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>🔥</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#E24B4A' }}>{user?.streak_days ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>дней подряд</div>
        </div>
        <div className="card-surface" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>⭐</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--gold)' }}>{user?.xp ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>XP очков</div>
        </div>
      </div>

      {/* Быстрые разделы */}
      <div className="section-title">Быстрый доступ</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
        {[
          { href: '/courses', emoji: '📚', title: 'Курсы', desc: 'A0 → C1' },
          { href: '/vocabulary', emoji: '📖', title: 'Словарь', desc: `${user?.total_words ?? 0} слов` },
          { href: '/ai', emoji: '🤖', title: 'AI-помощник', desc: 'Грамматика' },
          { href: '/courses?tab=alphabet', emoji: '🔤', title: 'Алфавит', desc: '42 буквы' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{item.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Доброе утро'
  if (h < 17) return 'Добрый день'
  if (h < 22) return 'Добрый вечер'
  return 'Доброй ночи'
}

function getDayBashkir() {
  const days = ['Йәкшәмбе', 'Дүшәмбе', 'Шишәмбе', 'Шаршамбы', 'Кесаҙна', 'Йома', 'Шәмбе']
  return days[new Date().getDay()]
}

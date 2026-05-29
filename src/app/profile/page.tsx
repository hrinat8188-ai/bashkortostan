'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

type Achievement = {
  id: string; key: string; title_ru: string; description: string; icon: string; xp_reward: number
  earned?: boolean; earned_at?: string
}

const LEVEL_NAMES: Record<string, string> = {
  A0: 'Абсолютный новичок', A1: 'Начинающий', A2: 'Элементарный',
  B1: 'Средний', B2: 'Выше среднего', C1: 'Продвинутый',
}

const ACH_EMOJI: Record<string, string> = {
  flame: '🔥', vocabulary: '📖', trophy: '🏆', abc: '🔤',
  message: '💬', 'chart-line': '📈', star: '⭐', target: '🎯',
  footprint: '👣', crown: '👑',
}

export default function ProfilePage() {
  const { user } = useUser()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [totalLessons, setTotalLessons] = useState(0)
  const [accuracy, setAccuracy] = useState(0)

  useEffect(() => {
    if (!user) return

    // Все достижения + полученные
    supabase.from('achievements').select('*, user_achievements(earned_at)')
      .then(({ data }) => {
        if (!data) return
        const list = data.map((a: any) => ({
          ...a,
          earned: (a.user_achievements ?? []).length > 0,
          earned_at: a.user_achievements?.[0]?.earned_at,
        }))
        setAchievements(list.sort((a: Achievement, b: Achievement) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0)))
      })

    // Статистика
    supabase.from('user_progress').select('status, score')
      .eq('user_id', user.id).eq('status', 'completed')
      .then(({ data }) => {
        if (!data) return
        setTotalLessons(data.length)
        const avg = data.reduce((s, d) => s + (d.score ?? 0), 0) / (data.length || 1)
        setAccuracy(Math.round(avg))
      })
  }, [user])

  const levelXP = user?.xp ?? 0
  const levelProgress = levelXP % 500
  const levelPct = Math.round((levelProgress / 500) * 100)

  if (!user) return null

  return (
    <div className="safe-bottom">
      <TopBar title="Профиль" />

      {/* Аватар */}
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
          background: 'var(--accent-light)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 500, border: '3px solid var(--accent)',
        }}>
          {user.first_name[0]?.toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, marginTop: 10 }}>
          {user.first_name} {user.last_name ?? ''}
        </div>
        {user.telegram_username && (
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>@{user.telegram_username}</div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span className="badge badge-green">{user.current_level}</span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{LEVEL_NAMES[user.current_level]}</span>
        </div>
      </div>

      {/* XP прогресс */}
      <div style={{ margin: '16px 16px 0', padding: '14px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-2)' }}>До следующего уровня</span>
          <span style={{ fontWeight: 500, color: 'var(--accent)' }}>{levelXP} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${levelPct}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{levelPct}% · ещё {500 - levelProgress} XP</div>
      </div>

      {/* Статистика */}
      <div className="section-title">Статистика</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
        {[
          { emoji: '📖', val: user.total_words, label: 'слов изучено' },
          { emoji: '🔥', val: user.streak_days, label: 'дней серия' },
          { emoji: '✅', val: totalLessons, label: 'уроков пройдено' },
          { emoji: '🎯', val: `${accuracy}%`, label: 'точность' },
        ].map((s, i) => (
          <div key={i} className="card-surface" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Достижения */}
      <div className="section-title">Достижения</div>
      <div style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto', paddingBottom: 4 }}>
        {achievements.map(ach => (
          <div key={ach.id} style={{ flexShrink: 0, textAlign: 'center', width: 72 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, border: '0.5px solid var(--border)',
              background: ach.earned ? 'var(--gold-light)' : 'var(--surface)',
              opacity: ach.earned ? 1 : 0.35,
              filter: ach.earned ? 'none' : 'grayscale(1)',
            }}>
              {ACH_EMOJI[ach.icon] ?? '🏅'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.3 }}>{ach.title_ru}</div>
          </div>
        ))}
      </div>

      {/* Реферальная система */}
      <div className="section-title">Пригласи друга</div>
      <div style={{ margin: '0 16px', padding: '14px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>🎁 Приглашай друзей — получай XP</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
          За каждого приглашённого друга ты получишь 200 XP бонуса!
        </div>
        <div style={{
          background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10,
          padding: '10px 14px', fontFamily: 'monospace', fontSize: 14,
          color: 'var(--accent)', marginBottom: 10,
        }}>
          t.me/{process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}?start={user.referral_code}
        </div>
        <button className="btn-primary" onClick={() => {
          const url = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}?start=${user.referral_code}`
          if (navigator.share) navigator.share({ title: 'Учи башкирский!', url })
          else navigator.clipboard.writeText(url)
        }}>
          📤 Поделиться ссылкой
        </button>
      </div>

      {/* Подписка */}
      {!user.is_premium && (
        <>
          <div className="section-title">Premium</div>
          <div style={{
            margin: '0 16px',
            background: 'linear-gradient(135deg, #26215C, #534AB7)',
            borderRadius: 'var(--radius-card)', padding: '20px',
            color: 'white',
          }}>
            <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: 10 }}>
              👑 Premium
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 8 }}>
              Разблокируй полный курс
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6, marginBottom: 16 }}>
              ✅ AI-помощник без ограничений{'\n'}
              ✅ Все уровни A0 → C1{'\n'}
              ✅ Разговорный тренажёр{'\n'}
              ✅ Офлайн-режим{'\n'}
              ✅ Расширенная аналитика
            </div>
            <button style={{
              background: 'white', color: '#534AB7',
              border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '12px 24px', fontSize: 15, fontWeight: 500, cursor: 'pointer', width: '100%',
            }}>
              199 ₽ / месяц · 7 дней бесплатно
            </button>
          </div>
        </>
      )}

      {user.is_premium && (
        <div style={{ margin: '12px 16px 0', padding: '14px 16px', background: 'var(--gold-light)', borderRadius: 'var(--radius-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>👑</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#7a4f0a' }}>Premium активен</div>
            <div style={{ fontSize: 12, color: 'var(--gold)' }}>Все функции разблокированы</div>
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
      <BottomNav />
    </div>
  )
}

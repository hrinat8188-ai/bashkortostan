'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { supabase, type VocabWord, type UserVocab } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { calculateNextReview, ratingToQuality, REVIEW_LABELS } from '@/lib/srs'
import { haptic } from '@/lib/telegram'

const TOPICS = [
  { key: 'all', label: 'Все' },
  { key: 'family', label: '👨‍👩‍👧 Семья' },
  { key: 'food', label: '🍽 Еда' },
  { key: 'communication', label: '💬 Общение' },
  { key: 'home', label: '🏠 Быт' },
  { key: 'work', label: '💼 Работа' },
  { key: 'nature', label: '🌿 Природа' },
  { key: 'transport', label: '🚗 Транспорт' },
]

type Tab = 'browse' | 'review' | 'favorites'

export default function VocabularyPage() {
  const { user } = useUser()
  const [tab, setTab] = useState<Tab>('browse')
  const [topic, setTopic] = useState('all')
  const [search, setSearch] = useState('')
  const [words, setWords] = useState<VocabWord[]>([])
  const [userVocab, setUserVocab] = useState<Map<string, UserVocab>>(new Map())
  const [reviewWords, setReviewWords] = useState<(VocabWord & { uv: UserVocab })[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)

  useEffect(() => {
    let q = supabase.from('vocabulary').select('*').eq('is_active', true).order('level').order('russian')
    if (topic !== 'all') q = q.eq('topic', topic)
    if (search) q = q.or(`bashkir.ilike.%${search}%,russian.ilike.%${search}%`)
    q.then(({ data }) => { if (data) setWords(data as VocabWord[]) })
  }, [topic, search])

  useEffect(() => {
    if (!user) return
    supabase.from('user_vocabulary').select('*').eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        const m = new Map<string, UserVocab>()
        data.forEach((uv: UserVocab) => m.set(uv.vocab_id, uv))
        setUserVocab(m)
      })
  }, [user])

  useEffect(() => {
    if (!user || tab !== 'review') return
    supabase
      .from('user_vocabulary')
      .select('*, vocabulary(*)')
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at')
      .then(({ data }) => {
        if (!data) return
        setReviewWords(data.map((d: any) => ({ ...d.vocabulary, uv: d })))
        setReviewIndex(0)
        setShowTranslation(false)
      })
  }, [user, tab])

  async function toggleFavorite(word: VocabWord) {
    if (!user) return
    haptic('light')
    const uv = userVocab.get(word.id)
    if (uv) {
      await supabase.from('user_vocabulary').update({ is_favorite: !uv.is_favorite }).eq('id', uv.id)
      setUserVocab(m => { const nm = new Map(m); nm.set(word.id, { ...uv, is_favorite: !uv.is_favorite }); return nm })
    } else {
      const { data } = await supabase.from('user_vocabulary').insert({
        user_id: user.id, vocab_id: word.id, is_favorite: true,
      }).select().single()
      if (data) setUserVocab(m => { const nm = new Map(m); nm.set(word.id, data as UserVocab); return nm })
    }
  }

  async function addToReview(word: VocabWord) {
    if (!user || userVocab.has(word.id)) return
    haptic('light')
    const { data } = await supabase.from('user_vocabulary').insert({
      user_id: user.id, vocab_id: word.id,
    }).select().single()
    if (data) setUserVocab(m => { const nm = new Map(m); nm.set(word.id, data as UserVocab); return nm })
  }

  async function handleReviewRate(rating: 1 | 2 | 3 | 4) {
    if (!user || reviewWords.length === 0) return
    haptic('light')
    const word = reviewWords[reviewIndex]
    const uv = word.uv
    const quality = ratingToQuality(rating)
    const next = calculateNextReview(quality, uv.ease_factor, uv.interval_days, uv.repetitions)
    await supabase.from('user_vocabulary').update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      next_review_at: next.nextReviewAt,
      last_quality: quality,
    }).eq('id', uv.id)

    if (reviewIndex + 1 >= reviewWords.length) {
      setReviewWords([])
    } else {
      setReviewIndex(i => i + 1)
      setShowTranslation(false)
    }
  }

  function speak(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ru-RU'; u.rate = 0.8
      window.speechSynthesis.speak(u)
    }
  }

  const favorites = words.filter(w => userVocab.get(w.id)?.is_favorite)

  return (
    <div className="safe-bottom">
      <TopBar title="Словарь" subtitle={`${words.length} слов`} />

      {/* Табы */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', padding: '0 16px' }}>
        {([['browse', '📖 Все слова'], ['review', '🔁 Повторение'], ['favorites', '❤️ Избранное']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 4px', border: 'none', background: 'none',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            color: tab === t ? 'var(--accent)' : 'var(--text-2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* === ТАБ: ОБЗОР === */}
      {tab === 'browse' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 16px 0', padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-pill)', border: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 16, color: 'var(--text-3)' }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск слова…"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto' }}>
            {TOPICS.map(t => (
              <button key={t.key} onClick={() => setTopic(t.key)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  border: '0.5px solid var(--border)',
                  background: topic === t.key ? 'var(--accent)' : 'var(--surface)',
                  color: topic === t.key ? 'white' : 'var(--text-2)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {words.map(word => (
            <WordCard key={word.id} word={word}
              uv={userVocab.get(word.id)}
              onFavorite={() => toggleFavorite(word)}
              onAdd={() => addToReview(word)}
              onSpeak={() => speak(word.bashkir)}
            />
          ))}
        </>
      )}

      {/* === ТАБ: ПОВТОРЕНИЕ === */}
      {tab === 'review' && (
        <div style={{ padding: '16px' }}>
          {reviewWords.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>Всё повторено!</div>
              <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 8 }}>
                Следующее повторение будет завтра. Так работает метод интервального повторения!
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, textAlign: 'center' }}>
                {reviewIndex + 1} из {reviewWords.length} · SM-2 алгоритм
              </div>
              <div style={{
                background: 'var(--bg)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-card)', padding: 28,
                textAlign: 'center', marginBottom: 16,
                minHeight: 200, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 32, fontWeight: 500, color: 'var(--text)' }}>
                  {reviewWords[reviewIndex]?.bashkir}
                </div>
                {reviewWords[reviewIndex]?.transcription && (
                  <div style={{ fontSize: 16, color: 'var(--accent)', fontFamily: 'monospace' }}>
                    {reviewWords[reviewIndex].transcription}
                  </div>
                )}
                <button onClick={() => speak(reviewWords[reviewIndex]?.bashkir ?? '')}
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
                  🔊 Слушать
                </button>

                {!showTranslation ? (
                  <button onClick={() => { setShowTranslation(true); haptic('light') }}
                    className="btn-outline" style={{ marginTop: 8 }}>
                    Показать перевод
                  </button>
                ) : (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <div style={{ fontSize: 20, color: 'var(--text-2)', marginTop: 8 }}>
                      {reviewWords[reviewIndex]?.russian}
                    </div>
                    {reviewWords[reviewIndex]?.example_bashkir && (
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, fontStyle: 'italic' }}>
                        {reviewWords[reviewIndex].example_bashkir}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showTranslation && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, animation: 'slideUp 0.3s ease' }}>
                  {([1, 2, 3, 4] as const).map(rating => {
                    const meta = REVIEW_LABELS[rating]
                    return (
                      <button key={rating} onClick={() => handleReviewRate(rating)}
                        style={{
                          background: 'var(--surface)', border: `0.5px solid ${meta.color}`,
                          borderRadius: 12, padding: '12px 8px', cursor: 'pointer',
                        }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: meta.color }}>{meta.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{meta.days}</div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === ТАБ: ИЗБРАННОЕ === */}
      {tab === 'favorites' && (
        favorites.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, padding: '60px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Пока нет избранных слов</div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 8 }}>
              Нажми ❤️ на любом слове, чтобы добавить в избранное
            </div>
          </div>
        ) : favorites.map(word => (
          <WordCard key={word.id} word={word}
            uv={userVocab.get(word.id)}
            onFavorite={() => toggleFavorite(word)}
            onAdd={() => addToReview(word)}
            onSpeak={() => speak(word.bashkir)}
          />
        ))
      )}

      <BottomNav />
    </div>
  )
}

function WordCard({ word, uv, onFavorite, onAdd, onSpeak }: {
  word: VocabWord
  uv?: UserVocab
  onFavorite: () => void
  onAdd: () => void
  onSpeak: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ margin: '5px 16px' }}>
      <div className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>{word.bashkir}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 1 }}>{word.russian}</div>
            {word.transcription && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1, fontFamily: 'monospace' }}>
                {word.transcription}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={e => { e.stopPropagation(); onSpeak() }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4, color: 'var(--text-2)' }}>
              🔊
            </button>
            <button onClick={e => { e.stopPropagation(); onFavorite() }}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}>
              {uv?.is_favorite ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
        {expanded && word.example_bashkir && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface)', borderRadius: 10, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>{word.example_bashkir}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{word.example_russian}</div>
            {!uv && (
              <button onClick={e => { e.stopPropagation(); onAdd() }}
                style={{ marginTop: 8, background: 'var(--accent-light)', color: 'var(--accent)', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                + Добавить на повторение
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { useUser } from '@/hooks/useUser'
import { haptic } from '@/lib/telegram'

type Message = { role: 'user' | 'assistant'; content: string; ts: number }

const QUICK_PROMPTS = [
  'Объясни разницу между Ҡ и К',
  'Как образуются падежи в башкирском?',
  'Дай мне упражнение на приветствия',
  'Переведи: Добрый день, как дела?',
  'Расскажи о башкирской культуре',
]

export default function AIPage() {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Исәнмесегеҙ! 👋 Мин — ваш AI-помощник по башкирскому языку.\n\nМогу объяснить грамматику, исправить перевод, поговорить на башкирском или сгенерировать упражнение.\n\nС чего начнём?',
      ts: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    haptic('light')

    const userMsg: Message = { role: 'user', content, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userLevel: user?.current_level ?? 'A0',
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, ts: Date.now() }])
      haptic('success')
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '😔 Произошла ошибка. Проверь подключение к интернету и попробуй снова.',
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const isPremium = user?.is_premium
  const msgCount = messages.filter(m => m.role === 'user').length
  const freeLimit = 10
  const limitReached = !isPremium && msgCount >= freeLimit

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        title="AI-помощник"
        subtitle="Башкирский за 30 секунд"
        right={
          <span className={`badge ${isPremium ? 'badge-gold' : 'badge-green'}`}>
            {isPremium ? '👑 Premium' : `${freeLimit - Math.min(msgCount, freeLimit)} / ${freeLimit}`}
          </span>
        }
      />

      {/* Чат */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            maxWidth: '86%',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.25s ease',
          }}>
            {msg.role === 'assistant' && (
              <div style={{ fontSize: 20, marginBottom: 4 }}>🤖</div>
            )}
            <div style={{
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              fontSize: 14, lineHeight: 1.6,
              border: msg.role === 'assistant' ? '0.5px solid var(--border)' : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🤖</div>
            <div style={{
              padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)',
                  animation: `pulse 1.2s ${delay}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Быстрые подсказки */}
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>Попробуй спросить:</div>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'var(--surface)', border: '0.5px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                  fontSize: 13, color: 'var(--text)', cursor: 'pointer',
                }}>
                💬 {p}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Лимит исчерпан */}
      {limitReached && (
        <div style={{
          margin: '0 16px 8px', padding: '12px 16px',
          background: 'linear-gradient(135deg, #26215C, #534AB7)',
          borderRadius: 12, color: 'white', textAlign: 'center',
        }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>👑 Лимит сообщений исчерпан</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>Перейди на Premium для безлимитного общения с AI</div>
          <button style={{
            background: 'white', color: '#534AB7', border: 'none',
            borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            Получить Premium
          </button>
        </div>
      )}

      {/* Ввод */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        background: 'var(--bg)', borderTop: '0.5px solid var(--border)',
        paddingBottom: '80px',
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={limitReached ? 'Нужен Premium…' : 'Спроси на русском или башкирском…'}
          disabled={limitReached || loading}
          style={{
            flex: 1, padding: '10px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '0.5px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 14, color: 'var(--text)', outline: 'none',
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading || limitReached}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: input.trim() && !limitReached ? 'var(--accent)' : 'var(--surface)',
            border: '0.5px solid var(--border)',
            color: input.trim() && !limitReached ? 'white' : 'var(--text-3)',
            fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}>
          ➤
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>

      <BottomNav />
    </div>
  )
}

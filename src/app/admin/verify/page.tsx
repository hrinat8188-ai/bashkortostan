'use client'

import { useState } from 'react'

type Report = {
  lessons_below_15: { id: string; title: string; count: number }[]
  no_correct_answer: { id: string; lesson: string; question: string }[]
  multi_correct_answer: { id: string; lesson: string; question: string }[]
  duplicate_answer_text: { id: string; lesson: string; question: string }[]
  known_wrong_words: { id: string; lesson: string; question: string; word: string }[]
  old_spelling_variants: { id: string; lesson: string; question: string; found: string }[]
  tatar_letter_zh: { id: string; lesson: string; question: string }[]
  word_meaning_contradictions: { word: string; meanings: string[] }[]
  total_exercises: number
  total_lessons: number
  total_issues_found: number
  checked_at: string
}

export default function VerifyPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function runCheck() {
    setLoading(true)
    setReport(null)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/verify-content', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? `Сервер вернул код ${res.status}`)
      } else {
        setReport(data)
      }
    } catch (e: any) {
      setErrorMsg('Не удалось связаться с сервером: ' + (e?.message ?? String(e)))
    } finally {
      setLoading(false)
    }
  }

  const sections = report ? [
    { title: 'Уроки с менее чем 15 упражнениями', items: report.lessons_below_15, key: 'lessons' },
    { title: 'Упражнения без правильного ответа (сломаны)', items: report.no_correct_answer, key: 'no_correct' },
    { title: 'Упражнения с несколькими правильными ответами', items: report.multi_correct_answer, key: 'multi_correct' },
    { title: 'Дублирующиеся варианты ответа внутри упражнения', items: report.duplicate_answer_text, key: 'dup' },
    { title: 'Известные ранее неверные слова как ответ', items: report.known_wrong_words, key: 'wrong_words' },
    { title: 'Старое написание без спецбукв', items: report.old_spelling_variants, key: 'spelling' },
    { title: 'Татарская буква "җ" (нет в баш. алфавите)', items: report.tatar_letter_zh, key: 'zh' },
  ] : []

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px', fontFamily: 'system-ui' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F6E56, #1D9E75)', borderRadius: 16, padding: '16px 20px', color: 'white', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Проверка контента</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Автоматический аудит на известные типы ошибок</div>
      </div>

      <button onClick={runCheck} disabled={loading} style={{
        width: '100%', padding: 14, borderRadius: 50, fontSize: 15, fontWeight: 500,
        background: loading ? '#ccc' : '#1D9E75', color: 'white', border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20,
      }}>
        {loading ? 'Проверяю базу...' : '🔍 Запустить проверку'}
      </button>

      {errorMsg && (
        <div style={{ background: '#FCEBEB', border: '1px solid #E24B4A', borderRadius: 12, padding: '14px 16px', marginBottom: 20, color: '#A32D2D', fontSize: 14 }}>
          <strong>Ошибка:</strong> {errorMsg}
        </div>
      )}

      {report && (
        <>
          <div style={{
            background: report.total_issues_found === 0 ? '#E1F5EE' : '#FAEEDA',
            border: `1px solid ${report.total_issues_found === 0 ? '#1D9E75' : '#BA7517'}`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{report.total_issues_found === 0 ? '✅' : '⚠️'}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {report.total_issues_found === 0 ? 'Проблем не найдено!' : `Найдено проблем: ${report.total_issues_found}`}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {report.total_exercises} упражнений в {report.total_lessons} уроках
            </div>
          </div>

          {report.word_meaning_contradictions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#A32D2D' }}>
                ⚠️ Противоречия в значениях слов ({report.word_meaning_contradictions.length})
              </div>
              {report.word_meaning_contradictions.map((c, i) => (
                <div key={i} style={{ background: '#FCEBEB', border: '1px solid #E24B4A', borderRadius: 10, padding: 10, marginBottom: 6, fontSize: 13 }}>
                  <strong>«{c.word}»</strong> означает разное: {c.meanings.join(' / ')}
                </div>
              ))}
            </div>
          )}

          {sections.map(sec => sec.items.length > 0 && (
            <div key={sec.key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#A32D2D' }}>
                ⚠️ {sec.title} ({sec.items.length})
              </div>
              {sec.items.slice(0, 20).map((item: any, i: number) => (
                <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 4, fontSize: 12 }}>
                  {item.title ? (
                    <span><strong>{item.title}</strong> — {item.count} упражнений</span>
                  ) : (
                    <span><strong>{item.lesson}</strong>: {item.question} {item.word && `(слово: ${item.word})`} {item.found && `(найдено: ${item.found})`}</span>
                  )}
                </div>
              ))}
              {sec.items.length > 20 && <div style={{ fontSize: 12, color: '#999' }}>...и ещё {sec.items.length - 20}</div>}
            </div>
          ))}

          <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 20 }}>
            Проверено: {new Date(report.checked_at).toLocaleString('ru-RU')}
          </div>
        </>
      )}

      <div style={{ marginTop: 24, padding: '12px 16px', background: '#f5f5f5', borderRadius: 10, fontSize: 12, color: '#666' }}>
        💡 Эта проверка ловит структурные и уже известные ошибки автоматически. Она не заменяет
        ручную проверку новых слов через словари — используй /admin/review для просмотра
        конкретных упражнений и их удаления.
      </div>
    </div>
  )
}

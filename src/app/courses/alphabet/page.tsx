'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { haptic } from '@/lib/telegram'

const ALPHABET = [
  { letter: 'Аа', sound: '[a]', like: 'как в «мама»', special: false },
  { letter: 'Бб', sound: '[b]', like: 'как в «банан»', special: false },
  { letter: 'Вв', sound: '[v]', like: 'как в «вода»', special: false },
  { letter: 'Ғғ', sound: '[ğ]', like: 'фрикативное Г (глубоко)', special: true },
  { letter: 'Дд', sound: '[d]', like: 'как в «дом»', special: false },
  { letter: 'Ҙҙ', sound: '[ð]', like: 'как английское "th" в "this"', special: true },
  { letter: 'Ее', sound: '[je]', like: 'как в «ель»', special: false },
  { letter: 'Ёё', sound: '[jo]', like: 'как в «ёж»', special: false },
  { letter: 'Жж', sound: '[ʒ]', like: 'как в «жук»', special: false },
  { letter: 'Ҙҙ', sound: '[z]', like: 'как в «зима»', special: false },
  { letter: 'Ии', sound: '[i]', like: 'как в «иглу»', special: false },
  { letter: 'Йй', sound: '[j]', like: 'как в «йога»', special: false },
  { letter: 'Кк', sound: '[k]', like: 'как в «кот»', special: false },
  { letter: 'Ҡҡ', sound: '[q]', like: 'увулярное К (глубже)', special: true },
  { letter: 'Лл', sound: '[l]', like: 'как в «лес»', special: false },
  { letter: 'Мм', sound: '[m]', like: 'как в «мир»', special: false },
  { letter: 'Нн', sound: '[n]', like: 'как в «нос»', special: false },
  { letter: 'Ңң', sound: '[ŋ]', like: 'как «ng» в английском «sing»', special: true },
  { letter: 'Оо', sound: '[o]', like: 'как в «окно»', special: false },
  { letter: 'Өө', sound: '[ø]', like: 'как немецкое «ö»', special: true },
  { letter: 'Пп', sound: '[p]', like: 'как в «папа»', special: false },
  { letter: 'Рр', sound: '[r]', like: 'как в «рыба»', special: false },
  { letter: 'Сс', sound: '[s]', like: 'как в «сок»', special: false },
  { letter: 'Ҫҫ', sound: '[θ]', like: 'как английское "th" в "think"', special: true },
  { letter: 'Тт', sound: '[t]', like: 'как в «том»', special: false },
  { letter: 'Уу', sound: '[u]', like: 'как в «утка»', special: false },
  { letter: 'Үү', sound: '[y]', like: 'как немецкое «ü»', special: true },
  { letter: 'Фф', sound: '[f]', like: 'как в «факт»', special: false },
  { letter: 'Хх', sound: '[x]', like: 'как в «хлеб»', special: false },
  { letter: 'Һһ', sound: '[h]', like: 'мягкое Х (придыхание)', special: true },
  { letter: 'Цц', sound: '[ts]', like: 'как в «цирк»', special: false },
  { letter: 'Чч', sound: '[tʃ]', like: 'как в «чай»', special: false },
  { letter: 'Шш', sound: '[ʃ]', like: 'как в «шар»', special: false },
  { letter: 'Щщ', sound: '[ʃtʃ]', like: 'как в «щука»', special: false },
  { letter: 'Ъъ', sound: '[ʔ]', like: 'твёрдый знак', special: false },
  { letter: 'Ыы', sound: '[ɯ]', like: 'задний ряд, «ы» башкирское', special: true },
  { letter: 'Ьь', sound: '[ʲ]', like: 'мягкий знак', special: false },
  { letter: 'Ээ', sound: '[e]', like: 'как в «это»', special: false },
  { letter: 'Юю', sound: '[ju]', like: 'как в «юг»', special: false },
  { letter: 'Яя', sound: '[ja]', like: 'как в «яблоко»', special: false },
]

export default function AlphabetPage() {
  const [selected, setSelected] = useState<typeof ALPHABET[0] | null>(null)
  const [filter, setFilter] = useState<'all' | 'special'>('all')

  const filtered = filter === 'special' ? ALPHABET.filter(l => l.special) : ALPHABET

 function speak(text: string) {
    haptic('light')
  }

  return (

  return (
    <div className="safe-bottom">
      <TopBar title="Башкирский алфавит" subtitle="42 буквы" showBack />

      {/* Фильтр */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
        {[
          { key: 'all', label: 'Все буквы' },
          { key: 'special', label: '⭐ Особые (9 букв)' },
        ].map(f => (
          <button key={f.key}
            onClick={() => setFilter(f.key as 'all' | 'special')}
            className={filter === f.key ? 'btn-primary' : 'btn-outline'}
            style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'special' && (
        <div style={{ margin: '10px 16px 0', padding: '10px 14px', background: 'var(--gold-light)', borderRadius: 12, fontSize: 13, color: '#7a4f0a' }}>
          🎯 Это буквы, которых нет в русском алфавите. Именно они делают башкирский уникальным!
        </div>
      )}

      {/* Сетка букв */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '12px 16px 0' }}>
        {filtered.map((item, i) => (
          <button key={i}
            onClick={() => { setSelected(item); speak(item.letter) }}
            style={{
              background: item.special ? 'var(--gold-light)' : 'var(--surface)',
              border: selected?.letter === item.letter
                ? `2px solid ${item.special ? 'var(--gold)' : 'var(--accent)'}`
                : `0.5px solid ${item.special ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 12, padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ fontSize: 20, fontWeight: 500, color: item.special ? 'var(--gold)' : 'var(--text)' }}>
              {item.letter}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{item.sound}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>🔊</div>
          </button>
        ))}
      </div>

      {/* Детальная карточка выбранной буквы */}
      {selected && (
        <div style={{
          margin: '16px 16px 0',
          background: 'var(--bg)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: 20,
          animation: 'scaleIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: selected.special ? 'var(--gold-light)' : 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 600,
              color: selected.special ? 'var(--gold)' : 'var(--accent)',
            }}>
              {selected.letter[0]}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{selected.letter}</div>
              <div style={{ fontSize: 15, color: 'var(--accent)', fontFamily: 'monospace' }}>{selected.sound}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 14 }}>
            📌 {selected.like}
          </div>
          {selected.special && (
            <div style={{ background: 'var(--gold-light)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#7a4f0a' }}>
              ⭐ Особая башкирская буква — нет в русском алфавите
            </div>
          )}
          <button
            className="btn-primary"
            onClick={() => speak(selected.letter)}
            style={{ gap: 8 }}
          >
            🔊 Послушать произношение
          </button>
        </div>
      )}

      <div style={{ height: 24 }} />
      <BottomNav />
    </div>
  )
}

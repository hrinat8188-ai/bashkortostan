'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'

const ALPHABET = [
  { letter: 'Аа', sound: '[a]', like: 'как в мама', special: false },
  { letter: 'Бб', sound: '[b]', like: 'как в банан', special: false },
  { letter: 'Вв', sound: '[v]', like: 'как в вода', special: false },
  { letter: 'Ғғ', sound: '[g]', like: 'фрикативное Г глубоко', special: true },
  { letter: 'Дд', sound: '[d]', like: 'как в дом', special: false },
  { letter: 'Ҙҙ', sound: '[th]', like: 'как th в this', special: true },
  { letter: 'Ее', sound: '[je]', like: 'как в ель', special: false },
  { letter: 'Ёё', sound: '[jo]', like: 'как в ёж', special: false },
  { letter: 'Жж', sound: '[zh]', like: 'как в жук', special: false },
  { letter: 'Зз', sound: '[z]', like: 'как в зима', special: false },
  { letter: 'Ии', sound: '[i]', like: 'как в иглу', special: false },
  { letter: 'Йй', sound: '[j]', like: 'как в йога', special: false },
  { letter: 'Кк', sound: '[k]', like: 'как в кот', special: false },
  { letter: 'Ҡҡ', sound: '[q]', like: 'увулярное К глубже', special: true },
  { letter: 'Лл', sound: '[l]', like: 'как в лес', special: false },
  { letter: 'Мм', sound: '[m]', like: 'как в мир', special: false },
  { letter: 'Нн', sound: '[n]', like: 'как в нос', special: false },
  { letter: 'Ңң', sound: '[ng]', like: 'как ng в sing', special: true },
  { letter: 'Оо', sound: '[o]', like: 'как в окно', special: false },
  { letter: 'Өө', sound: '[o]', like: 'как немецкое о с умлаутом', special: true },
  { letter: 'Пп', sound: '[p]', like: 'как в папа', special: false },
  { letter: 'Рр', sound: '[r]', like: 'как в рыба', special: false },
  { letter: 'Сс', sound: '[s]', like: 'как в сок', special: false },
  { letter: 'Ҫҫ', sound: '[th]', like: 'как th в think', special: true },
  { letter: 'Тт', sound: '[t]', like: 'как в том', special: false },
  { letter: 'Уу', sound: '[u]', like: 'как в утка', special: false },
  { letter: 'Үү', sound: '[u]', like: 'как немецкое у с умлаутом', special: true },
  { letter: 'Фф', sound: '[f]', like: 'как в факт', special: false },
  { letter: 'Хх', sound: '[x]', like: 'как в хлеб', special: false },
  { letter: 'Һһ', sound: '[h]', like: 'мягкое Х придыхание', special: true },
  { letter: 'Цц', sound: '[ts]', like: 'как в цирк', special: false },
  { letter: 'Чч', sound: '[ch]', like: 'как в чай', special: false },
  { letter: 'Шш', sound: '[sh]', like: 'как в шар', special: false },
  { letter: 'Щщ', sound: '[shch]', like: 'как в щука', special: false },
  { letter: 'Ъъ', sound: '[-]', like: 'твердый знак', special: false },
  { letter: 'Ыы', sound: '[y]', like: 'башкирское ы задний ряд', special: true },
  { letter: 'Ьь', sound: '[-]', like: 'мягкий знак', special: false },
  { letter: 'Ээ', sound: '[e]', like: 'как в это', special: false },
  { letter: 'Юю', sound: '[ju]', like: 'как в юг', special: false },
  { letter: 'Яя', sound: '[ja]', like: 'как в яблоко', special: false },
]

export default function AlphabetPage() {
  const [selected, setSelected] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'special'
    ? ALPHABET.filter(l => l.special)
    : ALPHABET

  return (
    <div className="safe-bottom">
      <TopBar title="Башкирский алфавит" subtitle="42 буквы" showBack />

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1, padding: '9px 12px', fontSize: 13, cursor: 'pointer',
            borderRadius: 'var(--radius-pill)', border: '0.5px solid var(--border)',
            background: filter === 'all' ? 'var(--accent)' : 'var(--surface)',
            color: filter === 'all' ? 'white' : 'var(--text-2)',
          }}>
          Все буквы
        </button>
        <button
          onClick={() => setFilter('special')}
          style={{
            flex: 1, padding: '9px 12px', fontSize: 13, cursor: 'pointer',
            borderRadius: 'var(--radius-pill)', border: '0.5px solid var(--border)',
            background: filter === 'special' ? 'var(--accent)' : 'var(--surface)',
            color: filter === 'special' ? 'white' : 'var(--text-2)',
          }}>
          Особые (9 букв)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '12px 16px 0' }}>
        {filtered.map((item, i) => (
          <button
            key={i}
            onClick={() => setSelected(selected === i ? null : i)}
            style={{
              background: item.special ? 'var(--gold-light)' : 'var(--surface)',
              border: selected === i
                ? '2px solid var(--accent)'
                : item.special ? '0.5px solid var(--gold)' : '0.5px solid var(--border)',
              borderRadius: 12, padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
            }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: item.special ? 'var(--gold)' : 'var(--text)' }}>
              {item.letter}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{item.sound}</div>
          </button>
        ))}
      </div>

      {selected !== null && (
        <div style={{
          margin: '16px 16px 0', background: 'var(--bg)',
          border: '0.5px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: filtered[selected].special ? 'var(--gold-light)' : 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 600,
              color: filtered[selected].special ? 'var(--gold)' : 'var(--accent)',
            }}>
              {filtered[selected].letter[0]}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{filtered[selected].letter}</div>
              <div style={{ fontSize: 15, color: 'var(--accent)', fontFamily: 'monospace' }}>
                {filtered[selected].sound}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {filtered[selected].like}
          </div>
          {filtered[selected].special && (
            <div style={{ background: 'var(--gold-light)', borderRadius: 10, padding: '8px 12px', marginTop: 12, fontSize: 13, color: '#7a4f0a' }}>
              Особая башкирская буква — нет в русском алфавите
            </div>
          )}
        </div>
      )}

      <div style={{ height: 24 }} />
      <BottomNav />
    </div>
  )
}

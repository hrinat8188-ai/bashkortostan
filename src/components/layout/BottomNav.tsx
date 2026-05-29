'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', icon: '🏠', label: 'Главная' },
  { href: '/courses', icon: '📚', label: 'Курсы' },
  { href: '/vocabulary', icon: '📖', label: 'Словарь' },
  { href: '/ai', icon: '🤖', label: 'AI' },
  { href: '/profile', icon: '👤', label: 'Профиль' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '480px',
      background: 'var(--bg)',
      borderTop: '0.5px solid var(--border)',
      display: 'flex',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {navItems.map(item => {
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, padding: '8px 0',
              textDecoration: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text-3)',
              fontSize: 10, fontWeight: 500, transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

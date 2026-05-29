'use client'

import { useRouter } from 'next/navigation'

interface TopBarProps {
  title: string
  subtitle?: string
  showBack?: boolean
  right?: React.ReactNode
}

export default function TopBar({ title, subtitle, showBack, right }: TopBarProps) {
  const router = useRouter()
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--bg)',
      borderBottom: '0.5px solid var(--border)',
      padding: '14px 16px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBack && (
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontSize: 22, padding: '0 4px 0 0',
            display: 'flex', alignItems: 'center',
          }}>←</button>
        )}
        <div>
          <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

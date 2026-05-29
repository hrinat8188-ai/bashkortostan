import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Башкортса — Изучай башкирский',
  description: 'Telegram Mini App для изучения башкирского языка',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* Telegram WebApp SDK */}
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#1D9E75" />
      </head>
      <body>{children}</body>
    </html>
  )
}

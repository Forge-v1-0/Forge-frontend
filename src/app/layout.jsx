import './globals.css'
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

// ─── FONTS ────────────────────────────────────────────────────────
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
})

// ─── METADATA ─────────────────────────────────────────────────────
export const metadata = {
  title: 'Forge — Repository-aware AI coding agent',
  description:
    'Forge understands your codebase deeply. It plans the work, writes the code, and you approve every step. Works on web, tablet, and mobile.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Forge',
    description: 'Repository-aware AI coding agent. Plan, code, approve.',
    type: 'website',
  },
}

// ─── ROOT LAYOUT ──────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`
        ${spaceGrotesk.variable}
        ${plusJakarta.variable}
        ${jetbrainsMono.variable}
      `}
    >
      <body className="bg-base text-primary antialiased">
        {/* Grain noise overlay — fixed, pointer-events-none, above everything */}
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}

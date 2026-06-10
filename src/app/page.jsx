'use client'

/**
 * FORGE — Landing Page (page.jsx)
 * Phase 1: Conversion Engine
 *
 * Positioning: Repository-aware AI coding agent. Web-first. Mobile-capable.
 * Sections: Nav → Hero → Problem → How It Works → Features Bento → Stack → Final CTA → Footer
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ForgeWordmark from '@/components/ui/ForgeWordmark'
import Button from '@/components/ui/Button'

// ─── SCROLL REVEAL HOOK ────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(
              () => entry.target.classList.add('visible'),
              (i % 6) * 60
            )
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.07, rootMargin: '0px 0px -32px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ─── NAV ──────────────────────────────────────────────────────────
function Nav({ onLogin, onSignup }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{
        height: '60px',
        borderBottom: '1px solid var(--bg-border)',
        background: scrolled
          ? 'rgba(10,10,11,0.88)'
          : 'rgba(10,10,11,0.5)',
        backdropFilter: 'blur(14px)',
        transition: 'background 250ms ease',
      }}
    >
      <ForgeWordmark size="sm" />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onLogin}>
          Login
        </Button>
        <Button variant="primary" size="sm" onClick={onSignup}>
          Connect Your Repo
        </Button>
      </div>
    </nav>
  )
}

// ─── TERMINAL ANIMATION ────────────────────────────────────────────
const TERMINAL_SEQUENCE = [
  { type: 'cmd',     text: 'forge run "Add rate limiting to the API routes"' },
  { type: 'blank' },
  { type: 'dim',     text: '▸ Reading repository graph…' },
  { type: 'dim',     text: '▸ 47 files analysed · 12 affected · planning…' },
  { type: 'blank' },
  { type: 'success', text: '✓ Plan ready — 4 subtasks' },
  { type: 'file-new', text: '  src/middleware/rateLimiter.ts    [NEW]' },
  { type: 'file-mod', text: '  src/routes/api/index.ts         [MODIFIED]' },
  { type: 'file-mod', text: '  src/routes/api/auth.ts          [MODIFIED]' },
  { type: 'file-mod', text: '  src/config/constants.ts         [MODIFIED]' },
  { type: 'blank' },
  { type: 'prompt',  text: '▸ Writing code…  ████████░░  80%' },
  { type: 'success', text: '✓ All subtasks approved' },
  { type: 'blank' },
  { type: 'branch',  text: '⎇  forge/rate-limiting pushed · open your PR' },
]

const TYPE_COLOURS = {
  cmd:      'var(--text-primary)',
  dim:      'var(--text-muted)',
  success:  'var(--success)',
  'file-new': 'var(--success)',
  'file-mod': 'var(--info)',
  prompt:   'var(--accent)',
  branch:   'var(--accent-warm)',
  blank:    'transparent',
}

function Terminal() {
  const [lines, setLines] = useState([])   // { text, color, done }
  const [typing, setTyping] = useState(null) // { text, color, cursor }
  const seqRef    = useRef(0)
  const lineRef   = useRef(0)
  const charRef   = useRef(0)
  const timerRef  = useRef(null)
  const bottomRef = useRef(null)

  function scheduleNext(ms, fn) {
    timerRef.current = setTimeout(fn, ms)
  }

  function typeChar() {
    const seq = TERMINAL_SEQUENCE
    if (lineRef.current >= seq.length) {
      // End of sequence — pause then restart
      setTyping(null)
      scheduleNext(3500, () => {
        lineRef.current = 0
        charRef.current = 0
        setLines([])
        typeChar()
      })
      return
    }

    const item = seq[lineRef.current]

    if (item.type === 'blank') {
      setLines(prev => [...prev, { text: '', color: 'transparent' }])
      lineRef.current++
      scheduleNext(120, typeChar)
      return
    }

    const fullText = item.text
    const color    = TYPE_COLOURS[item.type] || 'var(--text-primary)'

    if (charRef.current < fullText.length) {
      const isCmd = item.type === 'cmd'
      const delay = isCmd
        ? 38 + Math.random() * 28
        : item.type === 'dim' || item.type === 'file-mod' || item.type === 'file-new'
          ? 22 + Math.random() * 18
          : 18

      const partial = fullText.slice(0, charRef.current + 1)
      charRef.current++

      setTyping({ text: partial, color })
      scheduleNext(delay, typeChar)
    } else {
      // Line complete — commit to lines array
      setTyping(null)
      setLines(prev => [...prev, { text: fullText, color }])
      lineRef.current++
      charRef.current = 0
      const pause = item.type === 'cmd' ? 500 : item.type === 'blank' ? 80 : 120
      scheduleNext(pause, typeChar)
    }
  }

  useEffect(() => {
    scheduleNext(600, typeChar)
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div
      className="w-full rounded-xl overflow-hidden reveal"
      style={{
        border: '1px solid var(--bg-border)',
        background: 'var(--bg-surface)',
        boxShadow: '0 0 60px rgba(232,103,26,0.07), 0 24px 48px rgba(0,0,0,0.5)',
        maxWidth: '580px',
      }}
    >
      {/* Traffic lights */}
      <div
        className="flex items-center gap-2 px-4"
        style={{
          height: '42px',
          borderBottom: '1px solid var(--bg-border)',
          background: 'var(--bg-elevated)',
        }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28CA41' }} />
        <span
          className="ml-3 font-mono text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          forge — session
        </span>
      </div>

      {/* Body */}
      <div
        className="p-5 font-mono text-xs overflow-y-auto"
        style={{ minHeight: '200px', maxHeight: '240px', lineHeight: '1.85' }}
      >
        {/* Prompt prefix on first line */}
        {lines.length === 0 && !typing && (
          <span style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)' }}>$ </span>
            <span className="forge-cursor" />
          </span>
        )}

        {lines.map((line, i) => (
          <div key={i} style={{ color: line.color }}>
            {i === 0 && (
              <span style={{ color: 'var(--accent)' }}>$ </span>
            )}
            {line.text}
          </div>
        ))}

        {typing && (
          <div style={{ color: typing.color }}>
            {lines.length === 0 && (
              <span style={{ color: 'var(--accent)' }}>$ </span>
            )}
            {typing.text}
            <span className="forge-cursor" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ─── HERO ──────────────────────────────────────────────────────────
function Hero({ onSignup }) {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20"
      style={{ overflowX: 'hidden', overflowY: 'visible' }}
    >
      {/* Grid background */}
      <div className="forge-grid" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center text-center gap-8 w-full max-w-2xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill font-mono text-xs tracking-widest uppercase reveal"
          style={{
            border: '1px solid rgba(232,103,26,0.25)',
            background: 'rgba(232,103,26,0.07)',
            color: 'var(--accent)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full forge-pulse"
            style={{ background: 'var(--accent)' }}
          />
          Repository-Aware AI Coding Agent
        </div>

        {/* Wordmark */}
        <ForgeWordmark size="2xl" underline className="reveal" />

        {/* Subhead */}
        <p
          className="text-xl font-body font-light leading-relaxed max-w-lg reveal"
          style={{ color: 'var(--text-secondary)' }}
        >
          Understands your codebase. Plans the work. Writes the code.{' '}
          <strong
            className="font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            You approve every step.
          </strong>
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 flex-wrap justify-center reveal">
          <Button variant="primary" size="lg" onClick={onSignup}>
            Connect Your Repo — It's Free
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() =>
              document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            See how it works
          </Button>
        </div>

        {/* Trust row */}
        <div
          className="flex items-center gap-6 flex-wrap justify-center font-mono text-xs reveal"
          style={{ color: 'var(--text-muted)' }}
        >
          {['Web', 'Mobile', 'Any model', 'Your codebase'].map(item => (
            <span key={item}>
              <span style={{ color: 'var(--accent)' }}>✦ </span>
              {item}
            </span>
          ))}
        </div>

        {/* Terminal */}
        <Terminal />
      </div>
    </section>
  )
}

// ─── PROBLEM ───────────────────────────────────────────────────────
function Problem() {
  const items = [
    {
      n: '01',
      h: 'Context switching kills momentum',
      b: "Every time you leave the flow to pull latest, find the file, orient yourself in the codebase — you lose the insight that started it all. Forge keeps the flow alive by doing the orientation for you.",
    },
    {
      n: '02',
      h: 'LLMs without repo context break things',
      b: "Generic AI tools don't know your codebase. They write plausible code that fails because they didn't see the function it imports, the type it violates, or the route it conflicts with. Forge reads your entire repo before writing a single line.",
    },
    {
      n: '03',
      h: 'Code review is a black box',
      b: 'Most AI tools give you code and hope. No plan, no explanation, no control. Forge shows you exactly what will change and why — before it happens. You approve. You stay in control.',
    },
  ]

  return (
    <section
      id="problem"
      className="px-6 py-24"
      style={{ borderTop: '1px solid var(--bg-border)' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 mb-16 reveal">
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            The Problem
          </span>
          <h2
            className="font-display font-bold leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
          >
            Great developers are being slowed down{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              by the tools they depend on.
            </span>
          </h2>
        </div>

        <div>
          {items.map((item) => (
            <div
              key={item.n}
              className="flex gap-6 py-10 reveal"
              style={{
                borderBottom: '1px solid var(--bg-border)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Ghost watermark number */}
              <span
                aria-hidden="true"
                className="absolute font-display font-bold pointer-events-none select-none"
                style={{
                  fontSize: 'clamp(6rem, 18vw, 11rem)',
                  color: 'var(--text-muted)',
                  opacity: 0.055,
                  top: '-0.1em',
                  left: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {item.n}
              </span>

              <span
                className="font-mono text-xs pt-1 shrink-0 w-5 z-10"
                style={{ color: 'rgba(232,103,26,0.45)' }}
              >
                {item.n}
              </span>

              <div className="z-10">
                <h3
                  className="font-display font-semibold mb-2"
                  style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}
                >
                  {item.h}
                </h3>
                <p
                  className="font-body text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)', maxWidth: '54ch' }}
                >
                  {item.b}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ──────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Connect your repository',
      body: 'Paste your GitHub repo URL and a personal access token. Forge indexes your entire codebase — every import, export, function, and dependency — building a live knowledge graph of what your code does and how it connects.',
      tag: 'ts-morph · GitHub API · Supabase',
    },
    {
      n: '02',
      title: 'Describe your task in plain English',
      body: 'Type what you want to build or fix. No file paths, no function names — just intent. "Add a dark mode toggle to settings" is enough. Forge knows your codebase deeply enough to figure out the rest.',
      tag: 'Natural language input',
    },
    {
      n: '03',
      title: 'Review the AI-generated plan',
      body: 'The Planner LLM analyses your task against the repository graph, identifies every affected file — direct and indirect — and breaks the work into ordered subtasks. You see exactly what will change and why, before a single line of code is written.',
      tag: 'Planner LLM · Risk assessment',
    },
    {
      n: '04',
      title: 'Approve or reject each code change',
      body: 'The Coder LLM executes each subtask with the minimum necessary context injected. You see a full diff, an explanation of every change, and risk flags. Approve what you trust. Reject what you don\'t — with feedback to replan.',
      tag: 'Coder LLM · Diff viewer · Human in the loop',
    },
    {
      n: '05',
      title: 'It pushes to a branch. You merge.',
      body: 'Every approved session auto-creates a named branch and pushes the changes via GitHub API. Your main branch stays untouched. Open the PR, review it one final time, and merge when ready.',
      tag: 'GitHub branch · PR workflow',
    },
  ]

  return (
    <section
      id="how"
      className="px-6 py-24"
      style={{ borderTop: '1px solid var(--bg-border)', background: 'rgba(17,17,19,0.6)' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 mb-16 reveal">
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            How it works
          </span>
          <h2
            className="font-display font-bold leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
          >
            From idea to branch{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              in five steps.
            </span>
          </h2>
        </div>

        <div>
          {steps.map((step) => (
            <div
              key={step.n}
              className="grid gap-5 py-8 reveal"
              style={{
                gridTemplateColumns: '44px 1fr',
                borderBottom: '1px solid var(--bg-border)',
              }}
            >
              <span
                className="font-mono text-xs font-semibold pt-1"
                style={{ color: 'var(--accent)' }}
              >
                {step.n}
              </span>
              <div>
                <h3
                  className="font-display font-semibold mb-2"
                  style={{ fontSize: '1rem', color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="font-body text-sm leading-relaxed mb-3"
                  style={{ color: 'var(--text-secondary)', maxWidth: '52ch' }}
                >
                  {step.body}
                </p>
                <span
                  className="inline-flex items-center font-mono text-xs px-3 py-1 rounded-pill"
                  style={{
                    border: '1px solid var(--bg-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {step.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES — BENTO GRID ─────────────────────────────────────────
function Features() {
  const cards = [
    {
      span: 'full',
      title: 'Dual LLM Architecture',
      body: 'A Planner LLM thinks at the system level — understanding structure, risk, and order. A Coder LLM executes with surgical precision on each subtask. Two minds. One clean result. Never compromising planning for speed, or speed for planning.',
      accent: true,
    },
    {
      title: 'Human in the loop',
      body: 'Forge never pushes without your approval. Plan → Code → Review. Two gates. Every time. Your code, your call.',
      icon: '👁',
    },
    {
      title: 'Per-repo memory',
      body: 'Every decision, rejection, and preference remembered per repo. Forge gets smarter with every session you run.',
      icon: '🧠',
    },
    {
      title: 'Any model, your key',
      body: 'Bring your OpenRouter API key. Choose planner and coder models independently. Switch anytime. You own the intelligence.',
      icon: '🔑',
    },
    {
      title: 'Deep repo indexing',
      body: 'Before planning, Forge reads your entire codebase — exports, routes, functions, call graphs. Context-aware from the first prompt.',
      icon: '🗂',
    },
    {
      title: 'Branch per session',
      body: 'Every approved session auto-pushes to a clean named branch. Main stays untouched. Open a PR and merge when ready.',
      icon: '⎇',
    },
  ]

  return (
    <section
      id="features"
      className="px-6 py-24"
      style={{ borderTop: '1px solid var(--bg-border)' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 mb-16 reveal">
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            Features
          </span>
          <h2
            className="font-display font-bold leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
          >
            Built for developers who move fast{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              and can't afford to stop.
            </span>
          </h2>
        </div>

        {/* Bento grid */}
        <div
          className="grid gap-px reveal"
          style={{
            gridTemplateColumns: 'repeat(2, 1fr)',
            background: 'var(--bg-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 p-6 transition-all duration-normal cursor-default"
              style={{
                gridColumn: card.span === 'full' ? 'span 2' : 'span 1',
                background: 'var(--bg-surface)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-elevated)'
                e.currentTarget.style.boxShadow = 'inset 0 0 0 1px var(--accent-dim)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-surface)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {card.accent && (
                <div
                  className="w-8 h-0.5 rounded"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              {card.icon && (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                  style={{ background: 'var(--accent-dim)' }}
                >
                  {card.icon}
                </div>
              )}
              <h3
                className="font-display font-semibold"
                style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}
              >
                {card.title}
              </h3>
              <p
                className="font-body text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── STACK ─────────────────────────────────────────────────────────
function Stack() {
  const pills = [
    'OpenRouter', 'Supabase', 'GitHub API',
    'Next.js 15', 'ts-morph', 'Claude Sonnet',
    'Poolside Laguna', 'Fastify', 'PostgreSQL',
  ]

  return (
    <section
      className="px-6 py-20"
      style={{ borderTop: '1px solid var(--bg-border)' }}
    >
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center reveal">
        <p
          className="font-mono text-xs tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Powered by
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {pills.map(p => (
            <span
              key={p}
              className="px-3 py-1.5 font-mono text-xs rounded-pill transition-all duration-fast cursor-default"
              style={{
                border: '1px solid var(--bg-border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-dim)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--bg-border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {p}
            </span>
          ))}
        </div>
        <p
          className="font-body text-sm leading-relaxed max-w-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          The world's best coding models. Stateful sessions. Encrypted credentials. Works on every screen.
        </p>
      </div>
    </section>
  )
}

// ─── FINAL CTA ─────────────────────────────────────────────────────
function FinalCTA({ onSignup }) {
  return (
    <section
      className="relative px-6 py-32 overflow-hidden"
      style={{ borderTop: '1px solid var(--bg-border)' }}
    >
      {/* Radial glow from bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(232,103,26,0.09) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center gap-8 reveal">
        <ForgeWordmark size="xl" underline />

        <p
          className="font-body font-light leading-relaxed"
          style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: 'var(--text-muted)' }}
        >
          Your codebase understood. Your code shipped.
          <strong
            className="block mt-2 font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Start building from anywhere.
          </strong>
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onSignup}
          fullWidth
          className="max-w-sm"
          style={{ fontSize: '1rem' }}
        >
          Connect Your Repo — It's Free
        </Button>

        <p
          className="font-mono text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Works on web, tablet, and mobile. Your model. Your key.
        </p>
      </div>
    </section>
  )
}

// ─── FOOTER ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="px-6 py-5 flex items-center justify-between"
      style={{ borderTop: '1px solid var(--bg-border)' }}
    >
      <ForgeWordmark size="xs" />
      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        © 2026 Forge
      </p>
    </footer>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  useReveal()

  const goLogin  = () => router.push('/login')
  const goSignup = () => router.push('/signup')

  return (
    <div className="min-h-screen bg-base">
      <Nav onLogin={goLogin} onSignup={goSignup} />
      <main>
        <Hero   onSignup={goSignup} />
        <Problem />
        <HowItWorks />
        <Features />
        <Stack />
        <FinalCTA onSignup={goSignup} />
      </main>
      <Footer />
    </div>
  )
}

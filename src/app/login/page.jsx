'use client'

/**
 * FORGE — Login Page
 * Phase 2: Auth & Onboarding
 *
 * Split layout: left panel (product context) · right panel (form)
 * Left hidden on mobile. No marketing copy. Just get them in.
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ForgeWordmark from '@/components/ui/ForgeWordmark'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── LEFT PANEL ────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)' }}
    >
      {/* Grid */}
      <div className="forge-grid" aria-hidden="true" />

      <ForgeWordmark size="sm" />

      <div className="relative z-10 flex flex-col gap-6">
        <h2
          className="font-display font-bold leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
        >
          Understands your codebase.
          <span style={{ color: 'var(--accent)', display: 'block' }}>
            Plans. Codes. Ships.
          </span>
        </h2>
        <p
          className="font-body text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', maxWidth: '32ch' }}
        >
          Repository-aware AI that reads every import, export, and dependency before writing a single line.
        </p>

        {/* Mini steps */}
        <div className="flex flex-col gap-3 mt-2">
          {[
            'Connect your GitHub repo',
            'Describe what you want',
            'Review the plan',
            'Approve the code',
            'Merge your branch',
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span
                className="font-mono text-xs w-5"
                style={{ color: 'rgba(232,103,26,0.5)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="font-body text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p
        className="font-mono text-xs relative z-10"
        style={{ color: 'var(--text-muted)' }}
      >
        Works on web, tablet, and mobile.
      </p>
    </div>
  )
}

// ─── FORM ──────────────────────────────────────────────────────────
function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [notice,   setNotice]   = useState(null)

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setNotice('Account created — sign in to continue.')
    }
    if (searchParams.get('error') === 'auth_failed') {
      setError('Authentication failed. Please try again.')
    }
  }, [searchParams])

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email or password is incorrect.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/app')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        {/* Mobile-only wordmark */}
        <div className="lg:hidden mb-2">
          <ForgeWordmark size="sm" />
        </div>
        <h1
          className="font-display font-bold"
          style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}
        >
          Welcome back
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          Sign in to your Forge account.
        </p>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className="px-4 py-3 rounded-lg text-xs font-body"
          style={{
            background: 'rgba(45,212,191,0.08)',
            border: '1px solid rgba(45,212,191,0.2)',
            color: 'var(--success)',
          }}
        >
          {notice}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          error={error}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!email || !password}
          fullWidth
          className="mt-2"
        >
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--bg-border)' }} />
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          FORGE
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--bg-border)' }} />
      </div>

      {/* Signup link */}
      <p
        className="font-body text-xs text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/signup')}
          className="transition-colors duration-fast"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          Create one
        </button>
      </p>
    </div>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div
      className="min-h-screen grid lg:grid-cols-2"
      style={{ background: 'var(--bg-base)' }}
    >
      <LeftPanel />

      {/* Right panel */}
      <div className="flex items-center justify-center px-8 py-16">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

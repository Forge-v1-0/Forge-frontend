'use client'

/**
 * FORGE — Signup Page
 * Phase 2: Auth & Onboarding
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ForgeWordmark from '@/components/ui/ForgeWordmark'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── LEFT PANEL (reused from login) ───────────────────────────────
function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)' }}
    >
      <div className="forge-grid" aria-hidden="true" />
      <ForgeWordmark size="sm" />

      <div className="relative z-10 flex flex-col gap-6">
        <h2
          className="font-display font-bold leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
        >
          Your codebase,
          <span style={{ color: 'var(--accent)', display: 'block' }}>
            finally understood.
          </span>
        </h2>
        <p
          className="font-body text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', maxWidth: '32ch' }}
        >
          Connect a repo, describe what you want to build, and let Forge plan, code, and ship it — with your approval at every step.
        </p>

        {/* Trust signals */}
        <div className="flex flex-col gap-2 mt-2">
          {[
            'Your API key — encrypted at rest',
            'Your PAT — never logged',
            'Your main branch — always untouched',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="var(--success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                {item}
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
function SignupForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const passwordMismatch = confirm && password !== confirm

  async function handleSignup(e) {
    e.preventDefault()
    if (passwordMismatch) return
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/login?signup=success')
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="lg:hidden mb-2">
          <ForgeWordmark size="sm" />
        </div>
        <h1
          className="font-display font-bold"
          style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}
        >
          Create your account
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          Start building from anywhere.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
          placeholder="Min. 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          error={passwordMismatch ? 'Passwords do not match' : error}
        />

        <p
          className="font-body text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          By creating an account you agree to our{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Terms of Service</span>{' '}
          and{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Privacy Policy</span>.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!email || !password || !confirm || !!passwordMismatch}
          fullWidth
          className="mt-1"
        >
          Create Account
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

      <p
        className="font-body text-xs text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="transition-colors duration-fast"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          Log in
        </button>
      </p>
    </div>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────
export default function SignupPage() {
  return (
    <div
      className="min-h-screen grid lg:grid-cols-2"
      style={{ background: 'var(--bg-base)' }}
    >
      <LeftPanel />
      <div className="flex items-center justify-center px-8 py-16">
        <SignupForm />
      </div>
    </div>
  )
}

'use client'

/**
 * FORGE — AppShell + Sidebar + Topbar
 * Phase 7: Session History & App Shell
 *
 * Layout:
 *   [ Topbar — full width, 58px ]
 *   [ Sidebar (collapsible) | Main content ]
 *
 * Mobile: sidebar slides in as drawer from left.
 * Desktop: sidebar collapses to 52px icon rail.
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSessions } from '@/lib/hooks/useSessions'
import { useUser } from '@/lib/hooks/useUser'
import { useRepos } from '@/lib/hooks/useRepos'
import { createClient } from '@/lib/supabase/client'
import ForgeWordmark from '@/components/ui/ForgeWordmark'
import StatusDot from '@/components/ui/StatusDot'

// ─── TIME HELPER ───────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── SESSION GROUPING ──────────────────────────────────────────────
function groupSessions(sessions) {
  const now   = Date.now()
  const DAY   = 86400000
  const WEEK  = 7 * DAY
  const groups = { Today: [], Yesterday: [], 'This week': [], Older: [] }

  sessions.forEach(s => {
    const age = now - new Date(s.created_at).getTime()
    if (age < DAY)         groups.Today.push(s)
    else if (age < 2*DAY)  groups.Yesterday.push(s)
    else if (age < WEEK)   groups['This week'].push(s)
    else                   groups.Older.push(s)
  })

  return Object.entries(groups).filter(([, v]) => v.length > 0)
}

// ─── TOPBAR ────────────────────────────────────────────────────────
function Topbar({ open, onToggle, selectedRepo, repos, onRepoChange }) {
  const router   = useRouter()
  const { user } = useUser()
  const [repoOpen, setRepoOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('[data-dropdown]')) {
        setRepoOpen(false)
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 gap-4"
      style={{
        height: '58px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--bg-border)',
      }}
    >
      {/* Left: hamburger + wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-md transition-colors duration-fast"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <ForgeWordmark size="xs" />
      </div>

      {/* Centre: repo selector */}
      <div className="relative flex-1 max-w-xs" data-dropdown>
        <button
          onClick={() => { setRepoOpen(v => !v); setUserOpen(false) }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md w-full transition-all duration-fast"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: selectedRepo ? 'var(--success)' : 'var(--text-muted)' }}
          />
          <span className="font-mono text-xs truncate flex-1 text-left">
            {selectedRepo?.name || 'Select repository'}
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>

        {repoOpen && repos?.length > 0 && (
          <div
            className="absolute top-full mt-1 left-0 right-0 rounded-lg overflow-hidden z-50 animate-slide-up"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {repos.map(repo => (
              <button
                key={repo.id}
                onClick={() => { onRepoChange(repo); setRepoOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors duration-fast"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: repo.index_status === 'indexed'
                      ? 'var(--success)'
                      : repo.index_status === 'indexing'
                        ? 'var(--warning)'
                        : 'var(--text-muted)',
                  }}
                />
                <span className="font-mono text-xs truncate">{repo.name}</span>
                {repo.index_status === 'indexing' && (
                  <span
                    className="ml-auto font-mono text-xs forge-pulse"
                    style={{ color: 'var(--warning)' }}
                  >
                    indexing…
                  </span>
                )}
              </button>
            ))}
            <div style={{ height: '1px', background: 'var(--bg-border)' }} />
            <button
              onClick={() => { router.push('/app'); setRepoOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors duration-fast"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-mono text-xs">Add repository</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: user avatar */}
      <div className="relative" data-dropdown>
        <button
          onClick={() => { setUserOpen(v => !v); setRepoOpen(false) }}
          className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all duration-fast"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-warm))',
            color: '#fff',
          }}
          aria-label="User menu"
        >
          {initials}
        </button>

        {userOpen && (
          <div
            className="absolute top-full mt-2 right-0 rounded-lg overflow-hidden z-50 w-44 animate-slide-up"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <p className="font-mono text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => { router.push('/app/settings'); setUserOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-fast"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.6 2.6l.7.7M10.7 10.7l.7.7M11.4 2.6l-.7.7M3.3 10.7l-.7.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Settings
            </button>
            <div style={{ height: '1px', background: 'var(--bg-border)' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-fast"
              style={{ color: 'var(--error)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 2H2V12H5M9 10L13 7L9 4M13 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

// ─── SIDEBAR ───────────────────────────────────────────────────────
function Sidebar({ open, selectedRepoId }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { sessions, loading } = useSessions(selectedRepoId)
  const grouped  = groupSessions(sessions)

  return (
    <aside
      className="fixed left-0 bottom-0 flex flex-col z-40 transition-all duration-normal overflow-hidden"
      style={{
        top: '58px',
        width: open ? '236px' : '52px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)',
      }}
    >
      {/* New Task */}
      <div className="p-2 shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <button
          onClick={() => router.push('/app')}
          className="w-full flex items-center gap-2.5 rounded-md transition-all duration-fast min-h-[40px] px-2"
          style={{
            background: pathname === '/app' ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${pathname === '/app' ? 'var(--accent-dim)' : 'transparent'}`,
            color: pathname === '/app' ? 'var(--accent)' : 'var(--text-muted)',
          }}
          onMouseEnter={e => {
            if (pathname !== '/app') {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'var(--bg-elevated)'
            }
          }}
          onMouseLeave={e => {
            if (pathname !== '/app') {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'transparent'
            }
          }}
          title={!open ? 'New Task' : undefined}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {open && (
            <span className="font-body text-sm font-medium truncate">New Task</span>
          )}
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-2">
        {open && (
          <>
            {loading ? (
              <div className="px-3 py-4 flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-md animate-pulse"
                    style={{ background: 'var(--bg-elevated)' }}
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col gap-1">
                <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                  No sessions yet
                </p>
                <p className="font-mono text-xs" style={{ color: 'rgba(80,80,90,0.6)' }}>
                  Start your first task
                </p>
              </div>
            ) : (
              grouped.map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p
                    className="px-3 pt-3 pb-1 font-mono text-xs uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {group}
                  </p>
                  {items.map(session => {
                    const isActive = pathname === `/app/session/${session.id}`
                    return (
                      <button
                        key={session.id}
                        onClick={() => router.push(`/app/session/${session.id}`)}
                        className="w-full text-left px-2 mx-1 py-2.5 rounded-md transition-all duration-fast"
                        style={{
                          width: 'calc(100% - 8px)',
                          background: isActive ? 'var(--bg-elevated)' : 'transparent',
                          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <p
                          className="font-body text-xs font-medium truncate leading-snug mb-1.5"
                          style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                        >
                          {session.task}
                        </p>
                        <div className="flex items-center justify-between">
                          <StatusDot status={session.status} showLabel={false} size="xs" />
                          <span
                            className="font-mono text-xs"
                            style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                          >
                            {timeAgo(session.created_at)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </>
        )}

        {/* Collapsed: show status dots only */}
        {!open && sessions.slice(0, 8).map(session => (
          <button
            key={session.id}
            onClick={() => router.push(`/app/session/${session.id}`)}
            className="w-full flex items-center justify-center py-2 transition-colors duration-fast"
            title={session.task}
          >
            <StatusDot status={session.status} showLabel={false} size="sm" />
          </button>
        ))}
      </div>

      {/* Settings */}
      {open && (
        <div className="p-2 shrink-0" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button
            onClick={() => router.push('/app/settings')}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-all duration-fast"
            style={{
              color: pathname === '/app/settings' ? 'var(--accent)' : 'var(--text-muted)',
              background: pathname === '/app/settings' ? 'var(--accent-dim)' : 'transparent',
            }}
            onMouseEnter={e => {
              if (pathname !== '/app/settings') {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'var(--bg-elevated)'
              }
            }}
            onMouseLeave={e => {
              if (pathname !== '/app/settings') {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.6 2.6l.7.7M10.7 10.7l.7.7M11.4 2.6l-.7.7M3.3 10.7l-.7.7"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="font-body text-xs">Settings</span>
          </button>
        </div>
      )}
    </aside>
  )
}

// ─── APP SHELL ─────────────────────────────────────────────────────
export default function AppShell({ children }) {
  const [open,         setOpen]         = useState(true)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const { repos }                        = useRepos()

  // Auto-select first indexed repo
  useEffect(() => {
    if (!selectedRepo && repos?.length > 0) {
      const indexed = repos.find(r => r.index_status === 'indexed') || repos[0]
      setSelectedRepo(indexed)
    }
  }, [repos, selectedRepo])

  const SIDEBAR_WIDTH = open ? 236 : 52

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar
        open={open}
        onToggle={() => setOpen(v => !v)}
        selectedRepo={selectedRepo}
        repos={repos}
        onRepoChange={setSelectedRepo}
      />
      <Sidebar open={open} selectedRepoId={selectedRepo?.id} />

      {/* Main content — offset by sidebar + topbar */}
      <main
        className="transition-all duration-normal"
        style={{
          marginTop:  '58px',
          marginLeft: `${SIDEBAR_WIDTH}px`,
          minHeight:  'calc(100vh - 58px)',
        }}
      >
        {/* Pass selectedRepo down via context or props as needed */}
        {typeof children === 'function'
          ? children({ selectedRepo, setSelectedRepo })
          : children}
      </main>
    </div>
  )
}

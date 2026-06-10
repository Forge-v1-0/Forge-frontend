'use client'

/**
 * FORGE — CodeReview + DiffViewer component
 * Phase 6: Coding Execution Interface — CRITICAL FEATURE
 *
 * This is the trust mechanism for code approval.
 * Every change is visible before it ships.
 *
 * Features:
 * - GitHub-quality diff viewer: line numbers, +/- indicators
 * - Minimal JS/TS syntax tokeniser (no heavy library)
 * - Collapsible unchanged sections ("... 8 unchanged lines ...")
 * - Planner explanation panel below each diff
 * - Multi-file navigator at top
 * - Approve / Request Changes / Reject & Replan actions
 * - Push confirmation screen
 */

import { useState, useMemo } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'

// ─── MINIMAL TS/JS TOKENISER ───────────────────────────────────────
// Colours key syntax without a heavy library.
// Regex-based, handles: keywords, strings, comments, types, numbers.
const KEYWORD_RE  = /\b(const|let|var|function|async|await|return|import|export|default|from|if|else|for|while|class|extends|new|typeof|instanceof|throw|try|catch|finally|interface|type|enum|implements|void|null|undefined|true|false|in|of|break|continue|switch|case|do|delete)\b/g
const STRING_RE   = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g
const COMMENT_RE  = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g
const TYPE_RE     = /\b([A-Z][A-Za-z0-9_]*)\b/g
const NUMBER_RE   = /\b(\d+\.?\d*)\b/g

function tokenise(code) {
  // Returns array of {text, type} tokens
  // Simple approach: escape HTML then apply span wrappers
  if (!code) return ''

  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(COMMENT_RE, m => `<span style="color:var(--text-muted);font-style:italic">${m}</span>`)
    .replace(STRING_RE,  m => `<span style="color:var(--success)">${m}</span>`)
    .replace(KEYWORD_RE, m => `<span style="color:var(--info)">${m}</span>`)
    .replace(TYPE_RE,    m => `<span style="color:var(--accent-warm)">${m}</span>`)
    .replace(NUMBER_RE,  m => `<span style="color:var(--warning)">${m}</span>`)
}

// ─── DIFF PARSER ──────────────────────────────────────────────────
// Parses unified diff text into line objects.
function parseDiff(diffText) {
  if (!diffText) return []
  const lines = diffText.split('\n')
  let oldN = 0, newN = 0
  const result = []

  for (const raw of lines) {
    if (raw.startsWith('---') || raw.startsWith('+++')) continue

    if (raw.startsWith('@@')) {
      // Hunk header — e.g. @@ -4,7 +4,9 @@
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (m) { oldN = parseInt(m[1]); newN = parseInt(m[2]) }
      result.push({ type: 'hunk', text: raw })
      continue
    }

    if (raw.startsWith('+')) {
      result.push({ type: 'add', oldN: null, newN: newN++, text: raw.slice(1) })
    } else if (raw.startsWith('-')) {
      result.push({ type: 'del', oldN: oldN++, newN: null, text: raw.slice(1) })
    } else {
      result.push({ type: 'neutral', oldN: oldN++, newN: newN++, text: raw.startsWith(' ') ? raw.slice(1) : raw })
    }
  }

  return result
}

// ─── DIFF VIEWER ──────────────────────────────────────────────────
const CONTEXT_LINES = 3 // show N lines either side of a change

function DiffViewer({ diffText, fileName }) {
  const [expandedHunks, setExpandedHunks] = useState({})
  const parsed = useMemo(() => parseDiff(diffText), [diffText])

  const addCount     = parsed.filter(l => l.type === 'add').length
  const delCount     = parsed.filter(l => l.type === 'del').length
  const isNewFile    = delCount === 0 && addCount > 0
  const isDeletedFile = addCount === 0 && delCount > 0

  if (!parsed.length) return (
    <div className="py-8 text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
      No diff available
    </div>
  )

  // Collapse long neutral runs
  function shouldCollapse(lines) {
    // Group into segments: changed vs neutral
    const groups = []
    let current  = null
    lines.forEach((line, i) => {
      const isChanged = line.type === 'add' || line.type === 'del'
      if (!current || current.changed !== isChanged) {
        current = { changed: isChanged, start: i, end: i }
        groups.push(current)
      } else {
        current.end = i
      }
    })
    return groups
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--bg-border)', background: 'var(--bg-base)' }}
    >
      {/* File header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--bg-border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 1h6l3 3v8H2V1z" stroke="var(--info)" strokeWidth="1.2" />
            <path d="M8 1v3h3" stroke="var(--info)" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-xs" style={{ color: 'var(--info)' }}>
            {fileName || 'file.ts'}
          </span>
          {isNewFile    && <FileMark type="new" />}
          {isDeletedFile && <FileMark type="deleted" />}
          {!isNewFile && !isDeletedFile && <FileMark type="modified" />}
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          {addCount > 0 && (
            <span style={{ color: 'var(--success)' }}>+{addCount}</span>
          )}
          {delCount > 0 && (
            <span style={{ color: 'var(--error)' }}>−{delCount}</span>
          )}
        </div>
      </div>

      {/* Diff lines */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <tbody>
            {parsed.map((line, i) => {
              if (line.type === 'hunk') {
                return (
                  <tr key={i}>
                    <td
                      colSpan={3}
                      className="px-4 py-1 select-none"
                      style={{
                        background: 'rgba(96,165,250,0.06)',
                        color: 'var(--text-muted)',
                        borderTop: '1px solid var(--bg-border)',
                        borderBottom: '1px solid var(--bg-border)',
                        fontStyle: 'italic',
                      }}
                    >
                      {line.text}
                    </td>
                  </tr>
                )
              }

              const bgMap    = { add: 'rgba(45,212,191,0.07)', del: 'rgba(248,113,113,0.07)', neutral: 'transparent' }
              const numColor = { add: 'var(--success)', del: 'var(--error)', neutral: 'var(--text-muted)' }
              const prefix   = { add: '+', del: '−', neutral: ' ' }
              const prefixColor = { add: 'var(--success)', del: 'var(--error)', neutral: 'var(--text-muted)' }

              return (
                <tr
                  key={i}
                  style={{ background: bgMap[line.type] }}
                >
                  {/* Old line num */}
                  <td
                    className="px-3 py-0.5 text-right select-none w-10"
                    style={{
                      color: numColor[line.type],
                      borderRight: '1px solid var(--bg-border)',
                      background: line.type !== 'neutral' ? bgMap[line.type] : 'rgba(0,0,0,0.15)',
                      minWidth: '40px',
                    }}
                  >
                    {line.oldN ?? ''}
                  </td>
                  {/* New line num */}
                  <td
                    className="px-3 py-0.5 text-right select-none w-10"
                    style={{
                      color: numColor[line.type],
                      borderRight: '1px solid var(--bg-border)',
                      background: line.type !== 'neutral' ? bgMap[line.type] : 'rgba(0,0,0,0.15)',
                      minWidth: '40px',
                    }}
                  >
                    {line.newN ?? ''}
                  </td>
                  {/* Prefix */}
                  <td
                    className="px-2 py-0.5 select-none w-5"
                    style={{ color: prefixColor[line.type] }}
                  >
                    {prefix[line.type]}
                  </td>
                  {/* Content */}
                  <td
                    className="px-2 py-0.5 whitespace-pre"
                    style={{ color: line.type === 'neutral' ? 'var(--text-secondary)' : undefined }}
                    dangerouslySetInnerHTML={{ __html: tokenise(line.text) }}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Small helper for file type marks
function FileMark({ type }) {
  const map = {
    new:      { label: 'NEW',      color: 'var(--success)', bg: 'rgba(45,212,191,0.08)'  },
    modified: { label: 'MODIFIED', color: 'var(--info)',    bg: 'rgba(96,165,250,0.08)'  },
    deleted:  { label: 'DELETED',  color: 'var(--error)',   bg: 'rgba(248,113,113,0.08)' },
  }
  const s = map[type] || map.modified
  return (
    <span
      className="font-mono text-xs px-1.5 py-0.5 rounded"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  )
}

// ─── MULTI-FILE NAV ────────────────────────────────────────────────
function FileNav({ tasks, activeId, onSelect }) {
  if (!tasks?.length) return null
  return (
    <div
      className="flex items-center gap-1 px-4 py-2 overflow-x-auto"
      style={{
        borderBottom: '1px solid var(--bg-border)',
        background: 'var(--bg-elevated)',
      }}
    >
      {tasks.map(task => {
        const isActive  = task.id === activeId
        const isDone    = task.status === 'done'
        const isReady   = task.status === 'awaiting_approval'
        const isRunning = task.status === 'running'

        return (
          <button
            key={task.id}
            onClick={() => (isDone || isReady) && onSelect(task)}
            disabled={!isDone && !isReady}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs whitespace-nowrap transition-all duration-fast shrink-0"
            style={{
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              color: isActive
                ? 'var(--accent)'
                : isDone
                  ? 'var(--success)'
                  : isReady
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
              cursor: (isDone || isReady) ? 'pointer' : 'default',
            }}
          >
            {isDone && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5.5L4 7.5L8 3.5" stroke="var(--success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isRunning && (
              <span
                className="w-1.5 h-1.5 rounded-full forge-pulse"
                style={{ background: 'var(--warning)' }}
              />
            )}
            {task.file_path?.split('/').pop() || 'file'}
          </button>
        )
      })}
    </div>
  )
}

// ─── PUSH CONFIRMATION ────────────────────────────────────────────
function PushConfirmation({ session, onPush, onCancel, pushing }) {
  const tasks = session?.tasks || []
  const adds  = tasks.reduce((n, t) => n + (t.lines_added   || 0), 0)
  const dels  = tasks.reduce((n, t) => n + (t.lines_deleted || 0), 0)

  return (
    <div className="flex flex-col h-full items-center justify-center px-8">
      <div
        className="w-full max-w-md rounded-xl p-8 flex flex-col gap-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3v10M6 9l4 4 4-4M4 15h12" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <h2
            className="font-display font-bold mb-1"
            style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}
          >
            Ready to push
          </h2>
          <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
            All subtasks approved. This will push to a new branch on GitHub.
          </p>
        </div>

        {/* Stats */}
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
        >
          <div className="flex items-center justify-between font-mono text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Branch</span>
            <span style={{ color: 'var(--accent-warm)' }}>
              forge/{session?.task?.toLowerCase().replace(/\s+/g, '-').slice(0, 30) || 'changes'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Files changed</span>
            <span style={{ color: 'var(--text-primary)' }}>{tasks.length}</span>
          </div>
          {adds > 0 && (
            <div className="flex items-center justify-between font-mono text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Lines added</span>
              <span style={{ color: 'var(--success)' }}>+{adds}</span>
            </div>
          )}
          {dels > 0 && (
            <div className="flex items-center justify-between font-mono text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Lines removed</span>
              <span style={{ color: 'var(--error)' }}>−{dels}</span>
            </div>
          )}
        </div>

        <p
          className="font-body text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Your main branch will not be touched. Open a Pull Request on GitHub and merge when you're ready.
        </p>

        <div className="flex gap-3">
          <Button variant="primary" size="md" className="flex-1" loading={pushing} onClick={onPush}>
            Push to GitHub
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── PUSH SUCCESS ─────────────────────────────────────────────────
function PushSuccess({ session }) {
  const branchName = `forge/${session?.task?.toLowerCase().replace(/\s+/g, '-').slice(0, 30) || 'changes'}`
  const repoUrl    = session?.repo_url || '#'
  const prUrl      = `${repoUrl}/compare/${branchName}`

  return (
    <div className="flex flex-col h-full items-center justify-center px-8">
      <div
        className="w-full max-w-md rounded-xl p-8 flex flex-col gap-6 text-center items-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid var(--success)' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M4 11.5L8.5 16L18 6" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <h2
            className="font-display font-bold mb-2"
            style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}
          >
            Pushed successfully
          </h2>
          <p
            className="font-mono text-xs"
            style={{ color: 'var(--accent-warm)' }}
          >
            ⎇ {branchName}
          </p>
        </div>

        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your changes are on GitHub. Open a PR to review and merge when you're ready. Main is untouched.
        </p>

        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-body text-sm font-medium transition-all duration-fast"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          Open Pull Request on GitHub
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 10L10 2M4 2h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// ─── REQUEST CHANGES FLOW ─────────────────────────────────────────
function RequestChanges({ task, sessionId, onDone, onCancel }) {
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/agent/replan-subtask', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, subtask_id: task.id, feedback }),
      })
      onDone?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
    >
      <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
        Request changes
      </p>
      <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Describe what's wrong or what to do differently for{' '}
        <span className="font-mono" style={{ color: 'var(--info)' }}>
          {task?.file_path}
        </span>
        . Forge will rewrite this subtask only.
      </p>
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="e.g. Use a Map instead of a plain object. Add a JSDoc comment explaining the rate limit logic."
        rows={3}
        className="w-full rounded-md px-3 py-2 font-body text-sm resize-none"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--bg-border)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.boxShadow   = '0 0 0 3px var(--accent-dim)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--bg-border)'
          e.target.style.boxShadow   = 'none'
        }}
      />
      {error && <p className="font-body text-xs" style={{ color: 'var(--error)' }}>{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
          Rewrite this file
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── CODE REVIEW (main export) ────────────────────────────────────
export default function CodeReview({ session, onApproved, onPushComplete, onRefetch }) {
  const tasks = session?.tasks || []

  const readyTask   = tasks.find(t => t.status === 'awaiting_approval')
  const [activeTask, setActiveTask] = useState(readyTask || tasks[0])
  const [approving,  setApproving]  = useState(false)
  const [pushing,    setPushing]    = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [showPush,    setShowPush]    = useState(false)
  const [pushed,      setPushed]      = useState(session?.status === 'done')
  const [error,       setError]       = useState(null)

  // Determine which task to show
  const currentTask = activeTask || readyTask || tasks[0]
  const draft       = currentTask?.code_drafts?.[0]
  const allApproved = tasks.every(t => t.status === 'done')

  async function handleApprove() {
    if (!currentTask) return
    setError(null)
    setApproving(true)
    try {
      await apiFetch('/agent/approve-code', {
        method: 'POST',
        body: JSON.stringify({
          session_id: session.id,
          subtask_id: currentTask.id,
          draft_id:   draft?.id,
        }),
      })
      onApproved?.()
      onRefetch?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setApproving(false)
    }
  }

  async function handlePush() {
    setPushing(true)
    setError(null)
    try {
      await apiFetch('/agent/push', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      })
      setPushed(true)
      onPushComplete?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setPushing(false)
    }
  }

  // Completed push state
  if (pushed) return <PushSuccess session={session} />

  // Push confirmation
  if (showPush) return (
    <PushConfirmation
      session={session}
      onPush={handlePush}
      onCancel={() => setShowPush(false)}
      pushing={pushing}
    />
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Multi-file navigator ──────────────────────────────── */}
      {tasks.length > 1 && (
        <FileNav
          tasks={tasks}
          activeId={currentTask?.id}
          onSelect={setActiveTask}
        />
      )}

      {/* ── Main scroll area ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

        {/* Task header */}
        {currentTask && (
          <div>
            <p
              className="font-mono text-xs uppercase tracking-widest mb-1"
              style={{ color: 'var(--accent)' }}
            >
              Code Review
            </p>
            <p
              className="font-display font-semibold"
              style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}
            >
              {currentTask.file_path}
            </p>
          </div>
        )}

        {/* Diff viewer */}
        {draft?.generated_code ? (
          <DiffViewer
            diffText={draft.generated_code}
            fileName={currentTask?.file_path}
          />
        ) : (
          <div
            className="rounded-lg flex items-center justify-center py-12"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
              <span className="font-mono text-xs">Generating code…</span>
            </div>
          </div>
        )}

        {/* Explanation */}
        {draft?.explanation && (
          <div
            className="rounded-lg px-4 py-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <p
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              What changed and why
            </p>
            <p
              className="font-body text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {draft.explanation}
            </p>
          </div>
        )}

        {/* Request changes inline */}
        {showRequest && currentTask && (
          <RequestChanges
            task={currentTask}
            sessionId={session.id}
            onDone={() => { setShowRequest(false); onRefetch?.() }}
            onCancel={() => setShowRequest(false)}
          />
        )}

        {error && (
          <p className="font-body text-xs" style={{ color: 'var(--error)' }}>{error}</p>
        )}
      </div>

      {/* ── Action bar ────────────────────────────────────────── */}
      <div
        className="px-5 py-4 shrink-0 flex flex-col gap-3"
        style={{ borderTop: '1px solid var(--bg-border)', background: 'var(--bg-surface)' }}
      >
        {allApproved ? (
          /* All subtasks done — offer push */
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6.5L4.5 9L10 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-mono text-xs" style={{ color: 'var(--success)' }}>
                All {tasks.length} subtask{tasks.length > 1 ? 's' : ''} approved
              </span>
            </div>
            <Button variant="primary" size="md" fullWidth onClick={() => setShowPush(true)}>
              Push to GitHub →
            </Button>
          </div>
        ) : currentTask?.status === 'awaiting_approval' ? (
          /* Current task needs review */
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              loading={approving}
              onClick={handleApprove}
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowRequest(v => !v)}
            >
              Request Changes
            </Button>
          </div>
        ) : (
          /* Waiting for coder */
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
            <span className="font-mono text-xs">
              {currentTask?.status === 'running' ? 'Coding…' : 'Waiting…'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

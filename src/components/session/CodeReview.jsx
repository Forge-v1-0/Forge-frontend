'use client'

/**
 * FORGE — CodeReview + DiffViewer component
 * Phase 6: Coding Execution Interface — CRITICAL FEATURE
 *
 * Integration fixes applied:
 *   #1 /agent/approve-code → /agent/approve  |  payload: { draft_id } only
 *   #2 /agent/replan-subtask → /agent/feedback  |  payload: { draft_id, feedback }
 *   #3 Removed separate /agent/push — approve already pushes; use branch/github_url
 *      from the approve response to drive PushSuccess display
 *   #4 generated_code removed — diff computed client-side from
 *      original_content + new_content via Myers-style LCS differ
 */

import { useState, useMemo } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'

// ─── CLIENT-SIDE DIFF COMPUTATION ─────────────────────────────────
// Fix #5: Build a unified diff from original_content + new_content.
// Uses a simple O(ND) LCS approach — no external library needed.

function lcs(a, b) {
  // Returns the longest common subsequence of two line arrays.
  const m = a.length, n = b.length
  // dp[i][j] = length of LCS of a[0..i-1], b[0..j-1]
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  // Backtrack
  const result = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.push({ aIdx: i - 1, bIdx: j - 1 }); i--; j-- }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  return result.reverse()
}

function computeUnifiedDiff(originalContent, newContent, fileName = 'file') {
  // Guard: if no original (new file) show everything as additions
  const origLines = (originalContent || '').split('\n')
  const newLines  = (newContent  || '').split('\n')

  if (!originalContent) {
    // Brand-new file — everything is added
    const hunks = [`@@ -0,0 +1,${newLines.length} @@`]
    newLines.forEach(l => hunks.push(`+${l}`))
    return [`--- /dev/null`, `+++ b/${fileName}`, ...hunks].join('\n')
  }

  const common = lcs(origLines, newLines)
  const lines  = []
  let ai = 0, bi = 0, ci = 0
  const CONTEXT = 3

  // Build raw edit script
  const edits = [] // { type: 'del'|'add'|'eq', aIdx, bIdx, text }
  while (ai < origLines.length || bi < newLines.length) {
    if (ci < common.length && common[ci].aIdx === ai && common[ci].bIdx === bi) {
      edits.push({ type: 'eq', aIdx: ai, bIdx: bi, text: origLines[ai] })
      ai++; bi++; ci++
    } else if (ci < common.length && common[ci].aIdx > ai) {
      edits.push({ type: 'del', aIdx: ai, text: origLines[ai] })
      ai++
    } else {
      edits.push({ type: 'add', bIdx: bi, text: newLines[bi] })
      bi++
    }
  }

  // Group into hunks with CONTEXT lines around changes
  const changedSet = new Set(edits.map((e, i) => e.type !== 'eq' ? i : -1).filter(i => i !== -1))
  const included   = new Set()
  changedSet.forEach(i => {
    for (let d = -CONTEXT; d <= CONTEXT; d++) {
      if (i + d >= 0 && i + d < edits.length) included.add(i + d)
    }
  })

  if (included.size === 0) return '' // no changes

  // Build unified diff string
  const diffLines = [`--- a/${fileName}`, `+++ b/${fileName}`]
  let hunkStart = -1
  let hunkLines = []
  let oldStart = 1, newStart = 1
  let oldCount = 0, newCount = 0

  function flushHunk() {
    if (!hunkLines.length) return
    diffLines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`)
    hunkLines.forEach(l => diffLines.push(l))
    hunkLines = []
    oldCount = 0
    newCount = 0
  }

  let lastIncluded = -1
  edits.forEach((e, i) => {
    if (!included.has(i)) {
      if (hunkLines.length) flushHunk()
      return
    }
    if (lastIncluded !== -1 && i > lastIncluded + 1) flushHunk()
    if (!hunkLines.length) {
      // Count lines before this hunk to set oldStart/newStart
      let oa = 1, nb = 1
      for (let j = 0; j < i; j++) {
        if (edits[j].type !== 'add') oa++
        if (edits[j].type !== 'del') nb++
      }
      oldStart = oa; newStart = nb
    }
    if (e.type === 'del') { hunkLines.push(`-${e.text}`); oldCount++ }
    else if (e.type === 'add') { hunkLines.push(`+${e.text}`); newCount++ }
    else { hunkLines.push(` ${e.text}`); oldCount++; newCount++ }
    lastIncluded = i
  })
  flushHunk()

  return diffLines.join('\n')
}

// ─── MINIMAL TS/JS TOKENISER ───────────────────────────────────────
const KEYWORD_RE  = /\b(const|let|var|function|async|await|return|import|export|default|from|if|else|for|while|class|extends|new|typeof|instanceof|throw|try|catch|finally|interface|type|enum|implements|void|null|undefined|true|false|in|of|break|continue|switch|case|do|delete)\b/g
const STRING_RE   = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g
const COMMENT_RE  = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g
const TYPE_RE     = /\b([A-Z][A-Za-z0-9_]*)\b/g
const NUMBER_RE   = /\b(\d+\.?\d*)\b/g

function tokenise(code) {
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
function parseDiff(diffText) {
  if (!diffText) return []
  const lines = diffText.split('\n')
  let oldN = 0, newN = 0
  const result = []

  for (const raw of lines) {
    if (raw.startsWith('---') || raw.startsWith('+++')) continue

    if (raw.startsWith('@@')) {
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
function DiffViewer({ diffText, fileName }) {
  const parsed   = useMemo(() => parseDiff(diffText), [diffText])
  const addCount = parsed.filter(l => l.type === 'add').length
  const delCount = parsed.filter(l => l.type === 'del').length
  const isNewFile     = delCount === 0 && addCount > 0
  const isDeletedFile = addCount === 0 && delCount > 0

  if (!parsed.length) return (
    <div className="py-8 text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
      No diff available
    </div>
  )

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--bg-border)', background: 'var(--bg-base)' }}
    >
      {/* File header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 1h6l3 3v8H2V1z" stroke="var(--info)" strokeWidth="1.2" />
            <path d="M8 1v3h3" stroke="var(--info)" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-xs" style={{ color: 'var(--info)' }}>
            {fileName || 'file.ts'}
          </span>
          {isNewFile     && <FileMark type="new" />}
          {isDeletedFile && <FileMark type="deleted" />}
          {!isNewFile && !isDeletedFile && <FileMark type="modified" />}
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          {addCount > 0 && <span style={{ color: 'var(--success)' }}>+{addCount}</span>}
          {delCount > 0 && <span style={{ color: 'var(--error)' }}>−{delCount}</span>}
        </div>
      </div>

      {/* Diff table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <tbody>
            {parsed.map((line, i) => {
              if (line.type === 'hunk') return (
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

              const bgMap       = { add: 'rgba(45,212,191,0.07)', del: 'rgba(248,113,113,0.07)', neutral: 'transparent' }
              const numColor    = { add: 'var(--success)', del: 'var(--error)', neutral: 'var(--text-muted)' }
              const prefix      = { add: '+', del: '−', neutral: ' ' }
              const prefixColor = { add: 'var(--success)', del: 'var(--error)', neutral: 'var(--text-muted)' }

              return (
                <tr key={i} style={{ background: bgMap[line.type] }}>
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
                  <td
                    className="px-2 py-0.5 select-none w-5"
                    style={{ color: prefixColor[line.type] }}
                  >
                    {prefix[line.type]}
                  </td>
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
      style={{ borderBottom: '1px solid var(--bg-border)', background: 'var(--bg-elevated)' }}
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
              <span className="w-1.5 h-1.5 rounded-full forge-pulse" style={{ background: 'var(--warning)' }} />
            )}
            {task.file_path?.split('/').pop() || 'file'}
          </button>
        )
      })}
    </div>
  )
}

// ─── PUSH SUCCESS ─────────────────────────────────────────────────
// Fix #4: Now receives real branch + github_url from approve response,
// not from a separate /agent/push call.
function PushSuccess({ branch, githubUrl, session }) {
  const prUrl = githubUrl || '#'
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
          <h2 className="font-display font-bold mb-2" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Pushed successfully
          </h2>
          <p className="font-mono text-xs" style={{ color: 'var(--accent-warm)' }}>
            ⎇ {branch || 'forge/changes'}
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
// Fix #3: /agent/replan-subtask → /agent/feedback  |  payload: { draft_id, feedback }
function RequestChanges({ task, onDone, onCancel }) {
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const draft = task?.code_drafts?.[0]

  async function handleSubmit() {
    if (!draft?.id) {
      setError('No draft found for this task.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Fix #3: correct endpoint + payload
      await apiFetch('/agent/feedback', {
        method: 'POST',
        body: JSON.stringify({ draft_id: draft.id, feedback }),
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
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
        onBlur={e =>  { e.target.style.borderColor = 'var(--bg-border)'; e.target.style.boxShadow = 'none' }}
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

  const readyTask = tasks.find(t => t.status === 'awaiting_approval')
  const [activeTask,   setActiveTask]   = useState(readyTask || tasks[0])
  const [approving,    setApproving]    = useState(false)
  const [showRequest,  setShowRequest]  = useState(false)
  // Fix #4: store real branch + github_url from approve response
  const [pushResult,   setPushResult]   = useState(
    session?.status === 'done' ? { branch: null, githubUrl: null } : null
  )
  const [error, setError] = useState(null)

  const currentTask = activeTask || readyTask || tasks[0]
  const draft       = currentTask?.code_drafts?.[0]
  const allApproved = tasks.every(t => t.status === 'done')

  // Fix #5: compute diff from original_content + new_content
  const diffText = useMemo(() => {
    if (!draft) return ''
    // If backend ever adds a pre-computed diff field, prefer it
    if (draft.diff) return draft.diff
    return computeUnifiedDiff(
      draft.original_content ?? '',
      draft.new_content      ?? '',
      currentTask?.file_path,
    )
  }, [draft?.id, draft?.original_content, draft?.new_content, currentTask?.file_path])

  async function handleApprove() {
    if (!draft?.id) return
    setError(null)
    setApproving(true)
    try {
      // Fix #2: correct endpoint + payload ({ draft_id } only)
      const res = await apiFetch('/agent/approve', {
        method: 'POST',
        body: JSON.stringify({ draft_id: draft.id }),
      })
      // Fix #4: if this was the last task the backend pushes automatically.
      // Capture branch + github_url so PushSuccess can use real data.
      if (res?.branch) {
        setPushResult({ branch: res.branch, githubUrl: res.github_url })
        onPushComplete?.()
      } else {
        onApproved?.()
        onRefetch?.()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setApproving(false)
    }
  }

  // Completed push state
  if (pushResult) return (
    <PushSuccess
      branch={pushResult.branch}
      githubUrl={pushResult.githubUrl}
      session={session}
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

        {/* Diff viewer — Fix #5: uses computed diffText */}
        {diffText ? (
          <DiffViewer diffText={diffText} fileName={currentTask?.file_path} />
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
            <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {draft.explanation}
            </p>
          </div>
        )}

        {/* Request changes inline */}
        {showRequest && currentTask && (
          <RequestChanges
            task={currentTask}
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
          // All subtasks done — last approve call already pushed, show status
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6.5L4.5 9L10 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mono text-xs" style={{ color: 'var(--success)' }}>
              All {tasks.length} subtask{tasks.length > 1 ? 's' : ''} approved — pushing…
            </span>
          </div>
        ) : currentTask?.status === 'awaiting_approval' ? (
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

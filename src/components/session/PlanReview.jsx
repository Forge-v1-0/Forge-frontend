'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import StatusDot from '@/components/ui/StatusDot'

// ─── RISK INDICATOR ────────────────────────────────────────────────
// Matches mockup: "● Risk: Low" with coloured dot
function RiskIndicator({ risk }) {
  const map = {
    low:    { color: 'var(--success)',  label: 'Low'    },
    medium: { color: 'var(--warning)',  label: 'Medium' },
    high:   { color: 'var(--error)',    label: 'High'   },
  }
  const s = map[risk?.toLowerCase()] || map.medium
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
      <span className="font-mono text-xs" style={{ color: s.color }}>
        Risk: {s.label}
      </span>
    </div>
  )
}

// ─── FILE BADGE ────────────────────────────────────────────────────
function FileBadge({ type }) {
  const map = {
    new:      { label: 'NEW',      color: 'var(--success)', bg: 'rgba(45,212,191,0.08)'  },
    modified: { label: 'MODIFIED', color: 'var(--info)',    bg: 'rgba(96,165,250,0.08)'  },
    deleted:  { label: 'DELETED',  color: 'var(--error)',   bg: 'rgba(248,113,113,0.08)' },
  }
  const s = map[type?.toLowerCase()] || map.modified
  return (
    <span
      className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  )
}

// ─── SUBTASK CARD ──────────────────────────────────────────────────
function SubtaskCard({ subtask, index, editing, onEdit, onSave, onCancel, onChange, execStatus }) {
  const isDone    = execStatus === 'done'
  const isRunning = execStatus === 'running'
  const isReady   = execStatus === 'awaiting_approval'

  return (
    <div
      className="rounded-lg transition-all duration-fast"
      style={{
        border: `1px solid ${isRunning ? 'var(--accent)' : 'var(--bg-border)'}`,
        background: isRunning ? 'rgba(232,103,26,0.04)' : 'var(--bg-surface)',
        boxShadow: isRunning ? '0 0 12px rgba(232,103,26,0.1)' : 'none',
      }}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span
          className="font-mono text-xs font-semibold shrink-0 mt-0.5 w-5"
          style={{ color: 'var(--accent)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-mono text-xs truncate" style={{ color: 'var(--info)' }}>
              {subtask.file_path || 'unknown file'}
            </span>
            <FileBadge type={subtask.change_type || 'modified'} />
          </div>

          {editing ? (
            <textarea
              value={subtask.instruction}
              onChange={e => onChange(e.target.value)}
              rows={4}
              className="w-full rounded-md px-3 py-2 font-mono text-xs resize-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--accent)',
                color: 'var(--text-secondary)',
                outline: 'none',
                boxShadow: '0 0 0 3px var(--accent-dim)',
              }}
            />
          ) : (
            <p
              className="font-body text-sm leading-relaxed"
              style={{
                color: 'var(--text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {subtask.instruction}
            </p>
          )}
        </div>
      </div>

      {/* Risk reason warning */}
      {subtask.risk_reason && subtask.risk !== 'low' && (
        <div
          className="mx-4 mb-3 px-3 py-2 rounded-md font-body text-xs leading-relaxed"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            borderLeft: '2px solid var(--warning)',
          }}
        >
          ⚠ {subtask.risk_reason}
        </div>
      )}

      <div
        className="flex items-center justify-between px-4 pb-3 pt-2"
        style={{ borderTop: '1px solid var(--bg-border)' }}
      >
        {editing ? (
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={onSave}>Save</Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="font-body text-xs transition-colors duration-fast"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Edit instruction
          </button>
        )}

        {/* Execution status — matches mockup dot indicators */}
        <RiskIndicator risk={subtask.risk} />
      </div>
    </div>
  )
}

// ─── REJECT FLOW ───────────────────────────────────────────────────
function RejectFlow({ sessionId, onReplanned, onCancel }) {
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleReject() {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/agent/replan', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, feedback }),
      })
      onReplanned?.()   // FIX: was never called before
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4"
      style={{
        background: 'rgba(248,113,113,0.05)',
        border: '1px solid rgba(248,113,113,0.2)',
      }}
    >
      <p className="font-body text-sm font-semibold" style={{ color: 'var(--error)' }}>
        Request changes to plan
      </p>
      <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Tell Forge what to do differently. Your feedback will trigger a full replan.
      </p>
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="e.g. Don't touch the auth routes. Focus only on the API middleware layer."
        rows={3}
        className="w-full rounded-md px-3 py-2 font-body text-sm resize-none"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
        onBlur={e =>  { e.target.style.borderColor = 'var(--bg-border)'; e.target.style.boxShadow = 'none' }}
      />
      {error && <p className="font-body text-xs" style={{ color: 'var(--error)' }}>{error}</p>}
      <div className="flex gap-2">
        <Button variant="danger" size="sm" loading={loading} onClick={handleReject}>
          Reject & Replan
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── PLAN REVIEW (main export) ─────────────────────────────────────
export default function PlanReview({ session, onApproved, onReplanned }) {
  const plan = session?.plan

  const [subtasks,     setSubtasks]     = useState(plan?.subtasks || [])
  const [editingIndex, setEditingIndex] = useState(null)
  const [approving,    setApproving]    = useState(false)
  const [showReject,   setShowReject]   = useState(false)
  const [error,        setError]        = useState(null)

  const execTasks = session?.tasks || []
  const isCoding  = ['coding', 'awaiting_approval', 'done'].includes(session?.status)

  function updateInstruction(index, value) {
    setSubtasks(prev => prev.map((s, i) => i === index ? { ...s, instruction: value } : s))
  }

  async function handleApprove() {
    setError(null)
    setApproving(true)
    try {
      await apiFetch('/agent/edit-plan', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id, subtasks }),
      })
      await apiFetch('/agent/approve-plan', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      })
      onApproved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header */}
      <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-1.5 h-1.5 rounded-full forge-pulse"
            style={{ background: isCoding ? 'var(--warning)' : 'var(--accent)' }}
          />
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: isCoding ? 'var(--warning)' : 'var(--accent)' }}
          >
            {isCoding ? 'Executing' : 'Review Execution Plan'}
          </span>
        </div>
        <p className="font-display font-semibold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {session?.task}
        </p>
      </div>

      {/* Analysis */}
      {plan?.analysis && (
        <div
          className="mx-5 mt-4 px-4 py-3 rounded-lg font-body text-sm leading-relaxed shrink-0"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderLeft: '3px solid var(--info)',
            color: 'var(--text-secondary)',
          }}
        >
          {plan.analysis}
        </div>
      )}

      {/* Subtasks */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
          Subtasks — {subtasks.length} file{subtasks.length !== 1 ? 's' : ''}
        </p>
        {subtasks.map((subtask, i) => {
          const execTask = execTasks.find(t => t.file_path === subtask.file_path)
          return (
            <SubtaskCard
              key={i}
              subtask={subtask}
              index={i}
              editing={editingIndex === i}
              onEdit={() => setEditingIndex(i)}
              onSave={() => setEditingIndex(null)}
              onCancel={() => setEditingIndex(null)}
              onChange={val => updateInstruction(i, val)}
              execStatus={execTask?.status}
            />
          )
        })}
      </div>

      {/* Actions — matches mockup: "Approve Plan" + "Request Changes" equal buttons */}
      {!isCoding && (
        <div
          className="px-5 py-4 shrink-0 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--bg-border)' }}
        >
          {error && (
            <p className="font-body text-xs" style={{ color: 'var(--error)' }}>{error}</p>
          )}

          {showReject ? (
            <RejectFlow
              sessionId={session.id}
              onReplanned={onReplanned}
              onCancel={() => setShowReject(false)}
            />
          ) : (
            <>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="md"
                  loading={approving}
                  onClick={handleApprove}
                  className="flex-1"
                >
                  Approve Plan
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowReject(true)}
                >
                  Request Changes
                </Button>
              </div>
              <p className="font-body text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                You can edit individual subtasks after approval.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

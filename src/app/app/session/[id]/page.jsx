'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSessionPolling } from '@/lib/hooks/useSessionPolling'
import StreamingOutput from '@/components/session/StreamingOutput'
import PlanReview from '@/components/session/PlanReview'
import SubtaskRail from '@/components/session/SubtaskRail'
import StatusDot from '@/components/ui/StatusDot'
import ModelSelector from '@/components/ui/app/ModelSelector'
import CodeReview from '@/components/session/CodeReview'
import { apiFetch } from '@/lib/supabase/api'

// ─── DRAG HANDLE ──────────────────────────────────────────────────
function DragHandle({ onDrag }) {
  function handleMouseDown(e) {
    e.preventDefault()
    const startTouch = e.touches?.[0]?.clientY ?? e.clientY

    function onMove(e) {
      const currentY = e.touches?.[0]?.clientY ?? e.clientY
      onDrag(currentY - startTouch)
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className="h-1 cursor-row-resize shrink-0 relative group transition-colors duration-150"
      style={{ background: 'var(--bg-border)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,103,26,0.35)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-border)')}
    >
      <div className="absolute inset-x-0 -top-2 -bottom-2" />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 rounded-full transition-colors duration-150"
        style={{ background: 'var(--bg-border)' }}
      />
    </div>
  )
}

// ─── SESSION HEADER ───────────────────────────────────────────────
// Matches mockup: "● Planning…  Add dark mode toggle…"  [Models ↓]
function SessionHeader({ session, plannerModel, coderModel, onPlannerChange, onCoderChange, showModels, onToggleModels }) {
  const STATUS_LABELS = {
    planning:          'Planning…',
    plan_review:       'Review Required',
    coding:            'Coding…',
    awaiting_approval: 'Review Required',
    done:              'Done',
    failed:            'Failed',
  }
  const label = STATUS_LABELS[session.status] || session.status

  return (
    <div
      className="px-4 py-3 flex items-center justify-between gap-3 shrink-0 relative"
      style={{ borderBottom: '1px solid var(--bg-border)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <StatusDot status={session.status} />
        <span className="font-mono text-xs shrink-0" style={{ color: 'var(--accent)' }}>
          {label}
        </span>
        <span className="font-body text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {session.task}
        </span>
      </div>

      {/* Models button — matches mockup pill style */}
      <button
        onClick={onToggleModels}
        className="shrink-0 font-mono text-xs px-3 py-1 rounded-pill transition-all duration-fast"
        style={{
          border: '1px solid var(--bg-border)',
          color: 'var(--text-muted)',
          background: 'transparent',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--bg-border)'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        Models
      </button>

      {showModels && (
        <div
          className="absolute top-14 right-4 z-50 w-72 rounded-lg p-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <ModelSelector
            plannerModel={plannerModel}
            coderModel={coderModel}
            onPlannerChange={onPlannerChange}
            onCoderChange={onCoderChange}
          />
        </div>
      )}
    </div>
  )
}

// ─── FALLBACK STATES ──────────────────────────────────────────────
function PlanningFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono">Planning…</span>
      </div>
    </div>
  )
}

function CodingFallback({ tasks }) {
  const runningTask = tasks?.find(t => t.status === 'running')
  const doneCount   = tasks?.filter(t => t.status === 'done' || t.status === 'awaiting_approval').length || 0
  const total       = tasks?.length || 0

  if (!runningTask) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No active coding task</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Progress</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{doneCount}/{total}</span>
        </div>
        <div className="h-px rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: total ? `${(doneCount / total) * 100}%` : '0%', background: 'var(--accent)' }}
          />
        </div>
      </div>
      <div
        className="flex flex-col gap-2 p-3 rounded"
        style={{ background: 'var(--bg-surface)', border: '1px solid rgba(232,103,26,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full forge-pulse" style={{ background: 'var(--accent)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>Coding</span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{runningTask.file_path}</span>
        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>{runningTask.instruction}</p>
      </div>
    </div>
  )
}

function FailedState() {
  const router = useRouter()
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)' }}
      >
        <span style={{ color: 'var(--error)', fontSize: '1.1rem' }}>✕</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Session failed</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          The agent encountered an error. Check your OpenRouter key and try again.
        </p>
      </div>
      <button onClick={() => router.push('/app')} className="text-xs" style={{ color: 'var(--accent)' }}>
        Start new task
      </button>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function SessionPage() {
  const { id }                              = useParams()
  const { session, loading, error, refetch } = useSessionPolling(id)

  const [splitPercent,  setSplitPercent]  = useState(60)
  const [activeTask,    setActiveTask]    = useState(null)
  const [plannerModel,  setPlannerModel]  = useState('anthropic/claude-3.5-sonnet')
  const [coderModel,    setCoderModel]    = useState('poolside/laguna-m.1:free')
  const [showModels,    setShowModels]    = useState(false)
  const [planStreamUrl, setPlanStreamUrl] = useState(null)
  const [planStreamStarted, setPlanStreamStarted] = useState(false)
  const [codeStreamUrl,     setCodeStreamUrl]     = useState(null)
  const [streamingTaskId,   setStreamingTaskId]   = useState(null)

  // Load user's saved model preferences
  useEffect(() => {
    apiFetch('/settings')
      .then(data => {
        if (data.settings?.planner_model) setPlannerModel(data.settings.planner_model)
        if (data.settings?.coder_model)   setCoderModel(data.settings.coder_model)
      })
      .catch(() => {})
  }, [])

  function handlePlannerChange(model) {
    setPlannerModel(model)
    apiFetch('/settings', { method: 'POST', body: JSON.stringify({ planner_model: model }) }).catch(() => {})
  }
  function handleCoderChange(model) {
    setCoderModel(model)
    apiFetch('/settings', { method: 'POST', body: JSON.stringify({ coder_model: model }) }).catch(() => {})
  }

  // Auto-select first awaiting_approval task
  useEffect(() => {
    if (!session?.tasks) return
    const firstReady = session.tasks.find(t => t.status === 'awaiting_approval')
    if (firstReady && !activeTask) setActiveTask(firstReady)
  }, [session?.tasks, activeTask])

  // Planning stream
  useEffect(() => {
    if (session?.status === 'planning' && !planStreamStarted) {
      setPlanStreamStarted(true)
      setPlanStreamUrl(`/agent/session/${id}/stream-plan`)
    }
    if (session?.status !== 'planning') {
      setPlanStreamStarted(false)
      setPlanStreamUrl(null)
    }
  }, [session?.status, id, planStreamStarted])

  // Coding stream
  useEffect(() => {
    if (!session?.tasks) return
    const runningTask = session.tasks.find(t => t.status === 'running')
    if (runningTask && runningTask.id !== streamingTaskId) {
      setStreamingTaskId(runningTask.id)
      setCodeStreamUrl(`/agent/task/${runningTask.id}/stream-code`)
    }
    if (!runningTask && codeStreamUrl) {
      setCodeStreamUrl(null)
      setStreamingTaskId(null)
    }
  }, [session?.tasks, streamingTaskId, codeStreamUrl])

  function handleDrag(deltaY) {
    setSplitPercent(prev => Math.min(80, Math.max(20, prev + (deltaY / window.innerHeight) * 100)))
  }

  // ── Loading / error states ────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono">Loading session…</span>
      </div>
    </div>
  )

  if (error || !session) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <p className="text-sm font-mono" style={{ color: 'var(--error)' }}>{error || 'Session not found'}</p>
    </div>
  )

  const isPlanReview        = session.status === 'plan_review'
  const isPlanning          = session.status === 'planning'
  const isCoding            = session.status === 'coding'
  const isAwaitingApproval  = session.status === 'awaiting_approval'
  const isDone              = session.status === 'done'
  const isFailed            = session.status === 'failed'
  const tasks               = session.tasks || []

  return (
    <div
      className="flex flex-col relative"
      style={{ height: '100dvh', background: 'var(--bg-base)' }}
      onClick={() => showModels && setShowModels(false)}
    >
      <SessionHeader
        session={session}
        plannerModel={plannerModel}
        coderModel={coderModel}
        onPlannerChange={handlePlannerChange}
        onCoderChange={handleCoderChange}
        showModels={showModels}
        onToggleModels={() => setShowModels(p => !p)}
      />

      {/* ── Plan review — full height ─────────────────────────── */}
      {isPlanReview && (
        <div className="flex-1 overflow-hidden">
          <PlanReview
            session={session}
            onApproved={() => refetch()}
            onReplanned={() => refetch()}
          />
        </div>
      )}

      {/* ── Split panel ───────────────────────────────────────── */}
      {(isPlanning || isCoding || isAwaitingApproval || isDone || isFailed) && (
        <div className="flex-1 flex flex-col min-h-0">

          {/* Top panel */}
          <div className="overflow-hidden" style={{ height: `${splitPercent}%` }}>

            {isPlanning && (
              planStreamUrl
                ? <StreamingOutput streamUrl={planStreamUrl} title="Execution Plan" language="markdown" />
                : <PlanningFallback />
            )}

            {isCoding && (
              codeStreamUrl
                ? <StreamingOutput streamUrl={codeStreamUrl} title="Generating code…" language="typescript" />
                : <CodingFallback tasks={tasks} />
            )}

            {/* FIX: pass full session object — CodeReview derives tasks internally */}
            {(isAwaitingApproval || isDone) && (
              <CodeReview
                session={session}
                onApproved={() => { setActiveTask(null); refetch() }}
                onPushComplete={() => refetch()}
                onRefetch={() => refetch()}
              />
            )}

            {isFailed && <FailedState />}
          </div>

          {/* Drag handle */}
          {(isCoding || isAwaitingApproval || isDone || isFailed) && (
            <DragHandle onDrag={handleDrag} />
          )}

          {/* Bottom panel — subtask rail */}
          {(isCoding || isAwaitingApproval || isDone) && (
            <div
              className="overflow-hidden"
              style={{ height: `${100 - splitPercent}%`, borderTop: '1px solid var(--bg-border)' }}
            >
              <SubtaskRail
                tasks={tasks.map(t => ({
                  ...t,
                  code_drafts: session.code_drafts?.filter(d => d.task_id === t.id) || [],
                }))}
                activeDraftId={activeTask?.code_drafts?.[0]?.id}
                onSelectTask={setActiveTask}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

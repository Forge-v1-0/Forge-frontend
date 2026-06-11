'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/supabase/api'
import RepoSelector from '@/components/ui/app/RepoSelector'
import ModelSelector from '@/components/ui/app/ModelSelector'

const DEFAULT_PLANNER = 'anthropic/claude-3.5-sonnet'
const DEFAULT_CODER   = 'poolside/laguna-m.1:free'

export default function NewTaskPage() {
  const router = useRouter()

  const [selectedRepo,  setSelectedRepo]  = useState(null)
  const [plannerModel,  setPlannerModel]  = useState(DEFAULT_PLANNER)
  const [coderModel,    setCoderModel]    = useState(DEFAULT_CODER)
  const [task,          setTask]          = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState(null)

  // Poll repo indexing status
  useEffect(() => {
    if (!selectedRepo || selectedRepo.index_status === 'indexed') return
    if (selectedRepo.index_status === 'failed') return
    const interval = setInterval(async () => {
      try {
        const data    = await apiFetch('/repos')
        const updated = data.repos.find(r => r.id === selectedRepo.id)
        if (updated) {
          setSelectedRepo(updated)
          if (updated.index_status === 'indexed' || updated.index_status === 'failed') {
            clearInterval(interval)
          }
        }
      } catch { clearInterval(interval) }
    }, 4000)
    return () => clearInterval(interval)
  }, [selectedRepo?.id, selectedRepo?.index_status])

  const indexing      = selectedRepo?.index_status === 'indexing' || selectedRepo?.index_status === 'pending'
  const indexFailed   = selectedRepo?.index_status === 'failed'
  const taskDisabled  = !selectedRepo || indexing || indexFailed
  const disabledReason = !selectedRepo
    ? 'Select a repository to continue'
    : indexFailed
    ? 'Indexing failed — please re-add the repository.'
    : indexing
    ? 'Indexing repository… this takes a minute'
    : null

  async function handleSubmit() {
    if (!selectedRepo || !task.trim() || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const data = await apiFetch('/agent/start', {
        method: 'POST',
        body: JSON.stringify({
          repo_id:      selectedRepo.id,
          task:         task.trim(),
          // FIX #1: backend expects camelCase, not snake_case
          plannerModel: plannerModel,
          coderModel:   coderModel,
        }),
      })
      router.push(`/app/session/${data.session_id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !taskDisabled) {
      handleSubmit()
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      {/* Page header */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid var(--bg-border)' }}
      >
        <h1 className="font-display font-semibold" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
          New Task
        </h1>
        <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Describe what you want Forge to build or fix
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-6 flex flex-col gap-5">

        {/* Repo selector */}
        <RepoSelector value={selectedRepo} onChange={setSelectedRepo} />

        {/* Model selectors — side by side matching mockup */}
        <ModelSelector
          plannerModel={plannerModel}
          coderModel={coderModel}
          onPlannerChange={setPlannerModel}
          onCoderChange={setCoderModel}
        />

        {/* Disabled reason */}
        {disabledReason && (
          <p className="font-body text-xs italic" style={{ color: 'var(--text-muted)' }}>
            {disabledReason}
          </p>
        )}

        {/* Task textarea — Run Forge button sits inside, bottom-right */}
        <div
          className="relative rounded-xl"
          style={{
            border: `1px solid ${taskDisabled ? 'var(--bg-border)' : 'var(--accent)'}`,
            background: 'var(--bg-surface)',
            transition: 'border-color 200ms ease',
            opacity: taskDisabled ? 0.6 : 1,
          }}
        >
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={taskDisabled}
            rows={6}
            placeholder={
              taskDisabled
                ? ''
                : 'Describe what you want to build or fix…\n\n• Fix database user authentication bug\n• Add responsive design to profile page'
            }
            className="w-full resize-none font-body text-sm leading-relaxed"
            style={{
              background:    'transparent',
              border:        'none',
              outline:       'none',
              padding:       '16px',
              paddingBottom: '56px',
              color:         'var(--text-primary)',
            }}
          />

          {/* Run Forge button — bottom-right inside the box */}
          <div className="absolute bottom-3 right-3">
            <button
              onClick={handleSubmit}
              disabled={taskDisabled || !task.trim() || submitting}
              className="font-body font-medium text-sm px-5 py-2 rounded-lg transition-all duration-fast"
              style={{
                background: (taskDisabled || !task.trim() || submitting)
                  ? 'var(--bg-elevated)'
                  : 'var(--accent)',
                color: (taskDisabled || !task.trim() || submitting)
                  ? 'var(--text-muted)'
                  : '#fff',
                cursor: (taskDisabled || !task.trim() || submitting) ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {submitting ? 'Starting…' : 'Run Forge'}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        {!taskDisabled && task.trim() && (
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>
            ⌘↵ to run
          </p>
        )}

        {error && (
          <p className="font-body text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}

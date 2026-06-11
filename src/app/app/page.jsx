'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/supabase/api'

import RepoSelector from '@/components/ui/app/RepoSelector'
import ModelSelector from '@/components/ui/app/ModelSelector'
import TaskInput from '@/components/ui/app/TaskInput'

const DEFAULT_PLANNER = 'openai/gpt-oss-20b:free'
const DEFAULT_CODER = 'openai/gpt-oss-20b:free'

export default function NewTaskPage() {
  const router = useRouter()

  const [selectedRepo, setSelectedRepo] = useState(null)
  const [plannerModel, setPlannerModel] = useState(DEFAULT_PLANNER)
  const [coderModel, setCoderModel] = useState(DEFAULT_CODER)
  const [task, setTask] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!selectedRepo || selectedRepo.index_status === 'indexed') return
    if (selectedRepo.index_status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/repos`)
        const updated = data.repos.find(r => r.id === selectedRepo.id)
        if (updated) {
          setSelectedRepo(updated)
          if (updated.index_status === 'indexed' || updated.index_status === 'failed') {
            clearInterval(interval)
          }
        }
      } catch {
        clearInterval(interval)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [selectedRepo?.id, selectedRepo?.index_status])

  const indexing = selectedRepo?.index_status === 'indexing' || selectedRepo?.index_status === 'pending'
  const indexFailed = selectedRepo?.index_status === 'failed'

  const taskDisabled = !selectedRepo || indexing || indexFailed
  const disabledReason = !selectedRepo
    ? 'Select a repository to continue'
    : indexFailed
    ? 'Indexing failed. Please re-add the repository.'
    : indexing
    ? `Indexing repository… this takes a minute`
    : null

  async function handleSubmit() {
    if (!selectedRepo || !task.trim()) return
    setError(null)
    setSubmitting(true)

    try {
      const data = await apiFetch('/agent/start', {
        method: 'POST',
        body: JSON.stringify({
          repo_id: selectedRepo.id,
          task: task.trim(),
          plannerModel,  // ← camelCase, was planner_model
          coderModel,    // ← camelCase, was coder_model
        }),
      })

      router.push(`/app/session/${data.session_id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-base font-semibold text-secondary">New Task</h1>
        <p className="text-xs text-muted mt-0.5">
          Describe what you want Forge to build or fix
        </p>
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-2xl w-full">
        <RepoSelector
          value={selectedRepo}
          onChange={setSelectedRepo}
        />

        <ModelSelector
          plannerModel={plannerModel}
          coderModel={coderModel}
          onPlannerChange={setPlannerModel}
          onCoderChange={setCoderModel}
        />

        <TaskInput
          value={task}
          onChange={setTask}
          onSubmit={handleSubmit}
          loading={submitting}
          disabled={taskDisabled}
          disabledReason={disabledReason}
        />

        {error && (
          <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
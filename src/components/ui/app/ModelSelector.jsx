'use client'

import { useState } from 'react'

const SUGGESTED_MODELS = {
  planner: [
    { id: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B (Free)' },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron Super 120B (Free)' },
    { id: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 Next 80B (Free)' },
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B (Free)' },
    { id: 'moonshotai/kimi-k2.6:free', label: 'Kimi K2.6 (Free)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)' },
    { id: 'z-ai/glm-4.5-air:free', label: 'GLM-4.5 Air (Free)' },
    { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron Nano Omni 30B Reasoning (Free)' },
    { id: 'liquid/lfm-2.5-1.2b-thinking:free', label: 'LFM 2.5 1.2B Thinking (Free)' },
  ],
  coder: [
    { id: 'qwen/qwen3-coder:free', label: 'Qwen3 Coder (Free)' },
    { id: 'poolside/laguna-m.1:free', label: 'Laguna M.1 (Free)' },
    { id: 'poolside/laguna-xs.2:free', label: 'Laguna XS.2 (Free)' },
    { id: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B (Free)' },
    { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', label: 'Dolphin Mistral 24B Venice (Free)' },
    { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (Free)' },
    { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B (Free)' },
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'Nemotron Nano 30B (Free)' },
    { id: 'nvidia/nemotron-nano-12b-v2-vl:free', label: 'Nemotron Nano 12B VL (Free)' },
    { id: 'nvidia/nemotron-nano-9b-v2:free', label: 'Nemotron Nano 9B (Free)' },
    { id: 'liquid/lfm-2.5-1.2b-instruct:free', label: 'LFM 2.5 1.2B Instruct (Free)' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)' },
  ],
}

function ModelPicker({ label, value, onChange, suggestions }) {
  const [custom, setCustom] = useState(false)
  const isCustom = !suggestions.find(s => s.id === value)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted uppercase tracking-wider">
        {label}
      </label>

      {!custom && !isCustom ? (
        <select
          value={value}
          onChange={e => {
            if (e.target.value === '__custom__') {
              setCustom(true)
            } else {
              onChange(e.target.value)
            }
          }}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-secondary transition-all duration-150 focus:outline-none focus:border-accent focus:shadow-glow-sm"
        >
          {suggestions.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
          <option value="__custom__">Custom model…</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="e.g. mistralai/mistral-7b-instruct"
            className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm text-secondary font-mono placeholder-muted transition-all duration-150 focus:outline-none focus:border-accent focus:shadow-glow-sm"
          />
          <button
            onClick={() => {
              setCustom(false)
              onChange(suggestions[0].id)
            }}
            className="px-2 py-2 text-xs text-muted hover:text-secondary border border-border rounded transition-all duration-150"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default function ModelSelector({ plannerModel, coderModel, onPlannerChange, onCoderChange }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-xs font-medium text-muted uppercase tracking-wider">
        Models
      </label>
      <div className="p-3 bg-surface border border-border rounded flex flex-col gap-4">
        <ModelPicker
          label="Planner"
          value={plannerModel}
          onChange={onPlannerChange}
          suggestions={SUGGESTED_MODELS.planner}
        />
        <ModelPicker
          label="Coder"
          value={coderModel}
          onChange={onCoderChange}
          suggestions={SUGGESTED_MODELS.coder}
        />
      </div>
    </div>
  )
}
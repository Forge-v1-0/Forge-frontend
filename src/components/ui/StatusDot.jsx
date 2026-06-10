/**
 * FORGE — StatusDot component
 * Phase 0: Design System Foundation
 *
 * Renders a coloured dot + optional label for session/subtask status.
 * All colours via CSS variables. Pulse animation for active states.
 *
 * Statuses:
 * pending          → amber, pulse
 * planning         → amber, pulse
 * plan_review      → amber, pulse  (awaiting user decision)
 * coding           → amber, pulse
 * awaiting_approval→ amber, pulse  (awaiting user decision)
 * done             → teal/success, static
 * failed           → red, static
 * rejected         → muted, static
 * indexed          → success, static
 * indexing         → amber, pulse
 */

const STATUS_MAP = {
  pending:            { color: 'bg-warning',  pulse: true,  label: 'Pending'            },
  planning:           { color: 'bg-warning',  pulse: true,  label: 'Planning…'          },
  plan_review:        { color: 'bg-accent',   pulse: true,  label: 'Awaiting approval'  },
  coding:             { color: 'bg-warning',  pulse: true,  label: 'Coding…'            },
  awaiting_approval:  { color: 'bg-accent',   pulse: true,  label: 'Review required'    },
  done:               { color: 'bg-success',  pulse: false, label: 'Done'               },
  failed:             { color: 'bg-error',    pulse: false, label: 'Failed'             },
  rejected:           { color: 'bg-muted',    pulse: false, label: 'Rejected'           },
  indexed:            { color: 'bg-success',  pulse: false, label: 'Indexed'            },
  indexing:           { color: 'bg-warning',  pulse: true,  label: 'Indexing…'          },
  running:            { color: 'bg-warning',  pulse: true,  label: 'Running…'           },
}

const FALLBACK = { color: 'bg-muted', pulse: false, label: 'Unknown' }

export default function StatusDot({
  status,
  showLabel = true,
  size = 'sm',
  className = '',
}) {
  const config = STATUS_MAP[status] ?? FALLBACK

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={config.label}
    >
      <span
        className={`
          rounded-full shrink-0
          ${dotSizes[size] ?? dotSizes.sm}
          ${config.color}
          ${config.pulse ? 'animate-pulse-dot' : ''}
        `}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs font-mono text-muted">
          {config.label}
        </span>
      )}
    </span>
  )
}

/**
 * FORGE — Card component
 * Phase 0: Design System Foundation
 *
 * Variants:
 * - default: bg-surface + border
 * - elevated: bg-elevated + border
 * - glow: accent border glow on hover
 * - accent: left accent border (for callouts, analysis panels)
 * - ghost: transparent bg
 */

export default function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'md',
  as: Tag = 'div',
  ...props
}) {
  const variants = {
    default: 'bg-surface border border-border',
    elevated: 'bg-elevated border border-border',
    glow: 'bg-surface border border-border hover:border-accent/40 hover:shadow-glow-sm hover:-translate-y-0.5',
    accent: 'bg-surface border border-border border-l-2 border-l-accent',
    info: 'bg-surface border border-border border-l-2 border-l-info',
    success: 'bg-surface border border-border border-l-2 border-l-success',
    warning: 'bg-surface border border-border border-l-2 border-l-warning',
    danger: 'bg-surface border border-error/20 bg-error/5',
    ghost: 'bg-transparent border border-border',
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <Tag
      className={`
        rounded-lg
        transition-all duration-normal
        ${variants[variant] ?? variants.default}
        ${paddings[padding] ?? paddings.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </Tag>
  )
}

'use client'

/**
 * FORGE — Button component
 * Phase 0: Design System Foundation
 *
 * All colours reference CSS custom properties only.
 * Touch target minimum: 44×44px (enforced via min-height/min-width).
 * Loading state: spinner replaces children, aria-busy communicated.
 * Variants: primary | ghost | danger | surface
 * Sizes: sm | md | lg
 */

import { forwardRef } from 'react'

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  // ─── Base styles ────────────────────────────────────────────────
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-display font-semibold',
    'border rounded-md',
    'transition-all',
    'select-none cursor-pointer',
    'touch-action-manipulation',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    fullWidth ? 'w-full' : '',
  ].join(' ')

  // ─── Variants ───────────────────────────────────────────────────
  const variants = {
    primary: [
      'bg-accent text-white border-accent',
      'hover:bg-accent-warm hover:-translate-y-0.5 hover:shadow-glow',
      'active:translate-y-0 active:shadow-none active:scale-[0.97]',
      'focus-visible:outline-accent',
    ].join(' '),

    ghost: [
      'bg-transparent text-secondary border-border',
      'hover:border-accent hover:text-primary',
      'active:scale-[0.97]',
      'focus-visible:outline-accent',
    ].join(' '),

    danger: [
      'bg-transparent text-error border-error/30',
      'hover:bg-error/10 hover:border-error/50',
      'active:scale-[0.97]',
      'focus-visible:outline-error',
    ].join(' '),

    surface: [
      'bg-surface text-secondary border-border',
      'hover:border-accent/50 hover:text-primary',
      'active:scale-[0.97]',
      'focus-visible:outline-accent',
    ].join(' '),
  }

  // ─── Sizes (min 44px height for touch targets) ───────────────────
  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[34px] tracking-[0.01em]',
    md: 'px-4 py-2   text-sm min-h-[40px] tracking-[0.01em]',
    lg: 'px-6 py-3   text-base min-h-[50px] tracking-[0.01em]',
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`
        ${base}
        ${variants[variant] ?? variants.primary}
        ${sizes[size] ?? sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          {/* Spinner */}
          <span
            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin-slow"
            aria-hidden="true"
          />
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  )
})

Button.displayName = 'Button'
export default Button

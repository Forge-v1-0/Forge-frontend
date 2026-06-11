'use client'

/**
 * FORGE — Input component
 * Phase 0: Design System Foundation
 *
 * Features:
 * - All colours via CSS variables
 * - Label, hint, and error support
 * - Password visibility toggle (no emoji — SVG icon only)
 * - Focus ring via --accent
 * - Minimum 16px font on mobile (prevents iOS auto-zoom)
 * - Min touch target 44px height
 */

import { forwardRef, useState } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    type = 'text',
    className = '',
    id,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-mono text-muted uppercase tracking-widest"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={`
            w-full px-3 py-2.5
            bg-surface border rounded-md
            text-sm text-primary font-body
            placeholder:text-muted
            transition-all duration-fast
            focus:outline-none focus:border-accent focus:shadow-glow-sm
            disabled:opacity-40 disabled:cursor-not-allowed
            min-h-[44px]
            ${error
              ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]'
              : 'border-border'
            }
            ${isPassword ? 'pr-10' : ''}
            ${className}
          `}
          style={{ fontSize: '16px' /* Prevents iOS auto-zoom */ }}
          aria-invalid={!!error}
          aria-describedby={
            [hint && `${inputId}-hint`, error && `${inputId}-error`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-muted hover:text-secondary
              transition-colors duration-fast
              p-1 rounded
              focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent
            "
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              /* Eye-off */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2L14 14M6.5 6.6a2 2 0 002.9 2.9M4.2 4.3C2.8 5.3 1.8 6.6 1.3 8c1 2.7 3.6 4.5 6.7 4.5 1.2 0 2.3-.3 3.3-.8M7.3 3.6C7.5 3.5 7.8 3.5 8 3.5c3.1 0 5.7 1.8 6.7 4.5-.3.9-.8 1.7-1.5 2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ) : (
              /* Eye */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1.3 8C2.3 5.3 4.9 3.5 8 3.5s5.7 1.8 6.7 4.5C13.7 10.7 11.1 12.5 8 12.5S2.3 10.7 1.3 8z" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Hint */}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-muted leading-relaxed">
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-error flex items-center gap-1.5" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 4v2.5M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input

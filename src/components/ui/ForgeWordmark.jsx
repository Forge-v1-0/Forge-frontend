/**
 * FORGE — ForgeWordmark component
 * Phase 0: Design System Foundation
 *
 * FIXED (mobile): 2xl and xl sizes now use clamp() to scale proportionally
 * to viewport width on small screens. Prevents horizontal overflow.
 *
 * The FORGE wordmark. O and E rendered in --accent.
 * Monospace font. Underline gradient treatment.
 */

export default function ForgeWordmark({
  size = 'md',
  underline = false,
  className = '',
}) {
  // Tailwind classes for small sizes (mobile-safe)
  const sizeClasses = {
    xs:  'text-base  tracking-[0.15em]',
    sm:  'text-xl    tracking-[0.18em]',
    md:  'text-2xl   tracking-[0.2em]',
    lg:  'text-4xl   tracking-[0.22em]',
  }

  // Responsive clamp for large sizes (prevents mobile overflow)
  const sizeStyles = {
    // Clamp: min 2.8rem (mobile), ideal 15vw (tablet), max 6rem (desktop)
    xl:  { fontSize: 'clamp(2.4rem, 12vw, 6rem)',   letterSpacing: '0.22em' },
    // Clamp: min 3.2rem (mobile), ideal 18vw (tablet), max 8rem (desktop)
    '2xl': { fontSize: 'clamp(3.2rem, 16vw, 8rem)', letterSpacing: '0.18em' },
  }

  const isResponsiveSize = size === 'xl' || size === '2xl'
  const styleOverrides = isResponsiveSize ? sizeStyles[size] : {}

  return (
    <span
      className={`
        relative inline-block select-none
        font-mono font-bold
        ${isResponsiveSize ? '' : (sizeClasses[size] ?? sizeClasses.md)}
        ${className}
      `}
      style={styleOverrides}
      aria-label="FORGE"
    >
      <span style={{ color: 'var(--text-primary)' }}>F</span>
      <span style={{ color: 'var(--accent)' }}>O</span>
      <span style={{ color: 'var(--text-primary)' }}>R</span>
      <span style={{ color: 'var(--text-primary)' }}>G</span>
      <span style={{ color: 'var(--accent)' }}>E</span>

      {underline && (
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 w-full h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          }}
        />
      )}
    </span>
  )
}

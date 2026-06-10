/**
 * FORGE — ForgeWordmark component
 * Phase 0: Design System Foundation
 *
 * The FORGE wordmark. O and E rendered in --accent.
 * Monospace font. Underline gradient treatment.
 * Used in Navbar, Sidebar, Login, Signup, Landing hero.
 */

export default function ForgeWordmark({
  size = 'md',
  underline = false,
  className = '',
}) {
  const sizes = {
    xs:  'text-base  tracking-[0.15em]',
    sm:  'text-xl    tracking-[0.18em]',
    md:  'text-2xl   tracking-[0.2em]',
    lg:  'text-4xl   tracking-[0.22em]',
    xl:  'text-6xl   tracking-[0.25em]',
    '2xl': 'text-8xl tracking-[0.28em]',
  }

  return (
    <span
      className={`
        relative inline-block select-none
        font-mono font-bold
        ${sizes[size] ?? sizes.md}
        ${className}
      `}
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

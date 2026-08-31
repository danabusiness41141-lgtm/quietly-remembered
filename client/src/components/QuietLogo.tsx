/**
 * QuietLogo — a small paper-lantern mark for Quietly Remembered.
 *
 * The shape is a rounded-rectangle lantern with a soft warm glow
 * and a delicate stem + star accent beneath.
 *
 * `size` controls the height; width scales proportionally (~0.76 ratio).
 * Pass `className` for dark-mode overrides (the creators page swaps CSS vars).
 */
export default function QuietLogo({ size = 38, className }: { size?: number; className?: string }) {
  const w = Math.round(size * 0.76);
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 29 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* Soft glow halo behind the lantern */}
      <ellipse cx="14.5" cy="17" rx="11" ry="11.5" fill="url(#qr-glow)" opacity=".45" />

      {/* Lantern body — slightly tapered rounded rect */}
      <rect x="4" y="5" width="21" height="23" rx="8" ry="9" fill="var(--persimmon, #d86e5a)" />
      {/* Inner light highlight */}
      <ellipse cx="14.5" cy="16" rx="6.5" ry="7" fill="#fff5e6" opacity=".82" />
      {/* Tiny warm dot at the very center */}
      <circle cx="14.5" cy="16" r="2.2" fill="var(--persimmon, #d86e5a)" opacity=".55" />

      {/* Stem — thin vertical line descending from lantern */}
      <line x1="14.5" y1="28" x2="14.5" y2="34" stroke="var(--ink, #352b2a)" strokeWidth="1" strokeLinecap="round" />

      {/* Small star accent at the bottom */}
      <text x="14.5" y="37.5" textAnchor="middle" fontSize="5.5" fill="var(--ink, #352b2a)" fontFamily="serif">✦</text>

      <defs>
        <radialGradient id="qr-glow" cx="50%" cy="44%" r="50%">
          <stop offset="0%" stopColor="var(--persimmon, #d86e5a)" stopOpacity=".6" />
          <stop offset="100%" stopColor="var(--persimmon, #d86e5a)" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

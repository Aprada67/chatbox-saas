/**
 * Skeleton loading components — used to replace spinners with content-shaped
 * placeholders that mirror the real UI layout so the page doesn't jump on load.
 *
 * All variants share the same animate-pulse shimmer and use the app's CSS
 * variables for colors so they respect dark / light themes automatically.
 */

// ── Base shimmer block ────────────────────────────────────────────────────────
const Skeleton = ({ width = '100%', height = '1rem', className = '', style = {} }) => (
  <div
    className={`animate-pulse rounded ${className}`}
    style={{
      width,
      height,
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      ...style,
    }}
  />
);

// ── Text lines — stacked rows that mimic a paragraph or label ─────────────────
export const SkeletonText = ({ lines = 2, className = '' }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="0.75rem"
        // Last line is shorter to look like real text wrapping
        width={i === lines - 1 && lines > 1 ? '65%' : '100%'}
      />
    ))}
  </div>
);

// ── Stat / KPI card — icon square + title line + large value + subtitle ────────
export const SkeletonStat = ({ className = '' }) => (
  <div
    className={`rounded p-4 md:p-5 border flex flex-col gap-3 ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    {/* Top row: title + icon */}
    <div className="flex items-center justify-between">
      <Skeleton width="45%" height="0.65rem" />
      <Skeleton width="2rem" height="2rem" className="rounded" style={{ borderRadius: '0.5rem' }} />
    </div>
    {/* Value */}
    <Skeleton width="35%" height="1.75rem" />
    {/* Subtitle */}
    <Skeleton width="55%" height="0.65rem" />
  </div>
);

// ── Card block — a generic rounded card placeholder ───────────────────────────
export const SkeletonCard = ({ height = '8rem', className = '' }) => (
  <div
    className={`rounded border overflow-hidden ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    <Skeleton
      height={height}
      style={{
        borderRadius: 0,
        border: 'none',
        background: 'var(--bg-tertiary)',
      }}
    />
  </div>
);

// ── Table rows — mimic a list of data rows with a leading cell and trailing cell
export const SkeletonTable = ({ rows = 4, className = '' }) => (
  <div className={`flex flex-col divide-y ${className}`} style={{ borderColor: 'var(--border)' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 md:px-5 py-3.5 flex items-center justify-between gap-4">
        {/* Left: two stacked lines */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Skeleton width="50%" height="0.75rem" />
          <Skeleton width="35%" height="0.65rem" />
        </div>
        {/* Right: badge-sized block */}
        <Skeleton width="4.5rem" height="1.4rem" className="rounded-full shrink-0" style={{ borderRadius: '9999px' }} />
      </div>
    ))}
  </div>
);

// ── Avatar — circular placeholder for user initials or icons ──────────────────
export const SkeletonAvatar = ({ size = '2.25rem', className = '' }) => (
  <Skeleton
    width={size}
    height={size}
    className={`rounded shrink-0 ${className}`}
    style={{ borderRadius: '0.75rem', minWidth: size, minHeight: size }}
  />
);

// ── Chatbot card row — icon + two text lines + badge + action buttons ─────────
export const SkeletonChatbotCard = ({ className = '' }) => (
  <div
    className={`rounded border p-4 md:p-5 ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    {/* Top row */}
    <div className="flex items-center gap-3 mb-3">
      <SkeletonAvatar />
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <Skeleton width="45%" height="0.75rem" />
        <Skeleton width="30%" height="0.65rem" />
      </div>
      <Skeleton width="4rem" height="1.4rem" className="rounded-full" style={{ borderRadius: '9999px' }} />
    </div>
    {/* Bottom actions row */}
    <div
      className="flex items-center gap-2 pt-3 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <Skeleton width="5rem" height="1.8rem" className="rounded" style={{ borderRadius: '0.75rem' }} />
      <Skeleton width="5rem" height="1.8rem" className="rounded" style={{ borderRadius: '0.75rem' }} />
      <Skeleton width="4rem" height="1.8rem" className="rounded ml-auto" style={{ borderRadius: '0.75rem' }} />
    </div>
  </div>
);

// ── Appointment row — date block + service info + status badge ────────────────
export const SkeletonAppointmentRow = ({ className = '' }) => (
  <div
    className={`rounded border p-4 flex items-center gap-3 ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    {/* Compact date square */}
    <Skeleton width="3rem" height="3.5rem" className="rounded shrink-0" style={{ borderRadius: '0.75rem' }} />
    {/* Service text */}
    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
      <Skeleton width="55%" height="0.75rem" />
      <Skeleton width="38%" height="0.65rem" />
    </div>
    {/* Status badge */}
    <Skeleton width="4.5rem" height="1.4rem" className="rounded-full shrink-0" style={{ borderRadius: '9999px' }} />
  </div>
);

// ── Plan / Billing card — name + price + feature list ────────────────────────
export const SkeletonPlanCard = ({ features = 4, className = '' }) => (
  <div
    className={`rounded border p-5 ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    {/* Plan name */}
    <Skeleton width="30%" height="0.65rem" className="mb-2" />
    {/* Price */}
    <Skeleton width="40%" height="1.75rem" className="mb-4" />
    {/* Feature list */}
    <div className="flex flex-col gap-2 mb-5">
      {Array.from({ length: features }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton width="1rem" height="1rem" className="rounded-full shrink-0" style={{ borderRadius: '9999px' }} />
          <Skeleton width={`${55 + (i % 3) * 12}%`} height="0.65rem" />
        </div>
      ))}
    </div>
    {/* Button */}
    <Skeleton width="5rem" height="2rem" className="rounded" style={{ borderRadius: '0.75rem' }} />
  </div>
);

// ── Admin user row — avatar + name/email + plan badge ────────────────────────
export const SkeletonUserRow = ({ className = '' }) => (
  <div
    className={`rounded border p-4 flex items-center gap-3 ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    <SkeletonAvatar />
    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
      <Skeleton width="40%" height="0.75rem" />
      <Skeleton width="55%" height="0.65rem" />
    </div>
    <Skeleton width="3.5rem" height="1.4rem" className="rounded-full shrink-0" style={{ borderRadius: '9999px' }} />
  </div>
);

// ── Admin chatbot row — same layout as AdminChatbots list items ───────────────
export const SkeletonAdminChatbotRow = ({ className = '' }) => (
  <div
    className={`rounded border p-4 ${className}`}
    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <SkeletonAvatar size="2.25rem" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <Skeleton width="8rem" height="0.75rem" />
          <Skeleton width="5rem" height="0.65rem" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton width="3.5rem" height="1.4rem" className="rounded-full" style={{ borderRadius: '9999px' }} />
        <Skeleton width="3.5rem" height="1.8rem" className="rounded" style={{ borderRadius: '0.75rem' }} />
      </div>
    </div>
  </div>
);

// ── Chart area — bar-chart-shaped placeholder ────────────────────────────────
export const SkeletonChart = ({ className = '' }) => (
  <div className={`flex items-end gap-1 h-40 px-1 ${className}`}>
    {[60, 30, 75, 45, 90, 20, 55, 40, 85, 35, 65, 50, 70, 25, 80, 45, 55, 30, 90, 60, 40, 75, 50, 35, 65, 80, 20, 55, 70, 45].map((h, i) => (
      <div
        key={i}
        className="flex-1 rounded-t-sm animate-pulse"
        style={{
          height: `${h}%`,
          background: 'var(--bg-tertiary)',
          minHeight: 4,
        }}
      />
    ))}
  </div>
);

export default Skeleton;

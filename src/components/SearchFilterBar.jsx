// SearchFilterBar is no longer rendered as a standalone component (filters live in BoardHeader).
// This file exports the shared Avatar component used across the app.

export function Avatar({ member, size = 22, showTooltip = false }) {
  const initials = member?.initials ||
    (member?.name ? member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?')

  const inner = (
    <span
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 border-2 border-[rgba(255,255,255,0.1)]"
      style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: member?.color ?? '#555', color: '#fff' }}
    >
      {initials}
    </span>
  )
  if (!showTooltip) return inner
  return (
    <span className="relative group/avatar flex-shrink-0">
      {inner}
      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50
                       px-2 py-1 bg-[#1F2538] border border-[rgba(255,255,255,0.1)] text-text-primary text-[11px] font-medium rounded-md whitespace-nowrap
                       opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-150">
        {member?.name}
      </span>
    </span>
  )
}

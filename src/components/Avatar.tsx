import clsx from 'clsx'

type AvatarProps = {
  initials: string
  color: string
  name?: string
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  online?: boolean
}

const sizes = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
}

export default function Avatar({
  initials,
  color,
  name,
  className,
  size = 'sm',
  online,
}: AvatarProps) {
  return (
    <span className={clsx('relative shrink-0', className)} title={name}>
      <span
        className={clsx(
          'flex select-none items-center justify-center rounded-full font-bold text-white ring-2 ring-surface',
          sizes[size],
        )}
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      {online && (
        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-500" />
      )}
    </span>
  )
}

export function AvatarStack({
  people,
  max = 4,
  size = 'xs',
}: {
  people: { id: string; name: string; initials: string; color: string }[]
  max?: number
  size?: AvatarProps['size']
}) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <Avatar key={p.id} initials={p.initials} color={p.color} name={p.name} size={size} />
      ))}
      {rest > 0 && (
        <span
          className={clsx(
            'flex items-center justify-center rounded-full bg-ink-200 font-bold text-ink-600 ring-2 ring-surface',
            sizes[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  )
}
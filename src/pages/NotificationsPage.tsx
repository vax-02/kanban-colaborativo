import { useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  UserPlus,
  Users,
} from 'lucide-react'
import Avatar from '../components/Avatar'
import { notices } from '../data/mock'

const typeIcon = {
  mention: UserPlus,
  comment: MessageSquare,
  system: Clock,
  assign: Check,
  invite: Users,
}

export default function NotificationsPage() {
  const [readIds, setReadIds] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'todas' | 'noLeidas'>('todas')

  const read = (id: string) => {
    const n = notices.find((x) => x.id === id)
    if (n && (n.read || readIds[id])) return
    setReadIds((prev) => ({ ...prev, [id]: true }))
  }

  const markAll = () =>
    setReadIds(Object.fromEntries(notices.map((n) => [n.id, true])))

  const unreadCount = notices.filter((n) => !n.read && !readIds[n.id]).length

  const list = notices.filter((n) => {
    if (filter === 'todas') return true
    return !n.read && !readIds[n.id]
  })

  return (
    <div className="mx-auto max-w-3xl pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo pendiente leído 🎉'}
          </p>
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={unreadCount === 0}
          className="btn-soft"
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todo como leído
        </button>
      </div>

      {/* Pestañas */}
      <div className="mb-5 flex gap-1.5">
        {(
          [
            ['todas', 'Todas'],
            ['noLeidas', `Sin leer (${unreadCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === key
                ? 'bg-ink-900 text-ink-50'
                : 'bg-surface text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-surface py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Bell className="h-7 w-7" />
          </span>
          <p className="font-semibold text-ink-800">No hay notificaciones</p>
          <p className="mt-1 text-sm text-ink-400">
            Cuando alguien te mencione o te asigne una tarea aparecerá aquí.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {list.map((n) => {
            const isRead = n.read || readIds[n.id]
            const Icon = typeIcon[n.type]
            return (
              <li
                key={n.id}
                onClick={() => read(n.id)}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border bg-surface p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md ${
                  isRead ? 'border-ink-200 opacity-70' : 'border-brand-200/70'
                }`}
              >
                {n.person ? (
                  <Avatar
                    initials={n.person.initials}
                    color={n.person.color}
                    name={n.person.name}
                    size="md"
                    className="mt-0.5"
                  />
                ) : (
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${n.color}18`, color: n.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-snug ${
                      isRead ? 'font-medium text-ink-600' : 'font-bold text-ink-900'
                    }`}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-1 text-sm text-ink-500">{n.body}</p>
                  )}
                  <p className="mt-1.5 text-xs text-ink-400">{n.time}</p>
                </div>

                {!isRead && (
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
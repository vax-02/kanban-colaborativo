import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AtSign,
  Bell,
  Check,
  CheckCheck,
  Clock,
  MoveRight,
  UserPlus,
  Users,
} from 'lucide-react'
import Avatar from '../components/Avatar'
import { useNotificationsStore } from '../store/notificationsStore'
import { useBoardsStore } from '../store/boardsStore'
import type { NotificacionDto } from '../lib/types'

function iconoTipo(tipo: string) {
  switch (tipo) {
    case 'INVITACION':
      return { Icon: UserPlus, color: '#0ea5e9' }
    case 'INVITACION_ACEPTADA':
      return { Icon: Check, color: '#10b981' }
    case 'TAREA_ASIGNADA':
      return { Icon: UserPlus, color: '#f59e0b' }
    case 'TAREA_MOVIDA':
      return { Icon: MoveRight, color: '#0ea5e9' }
    case 'TAREA_MENCION':
      return { Icon: AtSign, color: '#8b5cf6' }
    case 'TAREA_POR_VENCER':
      return { Icon: Clock, color: '#ef4444' }
    default:
      return { Icon: Users, color: '#94a3b8' }
  }
}

const roleLabel: Record<string, string> = {
  ADMINISTRADOR: 'Administradora',
  MIEMBRO: 'Miembro',
  EDITOR: 'Editora',
  LECTURA: 'Solo lectura',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Ahora mismo'
  if (min < 60) return `Hace ${min} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} día${days > 1 ? 's' : ''}`
}

export default function NotificationsPage() {
  const notificaciones = useNotificationsStore((s) => s.notificaciones)
  const loading = useNotificationsStore((s) => s.loading)
  const loadNotifications = useNotificationsStore((s) => s.loadNotifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  const markInviteProcessed = useNotificationsStore((s) => s.markInviteProcessed)

  const acceptInvitation = useBoardsStore((s) => s.acceptInvitation)
  const rejectInvitation = useBoardsStore((s) => s.rejectInvitation)
  const loadBoards = useBoardsStore((s) => s.loadBoards)

  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todas' | 'noLeidas'>('todas')
  const navigate = useNavigate()

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const unread = notificaciones.filter((n) => !n.leida).length
  const list =
    filter === 'todas'
      ? notificaciones
      : notificaciones.filter((n) => !n.leida)

  const onAccept = async (n: NotificacionDto) => {
    if (!n.invitacion || busy) return
    setBusy(n.id)
    try {
      await acceptInvitation(n.invitacion.id)
      markInviteProcessed(n.id, 'ACEPTADA')
      await loadBoards()
    } finally {
      setBusy(null)
    }
  }

  const onReject = async (n: NotificacionDto) => {
    if (!n.invitacion || busy) return
    setBusy(n.id)
    try {
      await rejectInvitation(n.invitacion.id)
      markInviteProcessed(n.id, 'RECHAZADA')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {unread > 0 ? `${unread} sin leer` : 'Todo pendiente leído 🎉'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unread === 0}
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
            ['noLeidas', `Sin leer (${unread})`],
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

      {loading ? (
        <p className="py-10 text-center text-sm text-ink-400">Cargando…</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-surface py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Bell className="h-7 w-7" />
          </span>
          <p className="font-semibold text-ink-800">No hay notificaciones</p>
          <p className="mt-1 text-sm text-ink-400">
            Cuando alguien te invite o responda aparecerá aquí.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {list.map((n) => {
            const isRead = n.leida
            const actor = n.invitacion?.creadoPor
            const NotifIcon = iconoTipo(n.tipo).Icon
            const notifColor = iconoTipo(n.tipo).color
            return (
              <li
                key={n.id}
                onClick={() => {
                  if (n.tarea && n.tablero?.id) {
                    navigate(`/tableros/${n.tablero.id}?tarea=${n.tarea.id}`)
                  } else if (n.tablero?.id) {
                    navigate(`/tableros/${n.tablero.id}`)
                  }
                }}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border bg-surface p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md ${
                  isRead ? 'border-ink-200 opacity-70' : 'border-brand-200/70'
                }`}
              >
                {actor ? (
                  <Avatar
                    initials={actor.iniciales}
                    color={actor.avatarColor}
                    name={`${actor.nombre} ${actor.apellidos}`}
                    size="md"
                    className="mt-0.5"
                  />
                ) : (
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${notifColor}18`, color: notifColor }}
                  >
                    <NotifIcon className="h-5 w-5" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-snug ${
                      isRead ? 'font-medium text-ink-600' : 'font-bold text-ink-900'
                    }`}
                  >
                    {n.titulo}
                  </p>
                  {n.cuerpo && (
                    <p className="mt-1 text-sm text-ink-500">{n.cuerpo}</p>
                  )}
                  <p className="mt-1.5 text-xs text-ink-400">
                    {timeAgo(n.createdAt)}
                  </p>

                  {n.tipo === 'INVITACION' && n.invitacion && (
                    <div
                      className="mt-3 flex flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {n.invitacion.estado === 'PENDIENTE' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void onAccept(n)}
                            disabled={busy === n.id}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {busy === n.id ? 'Aceptando…' : 'Aceptar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onReject(n)}
                            disabled={busy === n.id}
                            className="btn-ghost px-3 py-1.5 text-xs"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <span
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                            n.invitacion.estado === 'ACEPTADA'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-ink-100 text-ink-500'
                          }`}
                        >
                          Invitación {n.invitacion.estado === 'ACEPTADA' ? 'aceptada' : 'rechazada'}
                        </span>
                      )}
                      <span className="ml-1 rounded-md bg-ink-100 px-2 py-1 text-[10px] font-bold text-ink-600">
                        {roleLabel[n.invitacion.rol]}
                      </span>
                    </div>
                  )}
                </div>

                {!isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void markRead(n.id)
                    }}
                    className="mt-2 shrink-0 cursor-pointer rounded-full p-1 transition hover:bg-ink-100"
                    aria-label="Marcar como leída"
                  >
                    <span className="block h-2.5 w-2.5 rounded-full bg-brand-600" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  AtSign,
  Bell,
  Check,
  Clock,
  ExternalLink,
  MoreHorizontal,
  MoveRight,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { useBoardsStore } from '../store/boardsStore'
import { useAuthStore } from '../store/authStore'
import { useNotificationsStore } from '../store/notificationsStore'
import { useFiltersStore } from '../store/filtersStore'
import { countActiveFilters } from '../lib/filters'
import type { BoardDetailDto, NotificacionDto } from '../lib/types'

export default function TopBar() {
  const openModal = useUiStore((s) => s.openModal)
  const { boardId } = useParams()
  const getBoard = useBoardsStore((s) => s.getBoard)
  const taskV = useBoardsStore((s) => s.taskV)
  const toggleFavorite = useBoardsStore((s) => s.toggleFavorite)
  const [board, setBoard] = useState<BoardDetailDto | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [openBell, setOpenBell] = useState(false)
  const [openMore, setOpenMore] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const me = useAuthStore((s) => s.user)
  const unread = useNotificationsStore(
    (s) => s.notificaciones.filter((n) => !n.leida).length,
  )
  const filterState = useFiltersStore((s) => s.filters)
  const activeFilters =
    boardId && filterState.boardId === boardId ? countActiveFilters(filterState) : 0

  useEffect(() => {
    if (!boardId) return
    let active = true
    getBoard(boardId)
      .then((b) => {
        if (active) setBoard(b)
      })
      .catch(() => {
        if (active) setBoard(null)
      })
      .finally(() => {
        if (active) setLoadedFor(boardId)
      })
    return () => {
      active = false
    }
  }, [boardId, taskV, getBoard])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpenBell(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setOpenMore(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const currentBoard = board?.id === boardId ? board : null
  const loading = boardId !== undefined && loadedFor !== boardId
  const members = currentBoard?.miembros ?? []
  const atTop = members.slice(0, 4)
  const remaining = Math.max(0, members.length - 4)

  return (
    <header className="relative border-b border-ink-200 bg-surface">
      <div className="flex items-center gap-4 px-8 py-3.5">
        {boardId ? (
          <>
            {/* Título del tablero */}
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink-900">
                {loading ? 'Cargando…' : currentBoard?.nombre ?? 'Tablero no encontrado'}
                {currentBoard && (
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(currentBoard.id)}
                    className={`cursor-pointer transition hover:text-amber-400 ${
                      currentBoard.esFavorito ? 'text-amber-400' : 'text-ink-300'
                    }`}
                    aria-label="Marcar favorito"
                  >
                    <Star className="h-4 w-4" fill={currentBoard.esFavorito ? 'currentColor' : 'none'} />
                  </button>
                )}
              </h1>
              <p className="max-w-[260px] truncate text-xs text-ink-400">
                {currentBoard
                  ? currentBoard.descripcion || 'Tablero colaborativo'
                  : ' '}
              </p>
            </div>

            <div className="mx-auto flex flex-1 items-center justify-center">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  id="topbar-search"
                  type="search"
                  placeholder="Buscar tarea, etiqueta o persona… (/)"
                  className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2.5 pr-24 pl-10 text-sm text-ink-800 transition outline-none placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-100"
                />
                <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-ink-200 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Colaboradores del tablero */}
            {members.length > 0 && (
              <div className="flex -space-x-2.5">
                {atTop.map((m) => (
                  <span
                    key={m.id}
                    title={`${m.nombre} ${m.apellidos}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-surface transition hover:z-10 hover:-translate-y-0.5"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.iniciales}
                  </span>
                ))}
                {remaining > 0 && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-200 text-[10px] font-bold text-ink-600 ring-2 ring-surface">
                    +{remaining}
                  </span>
                )}
              </div>
            )}

            {/* Acciones del tablero */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openModal({ type: 'collaborators', boardId: boardId as string | undefined })}
                className="btn-primary"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden xl:inline">Colaborar</span>
              </button>
              <button
                type="button"
                onClick={() => openModal({ type: 'activity' })}
                className="btn-ghost hidden p-2.5 sm:inline-flex"
                aria-label="Actividad"
                title="Actividad reciente"
              >
                <Clock className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openModal({ type: 'filters' })}
                className="btn-ghost relative hidden p-2.5 md:inline-flex"
                aria-label="Filtros"
                title={
                  activeFilters > 0
                    ? `${activeFilters} filtro${activeFilters === 1 ? '' : 's'} activo${activeFilters === 1 ? '' : 's'}`
                    : 'Filtros y vistas'
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilters > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <p className="text-lg font-bold tracking-tight text-ink-900">TaskFlow</p>
          </div>
        )}

        {/* Notificaciones */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setOpenBell((v) => !v)}
            className={`relative cursor-pointer rounded-xl border p-2.5 transition ${
              openBell
                ? 'border-ink-300 bg-ink-50 text-ink-700'
                : 'border-ink-200 bg-surface text-ink-700 hover:border-ink-300 hover:bg-ink-50'
            }`}
            aria-label="Notificaciones"
            title="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                {unread}
              </span>
            )}
          </button>

          {openBell && <NotificationsPopover onClose={() => setOpenBell(false)} />}
        </div>

        {/* Más opciones */}
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setOpenMore((v) => !v)}
            className={`cursor-pointer rounded-xl border p-2.5 transition ${
              openMore
                ? 'border-ink-300 bg-ink-50 text-ink-700'
                : 'border-ink-200 bg-surface text-ink-700 hover:border-ink-300 hover:bg-ink-50'
            }`}
            aria-label="Más opciones"
            title="Más opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {openMore && (
            <MoreMenu
              isOwner={!!currentBoard && currentBoard.creadoPor.id === me?.id}
              archivado={currentBoard?.archivado ?? false}
              boardNombre={currentBoard?.nombre ?? 'este tablero'}
              boardColor={currentBoard?.color ?? '#94a3b8'}
              onClose={() => setOpenMore(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function iconoNotificacion(tipo: string) {
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

function tiempoRelativo(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'Ahora mismo'
  if (min < 60) return `Hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  return `Hace ${dias} día${dias === 1 ? '' : 's'}`
}

function NotificationsPopover({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const notificaciones = useNotificationsStore((s) => s.notificaciones)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)

  const list = notificaciones.slice(0, 5)
  const unreadCount = notificaciones.filter((n) => !n.leida).length

  return (
    <div className="absolute top-[calc(100%+10px)] right-0 z-40 w-[380px] overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-xl">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink-900">Notificaciones</p>
          <p className="text-xs text-ink-400">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo leído'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-ink-300"
        >
          Marcar todas
        </button>
      </div>

      <ul className="max-h-[340px] overflow-y-auto">
        {list.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-ink-400">
            Aún no tienes notificaciones.
          </li>
        )}
        {list.map((n: NotificacionDto) => {
          const isRead = n.leida
          const meta = iconoNotificacion(n.tipo)
          const actor = n.invitacion?.creadoPor
          return (
            <li
              key={n.id}
              className={`flex cursor-pointer gap-3 border-b border-ink-50 px-4 py-3 transition hover:bg-ink-50 ${
                isRead ? 'opacity-70' : ''
              }`}
              onClick={() => {
                void markRead(n.id)
                onClose()
                navigate('/notificaciones')
              }}
            >
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
              >
                <meta.Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug font-semibold text-ink-800">
                  {actor ? `${actor.nombre} ${actor.apellidos}` : null}
                  {actor ? ' · ' : ''}
                  {n.titulo}
                </p>
                {n.cuerpo && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.cuerpo}</p>
                )}
                <p className="mt-1 text-[11px] text-ink-400">
                  {tiempoRelativo(n.createdAt)}
                </p>
              </div>
              {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
            </li>
          )
        })}
      </ul>

      <Link
        to="/notificaciones"
        onClick={onClose}
        className="block border-t border-ink-100 bg-ink-50 py-2.5 text-center text-xs font-semibold text-brand-600 transition hover:bg-ink-100"
      >
        Ver todas las notificaciones
      </Link>
    </div>
  )
}

function MoreMenu({
  onClose,
  isOwner,
  archivado,
  boardNombre,
  boardColor,
}: {
  onClose: () => void
  isOwner: boolean
  archivado: boolean
  boardNombre: string
  boardColor: string
}) {
  const openModal = useUiStore((s) => s.openModal)
  const setArchivado = useBoardsStore((s) => s.setArchivado)
  const { boardId } = useParams()

  const items = [
    { icon: UserPlus, label: 'Añadir colaboradores', action: () => openModal({ type: 'collaborators', boardId: boardId as string | undefined }) },
    { icon: SlidersHorizontal, label: 'Filtrar tareas', action: () => openModal({ type: 'filters' }) },
    { icon: Clock, label: 'Historial de actividad', action: () => openModal({ type: 'activity' }) },
  ]

  return (
    <div className="absolute top-[calc(100%+10px)] right-0 z-40 w-64 overflow-hidden rounded-2xl border border-ink-200 bg-surface py-1.5 shadow-xl">
      {items.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            action()
            onClose()
          }}
          className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
        >
          <Icon className="h-4 w-4 text-ink-400" />
          {label}
        </button>
      ))}
      <div className="my-1.5 h-px bg-ink-100" />
      {isOwner && boardId && (
        <button
          type="button"
          onClick={() => {
            if (archivado) {
              void setArchivado(boardId, false)
            } else {
              openModal({
                type: 'archiveBoard',
                boardId,
                boardNombre,
                boardColor,
              })
            }
            onClose()
          }}
          className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
        >
          {archivado ? (
            <ArchiveRestore className="h-4 w-4 text-ink-400" />
          ) : (
            <Archive className="h-4 w-4 text-ink-400" />
          )}
          {archivado ? 'Restaurar tablero' : 'Archivar tablero…'}
        </button>
      )}
      {isOwner && boardId && (
        <button
          type="button"
          onClick={() => {
            openModal({ type: 'deleteBoard', boardId })
            onClose()
          }}
          className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar tablero…
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (boardId) window.open(`/tableros/${boardId}/amplia`, '_blank')
          onClose()
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed"
      >
        <ExternalLink className="h-4 w-4 text-ink-400" />
        Abrir en nueva pestaña
      </button>
    </div>
  )
}
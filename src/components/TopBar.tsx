import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { notices } from '../data/mock'
import { useUiStore } from '../store/uiStore'
import { useBoardsStore } from '../store/boardsStore'
import { useAuthStore } from '../store/authStore'
import type { BoardDetailDto } from '../lib/types'

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
  const [readIds, setReadIds] = useState<Record<string, boolean>>({})
  const bellRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const me = useAuthStore((s) => s.user)

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

  const unread = notices.filter((n) => !n.read && !readIds[n.id]).length

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
                  type="search"
                  placeholder="Buscar tarea, etiqueta o persona…"
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
                className="btn-ghost hidden p-2.5 md:inline-flex"
                aria-label="Filtros"
                title="Filtros y vistas"
              >
                <SlidersHorizontal className="h-4 w-4" />
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

          {openBell && <NotificationsPopover readIds={readIds} onRead={setReadIds} />}
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
              onClose={() => setOpenMore(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function NotificationsPopover({
  readIds,
  onRead,
}: {
  readIds: Record<string, boolean>
  onRead: (v: Record<string, boolean>) => void
}) {
  const list = notices.slice(0, 5)
  const unreadCount = list.filter((n) => !n.read && !readIds[n.id]).length

  return (
    <div className="absolute top-[calc(100%+10px)] right-0 z-40 w-[380px] overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-xl">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink-900">Notificaciones</p>
          <p className="text-xs text-ink-400">{unreadCount} sin leer</p>
        </div>
        <button
          type="button"
          onClick={() => onRead(Object.fromEntries(list.map((n) => [n.id, true])))}
          className="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Marcar todas
        </button>
      </div>

      <ul className="max-h-[340px] overflow-y-auto">
        {list.map((n) => {
          const isRead = n.read || readIds[n.id]
          return (
            <li
              key={n.id}
              className={`flex cursor-pointer gap-3 border-b border-ink-50 px-4 py-3 transition hover:bg-ink-50 ${
                isRead ? 'opacity-70' : ''
              }`}
              onClick={() => onRead({ ...readIds, [n.id]: true })}
            >
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${n.color}18`, color: n.color }}
              >
                {n.type === 'mention' ? <UserPlus className="h-4 w-4" /> : null}
                {n.type === 'comment' ? <MessageSquare className="h-4 w-4" /> : null}
                {n.type === 'system' ? <Clock className="h-4 w-4" /> : null}
                {n.type === 'assign' ? <Check className="h-4 w-4" /> : null}
                {n.type === 'invite' ? <Users className="h-4 w-4" /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug font-semibold text-ink-800">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.body}</p>
                <p className="mt-1 text-[11px] text-ink-400">{n.time}</p>
              </div>
              {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
            </li>
          )
        })}
      </ul>

      <Link
        to="/notificaciones"
        className="block border-t border-ink-100 bg-ink-50 py-2.5 text-center text-xs font-semibold text-brand-600 transition hover:bg-ink-100"
      >
        Ver todas las notificaciones
      </Link>
    </div>
  )
}

function MoreMenu({ onClose, isOwner }: { onClose: () => void; isOwner: boolean }) {
  const openModal = useUiStore((s) => s.openModal)
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
          if (boardId) window.open(`/tableros/${boardId}`, '_blank')
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
import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  KanbanSquare,
  LoaderCircle,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import Avatar from '../components/Avatar'
import { useUiStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { useBoardsStore } from '../store/boardsStore'
import type { BoardDto, MemberDto, RolTablero } from '../lib/types'

const ROL_OPTS: { value: RolTablero; label: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'MIEMBRO', label: 'Miembro' },
  { value: 'LECTURA', label: 'Solo lectura' },
]

export default function MembersPage() {
  const openModal = useUiStore((s) => s.openModal)
  const me = useAuthStore((s) => s.user)
  const boards = useBoardsStore((s) => s.boards)
  const loadBoards = useBoardsStore((s) => s.loadBoards)
  const loadSentInvites = useBoardsStore((s) => s.loadSentInvites)
  const sentInvites = useBoardsStore((s) => s.sentInvites)
  const updateMemberRole = useBoardsStore((s) => s.updateMemberRole)

  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selBoard, setSelBoard] = useState<string | null>(null)

  useEffect(() => {
    void loadBoards().finally(() => setLoading(false))
    void loadSentInvites()
  }, [loadBoards, loadSentInvites])

  const uniqueMembers = useMemo(
    () => new Set(boards.flatMap((b) => b.miembros.map((m) => m.id))).size,
    [boards],
  )

  const visibleBoards = useMemo(
    () => (selBoard ? boards.filter((b) => b.id === selBoard) : boards),
    [boards, selBoard],
  )

  const invitesFor = useMemo(
    () => (boardId: string) => sentInvites.filter((p) => p.tablero.id === boardId),
    [sentInvites],
  )

  const stats = [
    {
      icon: KanbanSquare,
      label: 'Tableros',
      value: String(boards.length),
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      icon: Users,
      label: 'Miembros únicos',
      value: String(uniqueMembers),
      color: '#10b981',
      bg: '#d1fae5',
    },
    {
      icon: UserPlus,
      label: 'Invitaciones pendientes',
      value: String(sentInvites.length),
      color: '#f59e0b',
      bg: '#fef3c7',
    },
  ]

  const canManageBoard = (board: BoardDto) =>
    board.miembros.find((m) => m.id === me?.id)?.rol === 'ADMINISTRADOR'

  const changeRole = async (board: BoardDto, usuarioId: string, rol: RolTablero) => {
    setPending(`${board.id}:${usuarioId}`)
    setError(null)
    try {
      await updateMemberRole(board.id, usuarioId, rol)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el rol')
    } finally {
      setPending(null)
    }
  }

  const quitMember = (board: BoardDto, member: MemberDto) => {
    openModal({
      type: 'removeMember',
      boardId: board.id,
      boardNombre: board.nombre,
      member,
    })
  }

  return (
    <div className="mx-auto max-w-4xl pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Miembros</h1>
          <p className="mt-1 text-sm text-ink-500">
            Equipo de TaskFlow · {uniqueMembers} personas colaboran en {boards.length}{' '}
            {boards.length === 1 ? 'tablero' : 'tableros'}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal({ type: 'collaborators' })}
          className="btn-primary"
        >
          <UserPlus className="h-4 w-4" />
          Invitar miembros
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {/* Miembros por tablero */}
      <div className="mb-2.5 flex items-center gap-2">
        <h2 className="text-sm font-bold text-ink-900">Miembros por tablero</h2>
        <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
          {visibleBoards.length}
        </span>
      </div>

      {/* Opciones de tablero con scroll horizontal */}
      <div className="mb-4 flex max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-1.5">
        <button
          type="button"
          onClick={() => setSelBoard(null)}
          className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            selBoard === null
              ? 'bg-ink-900 text-ink-50'
              : 'bg-surface text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100'
          }`}
        >
          Todos
        </button>
        {boards.map((b) => {
          const activo = selBoard === b.id
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelBoard(activo ? null : b.id)}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activo
                  ? 'bg-ink-900 text-ink-50'
                  : 'bg-surface text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: b.color }}
              />
              {b.nombre}
              {invitesFor(b.id).length > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    activo ? 'bg-ink-50 text-ink-900' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {invitesFor(b.id).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-ink-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          Cargando tableros…
        </div>
      ) : visibleBoards.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-surface py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
            <Users className="h-7 w-7" />
          </span>
          <p className="font-semibold text-ink-800">Sin tableros todavía</p>
          <p className="mt-1 text-sm text-ink-400">
            Crea o únete a un tablero para gestionar aquí a sus miembros.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleBoards.map((board) => {
            const canManage = canManageBoard(board)
            return (
              <section key={board.id}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
                    style={{ backgroundColor: board.color }}
                  >
                    {board.nombre.charAt(0).toUpperCase()}
                  </span>
                  <h3 className="text-sm font-bold text-ink-900">{board.nombre}</h3>
                  <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                    {board.miembros.length}
                  </span>
                  {!canManage && (
                    <span className="ml-auto text-[11px] text-ink-400">
                      Solo administradores gestionan miembros
                    </span>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
                  {invitesFor(board.id).length > 0 && (
                    <div className="space-y-2 border-b border-amber-100 bg-amber-50/50 p-3.5">
                      <p className="text-[11px] font-bold tracking-wider text-amber-600 uppercase">
                        Invitaciones pendientes ({invitesFor(board.id).length})
                      </p>
                      {invitesFor(board.id).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2.5"
                        >
                          <Avatar
                            initials={p.usuario.iniciales}
                            color={p.usuario.avatarColor}
                            name={`${p.usuario.nombre} ${p.usuario.apellidos}`}
                            size="sm"
                            className="opacity-60"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink-800">
                              {p.usuario.nombre} {p.usuario.apellidos}
                            </p>
                            <p className="truncate text-xs text-ink-400">
                              {p.usuario.email} ·{' '}
                              {ROL_OPTS.find((r) => r.value === p.rol)?.label ?? p.rol}
                            </p>
                          </div>
                          <span className="rounded-md bg-surface px-2.5 py-1 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
                            Pendiente
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {board.miembros.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-ink-400">
                      Sin miembros en este tablero.
                    </p>
                  ) : (
                    <ul>
                      {board.miembros.map((m, i) => {
                        const busy = pending === `${board.id}:${m.id}`
                        const isMe = m.id === me?.id
                        const isCreator = m.id === board.creadoPor.id
                        return (
                          <li
                            key={m.id}
                            className={`flex flex-wrap items-center gap-3.5 px-4 py-3.5 transition hover:bg-ink-50 ${
                              i > 0 ? 'border-t border-ink-100' : ''
                            }`}
                          >
                            <Avatar
                              initials={m.iniciales}
                              color={m.avatarColor}
                              name={`${m.nombre} ${m.apellidos}`}
                              online={m.online}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-ink-800">
                                  {m.nombre} {m.apellidos}
                                </p>
                                {isMe && (
                                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                                    TÚ
                                  </span>
                                )}
                                {isCreator && (
                                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                                    Creador
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-ink-400">{m.email}</p>
                            </div>

                            <div className="relative">
                              <select
                                value={m.rol}
                                disabled={!canManage || busy}
                                onChange={(e) =>
                                  changeRole(board, m.id, e.target.value as RolTablero)
                                }
                                className="cursor-pointer appearance-none rounded-lg border border-ink-200 bg-surface py-1.5 pr-7 pl-3 text-xs font-medium text-ink-700 outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
                                title={canManage ? 'Cambiar rol' : 'Requiere ser administrador'}
                              >
                                {ROL_OPTS.map((r) => (
                                  <option key={r.value} value={r.value}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                            </div>

                            <button
                              type="button"
                              onClick={() => quitMember(board, m)}
                              disabled={!canManage || busy || isCreator}
                              className="cursor-pointer rounded-lg p-1.5 text-ink-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-300"
                              aria-label={`Quitar a ${m.nombre} ${m.apellidos} del tablero`}
                              title={
                                isCreator
                                  ? 'El creador no se puede quitar'
                                  : canManage
                                    ? 'Quitar del tablero'
                                    : 'Requiere ser administrador'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-ink-400">
        El rol define lo que cada persona puede hacer en un tablero: solo lectura, editar tarjetas o
        administrar el tablero.
      </p>
    </div>
  )
}
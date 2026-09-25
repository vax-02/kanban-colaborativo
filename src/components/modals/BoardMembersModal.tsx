import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, MailSearch, Search, Send, UserMinus, UserPlus, X } from 'lucide-react'
import Modal from '../Modal'
import Avatar from '../Avatar'
import { useBoardsStore } from '../../store/boardsStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import type { BoardDetailDto, MemberDto, UserMini, RolTablero } from '../../lib/types'

type Props = {
  boardId: string
  onClose: () => void
}

const ROLES: { value: RolTablero; label: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'MIEMBRO', label: 'Miembro' },
  { value: 'LECTURA', label: 'Solo lectura' },
]

const ALL_ROL_OPTIONS: RolTablero[] = ['ADMINISTRADOR', 'EDITOR', 'MIEMBRO', 'LECTURA']

function rolLabel(rol: RolTablero) {
  return ROLES.find((r) => r.value === rol)?.label ?? rol
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
      {children}
    </p>
  )
}

export default function BoardMembersModal({ boardId, onClose }: Props) {
  const getBoard = useBoardsStore((s) => s.getBoard)
  const sendInvite = useBoardsStore((s) => s.sendInvite)
  const updateMemberRole = useBoardsStore((s) => s.updateMemberRole)
  const removeMember = useBoardsStore((s) => s.removeMember)
  const cancelInvite = useBoardsStore((s) => s.cancelInvite)
  const me = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardDetailDto | null>(null)
  const [users, setUsers] = useState<UserMini[]>([])
  const [query, setQuery] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Record<string, RolTablero>>({})
  const [busy, setBusy] = useState('')

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const [b, res] = await Promise.all([
          getBoard(boardId),
          api<{ users: UserMini[] }>('/users'),
        ])
        if (!active) return
        setBoard(b)
        setUsers(res.users)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [boardId, getBoard])

  const canManage = useMemo(
    () =>
      !!board &&
      (board.miembros.find((m) => m.id === me?.id)?.rol === 'ADMINISTRADOR' ||
        board.creadoPor.id === me?.id),
    [board, me],
  )

  const memberIds = useMemo(() => new Set(board?.miembros.map((m) => m.id)), [board])
  const pendingIds = useMemo(
    () => new Set(board?.invitaciones.map((i) => i.usuario.id) ?? []),
    [board],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.apellidos.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
  }, [query, users])

  const refreshBoard = async () => {
    try {
      const b = await getBoard(boardId)
      setBoard(b)
    } catch {
      /* sin cambios */
    }
  }

  const handleInvite = async (usuarioId: string, rol: RolTablero) => {
    setError(null)
    setBusy(usuarioId)
    try {
      await sendInvite(boardId, usuarioId, rol)
      await refreshBoard()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la invitación')
    } finally {
      setBusy('')
    }
  }

  const handleRole = async (usuarioId: string, rol: RolTablero) => {
    setError(null)
    setBusy(usuarioId)
    try {
      await updateMemberRole(boardId, usuarioId, rol)
      await refreshBoard()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el rol')
    } finally {
      setBusy('')
    }
  }

  const handleRemove = async (usuarioId: string) => {
    if (!window.confirm('¿Quitar a este miembro del tablero?')) return
    setError(null)
    setBusy(usuarioId)
    try {
      await removeMember(boardId, usuarioId)
      await refreshBoard()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar')
    } finally {
      setBusy('')
    }
  }

  const handleCancelInvite = async (usuarioId: string) => {
    setError(null)
    setBusy(usuarioId)
    try {
      await cancelInvite(boardId, usuarioId)
      await refreshBoard()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar la invitación')
    } finally {
      setBusy('')
    }
  }

  return (
    <Modal
      title="Miembros del tablero"
      subtitle={board ? `Gestiona quién colabora en «${board.nombre}»` : 'Cargando…'}
      icon={board ? <UserPlus className="h-5 w-5" /> : <LoaderCircle className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          {error && <p className="mr-auto text-xs font-medium text-rose-500">{error}</p>}
          <button type="button" onClick={onClose} className="btn-ghost">
            Cerrar
          </button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          Cargando miembros…
        </div>
      ) : (
        <>
          {/* Búsqueda por correo */}
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por correo o nombre… (solo cuentas registradas)"
              className="input pl-10"
              autoFocus
            />
          </div>

          {/* Miembros actuales */}
          <SectionLabel>Miembros actuales ({board?.miembros.length ?? 0})</SectionLabel>
          <ul className="mb-4 space-y-2">
            {board?.miembros.map((m: MemberDto) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface p-3">
                <Avatar
                  initials={m.iniciales}
                  color={m.avatarColor}
                  name={`${m.nombre} ${m.apellidos}`}
                  online={m.online}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {m.nombre} {m.apellidos}
                    {board.creadoPor.id === m.id && (
                      <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        Creador
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-400">{m.email}</p>
                </div>
                <select
                  value={m.rol}
                  disabled={!canManage}
                  onChange={(e) => handleRole(m.id, e.target.value as RolTablero)}
                  className="cursor-pointer rounded-lg border border-ink-200 bg-surface py-1.5 pl-3 text-xs font-medium text-ink-700 outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400"
                >
                  <option disabled>{rolLabel(m.rol)}</option>
                  {ALL_ROL_OPTIONS.filter((r) => r !== m.rol).map((r) => (
                    <option key={r} value={r}>
                      {rolLabel(r)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
                  disabled={!canManage || board.creadoPor.id === m.id || busy === m.id}
                  className="shrink-0 cursor-pointer rounded-lg p-2 text-ink-400 transition enabled:hover:bg-rose-50 enabled:hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Quitar a ${m.nombre}`}
                >
                  {busy === m.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Invitaciones pendientes */}
          {(board?.invitaciones.length ?? 0) > 0 && (
            <>
              <SectionLabel>
                Invitaciones pendientes ({board?.invitaciones.length})
              </SectionLabel>
              <ul className="mb-4 space-y-2">
                {board?.invitaciones.map((inv) => (
<li key={inv.id} className="flex items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-3">
                      <Avatar
                        initials={inv.usuario.iniciales}
                        color={inv.usuario.avatarColor}
                        name={`${inv.usuario.nombre} ${inv.usuario.apellidos}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {inv.usuario.nombre} {inv.usuario.apellidos}
                        </p>
                        <p className="truncate text-xs text-ink-400">{inv.usuario.email}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        Pendiente · {rolLabel(inv.rol)}
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            void handleCancelInvite(inv.usuario.id)
                          }}
                          disabled={busy === inv.usuario.id}
                          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-500 transition hover:bg-ink-50 hover:text-rose-500 disabled:opacity-40"
                          title="Cancelar invitación"
                        >
                          {busy === inv.usuario.id ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          Cancelar
                        </button>
                      )}
                    </li>
                ))}
              </ul>
            </>
          )}

          {/* Invitar desde cuentas registradas */}
          <SectionLabel>
            Invitar por correo ({filtered.length - memberIds.size} disponibles)
          </SectionLabel>
          {query.trim() === '' ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 py-8 text-center">
              <MailSearch className="h-6 w-6 text-ink-300" />
              <p className="text-xs text-ink-500">
                Escribe un correo o nombre para buscar usuarios registrados e invitarlos.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 py-6 text-center text-xs text-ink-400">
              No hay cuentas registradas que coincidan con la búsqueda.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered
                .filter((u) => !memberIds.has(u.id))
                .map((u) => {
                  const isPending = pendingIds.has(u.id)
                  return (
                    <li key={u.id} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface p-3">
                      <Avatar
                        initials={u.iniciales}
                        color={u.avatarColor}
                        name={`${u.nombre} ${u.apellidos}`}
                        online={u.online}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {u.nombre} {u.apellidos}
                        </p>
                        <p className="truncate text-xs text-ink-400">{u.email}</p>
                      </div>
                      {!isPending && (
                        <select
                          value={selectedRoles[u.id] ?? 'MIEMBRO'}
                          onChange={(e) =>
                            setSelectedRoles((prev) => ({
                              ...prev,
                              [u.id]: e.target.value as RolTablero,
                            }))
                          }
                          disabled={!canManage}
                          className="cursor-pointer rounded-lg border border-ink-200 bg-surface py-1.5 pl-3 text-xs font-medium text-ink-700 outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400"
                        >
                          {ALL_ROL_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {rolLabel(r)}
                            </option>
                          ))}
                        </select>
                      )}
                      {isPending ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                          Pendiente
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInvite(u.id, selectedRoles[u.id] ?? 'MIEMBRO')}
                          disabled={!canManage || busy === u.id}
                          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition enabled:bg-brand-600 enabled:text-white enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400"
                        >
                          {busy === u.id ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-white" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Enviar invitación
                        </button>
                      )}
                    </li>
                  )
                })}
            </ul>
          )}

          {!canManage && (
            <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-ink-50 px-3 py-2 text-xs font-medium text-ink-500">
              Solo el administrador puede invitar o modificar miembros.
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
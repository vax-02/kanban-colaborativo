import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  LoaderCircle,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import Avatar from './Avatar'
import Modal from './Modal'
import { api } from '../lib/api'
import { useBoardsStore } from '../store/boardsStore'
import { useAuthStore } from '../store/authStore'
import type { BoardDto, HistorialMiembroDto, MemberDto, RolTablero } from '../lib/types'

type Props = {
  boardId?: string
  onClose: () => void
}

const roles: { value: RolTablero; label: string; desc: string }[] = [
  {
    value: 'ADMINISTRADOR',
    label: 'Administrador',
    desc: 'Control total: gestiona miembros, invitaciones, el tablero y las columnas.',
  },
  {
    value: 'EDITOR',
    label: 'Editor',
    desc: 'Crea, edita y mueve tarjetas, checklists y etiquetas del tablero.',
  },
  {
    value: 'MIEMBRO',
    label: 'Miembro',
    desc: 'Colabora en el tablero: puede crear y editar tarjetas.',
  },
  {
    value: 'LECTURA',
    label: 'Solo lectura',
    desc: 'Únicamente consulta el tablero. No puede crear ni modificar nada.',
  },
]

const roleLabel: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  MIEMBRO: 'Miembro',
  EDITOR: 'Editor',
  LECTURA: 'Solo lectura',
}

function fechaCorta(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type SearchedUser = {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  iniciales: string
  online: boolean
}

type BoardInviteRow = {
  id: string
  rol: RolTablero
  usuario: MemberDto
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const searchUsers = debounce(
  async (q: string, cb: (users: SearchedUser[]) => void) => {
    try {
      const res = await api<{ users: SearchedUser[] }>(
        `/users?buscar=${encodeURIComponent(q)}`,
      )
      cb(res.users)
    } catch {
      cb([])
    }
  },
  300,
)

export default function CollaboratorModal({ boardId, onClose }: Props) {
  const me = useAuthStore((s) => s.user)
  const boards = useBoardsStore((s) => s.boards)
  const loadBoards = useBoardsStore((s) => s.loadBoards)
  const membersV = useBoardsStore((s) => s.membersV)
  const getBoard = useBoardsStore((s) => s.getBoard)
  const sendInvite = useBoardsStore((s) => s.sendInvite)
  const updateInviteRole = useBoardsStore((s) => s.updateInviteRole)
  const cancelInvite = useBoardsStore((s) => s.cancelInvite)

  const [selectedBoardId, setSelectedBoardId] = useState<string>(boardId ?? '')
  const [board, setBoard] = useState<BoardDto | null>(null)
  const [pendingInvites, setPendingInvites] = useState<BoardInviteRow[]>([])
  const [historial, setHistorial] = useState<HistorialMiembroDto[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchedUser[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RolTablero>('MIEMBRO')
  const [busy, setBusy] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sentMsg, setSentMsg] = useState<string | null>(null)

  const myBoards = useMemo(
    () =>
      boards.filter(
        (b) =>
          b.creadoPor.id === me?.id ||
          b.miembros.some((m) => m.id === me?.id && m.rol === 'ADMINISTRADOR'),
      ),
    [boards, me?.id],
  )

  useEffect(() => {
    void loadBoards()
  }, [loadBoards])

  useEffect(() => {
    if (!selectedBoardId) return
    let active = true
    getBoard(selectedBoardId)
      .then((b) => {
        if (!active) return
        setBoard({
          id: b.id,
          nombre: b.nombre,
          descripcion: b.descripcion,
          color: b.color,
          plantilla: b.plantilla,
          esPrivado: b.esPrivado,
          esFavorito: b.esFavorito,
          tareas: 0,
          done: 0,
          updatedAt: b.updatedAt,
          creadoPor: b.creadoPor,
          miembros: b.miembros,
        })
        setPendingInvites(b.invitaciones)
        setHistorial(b.historialMiembros ?? [])
      })
      .catch(() => setBoard(null))
      .finally(() => {
        if (active) setLoadedFor(selectedBoardId)
      })
    return () => {
      active = false
    }
  }, [selectedBoardId, membersV, getBoard])

  const searching = selectedBoardId !== '' && loadedFor !== selectedBoardId
  const activeRole = roles.find((r) => r.value === role) ?? roles[0]

  const selectBoard = (id: string) => {
    setSelectedBoardId(id)
    setBoard(null)
    setPendingInvites([])
    setHistorial([])
    setErrorMsg(null)
    setSentMsg(null)
  }

  const inviteByEmail = async (emailToInvite: string) => {
    setBusy('email')
    setErrorMsg(null)
    setSentMsg(null)
    try {
      await sendInvite(selectedBoardId, '', role, emailToInvite)
      setSentMsg(`Invitación enviada a ${emailToInvite}`)
      // actualiza las invitaciones pendientes
      const inv = await getBoard(selectedBoardId)
      setPendingInvites(inv.invitaciones)
      setEmail('')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo invitar')
    } finally {
      setBusy(null)
    }
  }

  const inviteById = async (usuarioId: string) => {
    setBusy(usuarioId)
    setErrorMsg(null)
    setSentMsg(null)
    try {
      await sendInvite(selectedBoardId, usuarioId, role)
      setSentMsg('Invitación enviada')
      const inv = await getBoard(selectedBoardId)
      setPendingInvites(inv.invitaciones)
      setResults([])
      setQuery('')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo invitar')
    } finally {
      setBusy(null)
    }
  }

  const changeInviteRole = async (usuarioId: string, nextRol: RolTablero) => {
    setErrorMsg(null)
    setSentMsg(null)
    setBusy(`role-${usuarioId}`)
    try {
      await updateInviteRole(selectedBoardId, usuarioId, nextRol)
      const inv = await getBoard(selectedBoardId)
      setPendingInvites(inv.invitaciones)
      setSentMsg(`Invitación actualizada a ${roleLabel[nextRol]}`)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo cambiar el rol')
    } finally {
      setBusy(null)
    }
  }

  const cancelInv = async (usuarioId: string) => {    setErrorMsg(null)
    setSentMsg(null)
    try {
      await cancelInvite(selectedBoardId, usuarioId)
      const inv = await getBoard(selectedBoardId)
      setPendingInvites(inv.invitaciones)
      setSentMsg('Invitación cancelada')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo cancelar')
    }
  }

  return (
    <Modal
      title="Añadir colaboradores"
      subtitle={
        board
          ? `Invita a tu equipo a colaborar en el tablero «${board.nombre}».`
          : 'Selecciona un tablero que administres para invitar personas.'
      }
      icon={<UserPlus className="h-5 w-5" />}
      onClose={onClose}
      footer={<div />}
    >
      {!selectedBoardId && myBoards.length > 0 && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold text-ink-600">
            Tablero destino
          </label>
          <div className="flex flex-wrap gap-2">
            {myBoards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => selectBoard(b.id)}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-surface px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                {b.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBoardId && (
        <>
          {/* Rol con el que se invita */}
          <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="invite-role"
                className="flex items-center gap-1.5 text-xs font-bold text-ink-700"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                Rol con el que se invita
              </label>
              <div className="relative">
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RolTablero)}
                  className="cursor-pointer appearance-none rounded-lg border border-ink-200 bg-surface py-1.5 pr-8 pl-3 text-xs font-semibold text-ink-700 outline-none transition focus:border-brand-400"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-500">{activeRole?.desc}</p>
          </div>

          {/* Búsqueda de usuarios */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                const q = e.target.value.trim()
                if (q.length >= 2) {
                  searchUsers(q, setResults)
                } else {
                  setResults([])
                }
              }}
              placeholder="Buscar usuario por correo o nombre…"
              className="input pl-10"
              autoFocus
            />
          </div>

          {errorMsg && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {errorMsg}
            </p>
          )}
          {sentMsg && (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
              {sentMsg}
            </p>
          )}

          {/* Resultados de búsqueda */}
          {results.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
                Usuarios encontrados
              </p>
              <ul className="space-y-2">
                {results.map((u) => {
                  const isMember = board?.miembros.some((m) => m.id === u.id)
                  const isPending = pendingInvites.some((i) => i.usuario.id === u.id)
                  const isSelf = u.id === me?.id
                  return (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface p-3"
                    >
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
                      {isSelf ? (
                        <span className="shrink-0 text-xs font-semibold text-ink-400">
                          Tú
                        </span>
                      ) : isMember ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                          Miembro
                        </span>
                      ) : isPending ? (
                        <span className="shrink-0 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
                          Pendiente
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void inviteById(u.id)}
                          disabled={busy === u.id}
                          title={`Invitar como ${activeRole.label}`}
                          className="flex shrink-0 cursor-pointer flex-col items-end rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed"
                        >
                          {busy === u.id ? (
                            'Enviando…'
                          ) : (
                            <>
                              Invitar
                              <span className="text-[10px] font-medium text-brand-100">
                                como {activeRole.label}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <p className="mb-4 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-3 text-center text-xs text-ink-500">
              No hay usuarios registrados con ese correo o nombre.
            </p>
          )}

          {/* Invitar directamente por correo */}
          <div className="mb-5 rounded-xl border border-ink-200 bg-ink-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
              <Mail className="h-3.5 w-3.5 text-ink-400" />
              Invitar por correo electrónico
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = email.trim()
                    if (value) void inviteByEmail(value)
                  }
                }}
                placeholder="correo@empresa.com"
                className="input"
              />
              <button
                type="button"
                onClick={() => {
                  const value = email.trim()
                  if (value) void inviteByEmail(value)
                }}
                disabled={!email.trim() || busy === 'email'}
                className="btn-primary shrink-0"
              >
                {busy === 'email' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Invitar
              </button>
            </div>
          </div>

          {/* Invitaciones pendientes */}
          {pendingInvites.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
                Invitaciones pendientes ({pendingInvites.length})
              </p>
              <ul className="space-y-2">
                {pendingInvites.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/50 p-3"
                  >
                    <Avatar
                      initials={i.usuario.iniciales}
                      color={i.usuario.avatarColor}
                      name={`${i.usuario.nombre} ${i.usuario.apellidos}`}
                      size="sm"
                      className="opacity-60"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {i.usuario.nombre} {i.usuario.apellidos}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {i.usuario.email} · {roleLabel[i.rol]}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <select
                        value={i.rol}
                        disabled={busy === `role-${i.usuario.id}`}
                        onChange={(e) => void changeInviteRole(i.usuario.id, e.target.value as RolTablero)}
                        title="Cambiar el rol de la invitación"
                        aria-label={`Rol de la invitación a ${i.usuario.nombre}`}
                        className="cursor-pointer appearance-none rounded-lg border border-ink-200 bg-surface py-1.5 pr-7 pl-2.5 text-[11px] font-semibold text-ink-700 outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {roles.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-ink-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => void cancelInv(i.usuario.id)}
                      className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-amber-100 hover:text-rose-600"
                      aria-label="Cancelar invitación"
                      title="Cancelar invitación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Miembros actuales */}
          {searching ? (
            <p className="py-6 text-center text-xs text-ink-400">Cargando…</p>
          ) : (
            board && (
              <div>
                <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
                  Miembros del tablero ({board.miembros.length})
                </p>
                <ul className="space-y-2">
                  {board.miembros.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface p-3"
                    >
                      <Avatar
                        initials={m.iniciales}
                        color={m.avatarColor}
                        name={`${m.nombre} ${m.apellidos}`}
                        online={m.online}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {m.nombre} {m.apellidos}
                          {m.id === me?.id && (
                            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                              TÚ
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-ink-400">
                          {m.email}
                          {m.invitadoAt && (
                            <span> · Invitado el {fechaCorta(m.invitadoAt)}</span>
                          )}
                          {m.ingresoAt && <span> · Se unió el {fechaCorta(m.ingresoAt)}</span>}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          {m.online ? (
                            <span className="font-semibold text-emerald-600">● En línea</span>
                          ) : m.ultimoVistoAt ? (
                            <>Visto por última vez el {fechaCorta(m.ultimoVistoAt)}</>
                          ) : (
                            'Ausente'
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                        {roleLabel[m.rol]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {historial.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
                Historial de miembros ({historial.length})
              </p>
              <ul className="space-y-2">
                {historial.map((h) => (
                  <li
                    key={`${h.usuario.id}-${h.salidaAt}`}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-3 opacity-80"
                  >
                    <Avatar
                      initials={h.usuario.iniciales}
                      color={h.usuario.avatarColor}
                      name={`${h.usuario.nombre} ${h.usuario.apellidos}`}
                      size="sm"
                      className="opacity-60 grayscale"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-700">
                        {h.usuario.nombre} {h.usuario.apellidos}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {roleLabel[h.rol]} · Entró el {fechaCorta(h.ingresoAt)} · Salió el{' '}
                        {fechaCorta(h.salidaAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!selectedBoardId && myBoards.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-300 bg-ink-50 py-10 text-center">
          <Users className="mb-2 h-8 w-8 text-ink-300" />
          <p className="text-sm font-semibold text-ink-700">
            No administras ningún tablero
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Crea un tablero primero para poder invitar colaboradores.
          </p>
        </div>
      )}
    </Modal>
  )
}
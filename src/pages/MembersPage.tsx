import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  MessageSquare,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import Avatar from '../components/Avatar'
import { useUiStore } from '../store/uiStore'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'

const roles = ['Miembro', 'Editor', 'Solo lectura', 'Administrador']

const pendingInvites = [
  { id: 'p1', color: '#0ea5e9', initials: 'S', name: 'Sandra Peña', email: 'sandra@empresa.com', role: 'Editor', time: 'Hace 2 h' },
  { id: 'p2', color: '#f43f5e', initials: 'D', name: 'Diego Ramírez', email: 'diego@empresa.com', role: 'Miembro', time: 'Hace 1 día' },
]

export default function MembersPage() {
  const openModal = useUiStore((s) => s.openModal)
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const contacts = useChatStore((s) => s.contacts)
  const loadContacts = useChatStore((s) => s.loadContacts)
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({})

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  const online = contacts.filter((p) => p.online).length

  const stats = [
    { icon: Users, label: 'Miembros totales', value: String(contacts.length), color: '#6366f1', bg: '#eef2ff' },
    { icon: UserCheck, label: 'En línea ahora', value: String(online), color: '#10b981', bg: '#d1fae5' },
    { icon: UserPlus, label: 'Invitaciones pendientes', value: String(pendingInvites.length), color: '#f59e0b', bg: '#fef3c7' },
  ]

  return (
    <div className="mx-auto max-w-4xl pb-4">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Miembros</h1>
          <p className="mt-1 text-sm text-ink-500">
            Equipo de TaskFlow · {contacts.length} personas colaboran en tus tableros.
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

      {/* Invitaciones pendientes */}
      {pendingInvites.length > 0 && (
        <section className="mb-6">
          <div className="mb-2.5 flex items-center gap-2">
            <h2 className="text-sm font-bold text-ink-900">Invitaciones pendientes</h2>
            <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
              {pendingInvites.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingInvites.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3.5"
              >
                <Avatar initials={p.initials} color={p.color} name={p.name} size="sm" className="opacity-60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{p.name}</p>
                  <p className="truncate text-xs text-ink-400">
                    {p.email} · invitado hace {p.time.replace('Hace ', '')} como {p.role}
                  </p>
                </div>
                <span className="rounded-md bg-surface px-2.5 py-1 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
                  Pendiente
                </span>
                <button type="button" className="btn-ghost px-3 py-1.5 text-xs">
                  Reenviar
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-100 hover:text-ink-600"
                  aria-label="Cancelar invitación"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Miembros actuales */}
      <div className="mb-2.5 flex items-center gap-2">
        <h2 className="text-sm font-bold text-ink-900">Miembros actuales</h2>
        <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
          {contacts.length}
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-surface py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
            <Users className="h-7 w-7" />
          </span>
          <p className="font-semibold text-ink-800">Sin compañeros de tablero</p>
          <p className="mt-1 text-sm text-ink-400">
            Comparte un tablero para ver aquí a tu equipo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
          <ul>
            {contacts.map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-ink-50 ${
                  i > 0 ? 'border-t border-ink-100' : ''
                }`}
              >
                <Avatar
                  initials={p.iniciales}
                  color={p.avatarColor}
                  name={`${p.nombre} ${p.apellidos}`}
                  online={p.online}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {p.nombre} {p.apellidos}
                    </p>
                    {p.id === me?.id && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                        TÚ
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-400">{p.email}</p>
                </div>

                <span
                  className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold sm:flex ${
                    p.online ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${p.online ? 'bg-emerald-500' : 'bg-ink-300'}`}
                  />
                  {p.online ? 'En línea' : 'Ausente'}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/mensajes?usuarioId=${p.id}`)}
                  className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-brand-50 hover:text-brand-600"
                  aria-label={`Chatear con ${p.nombre}`}
                  title="Enviar mensaje"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>

                <div className="relative">
                  <select
                    value={memberRoles[p.id] ?? 'Miembro'}
                    onChange={(e) => setMemberRoles((r) => ({ ...r, [p.id]: e.target.value }))}
                    className="cursor-pointer appearance-none rounded-lg border border-ink-200 bg-surface py-1.5 pr-7 pl-3 text-xs font-medium text-ink-700 outline-none transition focus:border-brand-400"
                  >
                    {roles.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                </div>

                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-100 hover:text-ink-600"
                  aria-label={`Opciones de ${p.nombre}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-ink-400">
        Los invitados recibirán un correo con el enlace para unirse al espacio TaskFlow de tu equipo.
      </p>
    </div>
  )
}
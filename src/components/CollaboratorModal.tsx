import { useMemo, useState } from 'react'
import { Check, ChevronDown, Copy, Mail, Search, Send, UserPlus, Users } from 'lucide-react'
import Avatar from './Avatar'
import Modal from './Modal'
import type { Person } from '../data/mock'

type Props = {
  team: Person[]
  onClose: () => void
}

const roles = ['Miembro', 'Editor', 'Solo lectura', 'Administrador']

export default function CollaboratorModal({ team, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<string[]>(['u1', 'u2', 'u3'])
  const [sent, setSent] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return team
    return team.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    )
  }, [query, team])

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const copyLink = () => {
    navigator.clipboard?.writeText('https://taskflow.app/invite/abc123')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      title="Añadir colaboradores"
      subtitle="Invita a tu equipo a colaborar en el tablero «App móvil»."
      icon={<UserPlus className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <p className="text-xs text-ink-500">
            {selected.length} colaborador{selected.length !== 1 && 'es'} seleccionado{selected.length !== 1 && 's'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() =>
                setSent((s) => ({
                  ...s,
                  ...Object.fromEntries(selected.map((id) => [id, true])),
                }))
              }
              disabled={selected.length === 0}
              className="btn-primary"
            >
              <Send className="h-4 w-4" />
              Enviar invitaciones
            </button>
          </div>
        </>
      }
    >
      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="input pl-10"
          autoFocus
        />
      </div>

      {/* Invitar por correo */}
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
            onKeyDown={(e) => e.key === 'Enter' && setEmail('')}
            placeholder="correo@empresa.com"
            className="input"
          />
          <button
            type="button"
            onClick={() => email.trim() && setEmail('')}
            disabled={!email.trim()}
            className="btn-primary shrink-0"
          >
            <Send className="h-4 w-4" />
            Invitar
          </button>
        </div>
      </div>

      {/* Enlace de invitación */}
      <button
        type="button"
        onClick={copyLink}
        className="mb-5 flex w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-left transition hover:bg-brand-100"
      >
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <Users className="h-3.5 w-3.5" />
            Compartir enlace de invitación
          </p>
          <p className="mt-0.5 truncate text-xs text-brand-500">
            taskflow.app/invite/abc123
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-brand-700">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </span>
      </button>

      {/* Personas */}
      <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
        Miembros del equipo ({filtered.length})
      </p>
      <ul className="space-y-2">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id)
          const isSent = sent[p.id]
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                isSelected ? 'border-brand-200 bg-brand-50/50' : 'border-ink-200 bg-surface'
              }`}
            >
              <Avatar initials={p.initials} color={p.color} name={p.name} online={p.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-800">
                  {p.name}
                  {p.online && (
                    <span className="ml-2 text-[10px] font-bold text-emerald-600">
                      ● En línea
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-400">{p.email}</p>
              </div>

              {isSent ? (
                <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  Enviado
                </span>
              ) : (
                <div className="relative">
                  <select
                    value={isSelected ? p.role : roles[0]}
                    disabled={!isSelected}
                    className="cursor-pointer appearance-none rounded-lg border border-ink-200 bg-surface py-1.5 pr-8 pl-3 text-xs font-medium text-ink-700 outline-none transition focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400"
                  >
                    {roles.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  toggle(p.id)
                  setSent((s) => ({ ...s, [p.id]: false }))
                }}
                className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {isSelected ? 'Quitar' : 'Añadir'}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
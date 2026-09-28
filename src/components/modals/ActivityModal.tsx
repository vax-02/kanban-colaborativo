import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  Flag,
  LoaderCircle,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import Modal from '../Modal'
import Avatar from '../Avatar'
import { api } from '../../lib/api'
import { useBoardsStore } from '../../store/boardsStore'
import type { ActividadDto, TipoActividad } from '../../lib/types'

type Props = { onClose: () => void }

type Filtro =
  | 'all'
  | 'move'
  | 'prio'
  | 'create'
  | 'member'

const tipoFiltro: Record<Filtro, TipoActividad[]> = {
  all: [],
  move: ['TAREA_MOVIDA'],
  prio: ['PRIORIDAD_CAMBIADA'],
  create: ['TABLERO_CREADO', 'TAREA_CREADA', 'TAREA_ELIMINADA'],
  member: ['MIEMBRO_INVITADO', 'MIEMBRO_UNIDO', 'MIEMBRO_REMOVIDO'],
}

function iconoTipo(tipo: TipoActividad) {
  switch (tipo) {
    case 'TABLERO_CREADO':
    case 'TAREA_CREADA':
      return { Icon: Clock, color: '#6366f1' }
    case 'TAREA_MOVIDA':
      return { Icon: CheckCircle2, color: '#f59e0b' }
    case 'TAREA_ELIMINADA':
      return { Icon: Trash2, color: '#ef4444' }
    case 'PRIORIDAD_CAMBIADA':
      return { Icon: Flag, color: '#8b5cf6' }
    case 'MIEMBRO_INVITADO':
      return { Icon: UserPlus, color: '#0ea5e9' }
    case 'MIEMBRO_UNIDO':
      return { Icon: UserCheck, color: '#10b981' }
    case 'MIEMBRO_REMOVIDO':
      return { Icon: UserMinus, color: '#ef4444' }
  }
}

function marcaTiempo(iso: string) {
  const fecha = new Date(iso)
  const diffMs = Date.now() - fecha.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'Ahora mismo'
  if (min < 60) return `Hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7) return `Hace ${dias} día${dias === 1 ? '' : 's'}`
  return fecha.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const filtros: { value: Filtro; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'move', label: 'Movimientos' },
  { value: 'prio', label: 'Prioridad' },
  { value: 'create', label: 'Creaciones' },
  { value: 'member', label: 'Miembros' },
]

export default function ActivityModal({ onClose }: Props) {
  const { boardId } = useParams()
  const boards = useBoardsStore((s) => s.boards)
  const [filter, setFilter] = useState<Filtro>('all')
  const [activities, setActivities] = useState<ActividadDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!boardId) return
    let active = true
    api<{ actividades: ActividadDto[] }>(`/boards/${boardId}/actividades`)
      .then((res) => {
        if (active) setActivities(res.actividades)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar la actividad del tablero.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [boardId])

  const boardName = boards.find((b) => b.id === boardId)?.nombre

  const list = useMemo(() => {
    if (filter === 'all') return activities
    const tipos = new Set(tipoFiltro[filter])
    return activities.filter((a) => tipos.has(a.tipo))
  }, [activities, filter])

  return (
    <Modal
      title="Actividad reciente"
      subtitle={
        boardName
          ? `Cambios registrados en «${boardName}».`
          : 'Cambios registrados en este tablero.'
      }
      icon={<Clock className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {/* Filtros rápidos */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {filtros.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.value
                ? 'bg-ink-900 text-ink-50'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Cargando actividad…
        </div>
      ) : error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600">
          {error}
        </p>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">
          No hay actividad de este tipo todavía.
        </p>
      ) : (
        <ol className="relative space-y-5 pl-2">
          <span className="absolute top-1 left-[26px] h-[calc(100%-1rem)] w-px bg-ink-200" />
          {list.map((a) => {
            const meta = iconoTipo(a.tipo)
            const persona = a.autor ?? a.usuario
            return (
              <li key={a.id} className="relative flex items-start gap-3">
                <span
                  className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-50 ring-1"
                  style={{ color: meta.color, borderColor: meta.color }}
                >
                  <meta.Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pb-1">
                  {persona ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        initials={persona.iniciales}
                        color={persona.avatarColor}
                        name={`${persona.nombre} ${persona.apellidos}`}
                        size="xs"
                        className="scale-90"
                      />
                      <p className="text-sm text-ink-700">
                        <span className="font-semibold text-ink-900">
                          {persona.nombre} {persona.apellidos}
                        </span>{' '}
                        {a.detalle}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-700">{a.detalle}</p>
                  )}
                  <p className="mt-1 pl-11 text-xs text-ink-400">{marcaTiempo(a.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Modal>
  )
}
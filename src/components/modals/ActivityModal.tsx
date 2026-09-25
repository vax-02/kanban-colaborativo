import { useState } from 'react'
import { CheckCircle2, CircleDot, Clock, MessageSquare, UserPlus } from 'lucide-react'
import Modal from '../Modal'
import Avatar from '../Avatar'

type Props = { onClose: () => void }

type Activity = {
  id: string
  kind: 'move' | 'create' | 'comment' | 'member' | 'done'
  person: { name: string; initials: string; color: string }
  text: string
  time: string
}

const activities: Activity[] = [
  { id: 'a1', kind: 'move', person: { name: 'Ana García', initials: 'AG', color: '#6366f1' }, text: 'movió «Implementar drag & drop» a En progreso', time: 'Hace 5 min' },
  { id: 'a2', kind: 'comment', person: { name: 'María López', initials: 'ML', color: '#10b981' }, text: 'comentó en «Pruebas de carga en el servidor»', time: 'Hace 14 min' },
  { id: 'a3', kind: 'member', person: { name: 'Laura Torres', initials: 'LT', color: '#8b5cf6' }, text: 'se unió al tablero «Design system»', time: 'Hace 32 min' },
  { id: 'a4', kind: 'create', person: { name: 'Carlos Ruiz', initials: 'CR', color: '#f59e0b' }, text: 'creó la tarjeta «Revisar sprint backlog»', time: 'Hace 1 h' },
  { id: 'a5', kind: 'done', person: { name: 'Pedro Sánchez', initials: 'PS', color: '#ef4444' }, text: 'completó «Configurar CI/CD en GitHub Actions»', time: 'Hace 2 h' },
  { id: 'a6', kind: 'move', person: { name: 'Ana García', initials: 'AG', color: '#6366f1' }, text: 'movió «Auditoría de accesibilidad» a Terminado', time: 'Hace 3 h' },
]

const typeMeta = {
  move: { Icon: CircleDot, color: '#f59e0b' },
  create: { Icon: Clock, color: '#6366f1' },
  comment: { Icon: MessageSquare, color: '#0ea5e9' },
  member: { Icon: UserPlus, color: '#8b5cf6' },
  done: { Icon: CheckCircle2, color: '#10b981' },
} as const

type Filter = 'all' | 'move' | 'create' | 'comment' | 'member' | 'done'

export default function ActivityModal({ onClose }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const list = filter === 'all' ? activities : activities.filter((a) => a.kind === filter)

  return (
    <Modal
      title="Actividad reciente"
      subtitle="Cambios registrados en «App móvil» y tableros del equipo."
      icon={<Clock className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <p className="w-full text-center text-xs text-ink-400">
          ¿Quieres exportar el historial completo?
          <button
            type="button"
            className="ml-1 cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
          >
            Seguir al historial
          </button>
        </p>
      }
    >
      {/* Filtros rápidos */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ['all', 'Todo'],
            ['move', 'Movimientos'],
            ['comment', 'Comentarios'],
            ['create', 'Creaciones'],
            ['member', 'Miembros'],
            ['done', 'Completadas'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === key
                ? 'bg-ink-900 text-ink-50'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Línea de tiempo */}
      <ol className="relative space-y-5 pl-2">
        <span className="absolute top-1 left-[26px] h-[calc(100%-1rem)] w-px bg-ink-200" />
        {list.map((a) => {
          const meta = typeMeta[a.kind]
          return (
            <li key={a.id} className="relative flex items-start gap-3">
              <span
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-50 ring-1"
                style={{ color: meta.color, borderColor: meta.color }}
              >
                <meta.Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    initials={a.person.initials}
                    color={a.person.color}
                    name={a.person.name}
                    size="xs"
                    className="scale-90"
                  />
                  <p className="text-sm text-ink-700">
                    <span className="font-semibold text-ink-900">{a.person.name}</span>{' '}
                    {a.text}
                  </p>
                </div>
                <p className="mt-1 pl-11 text-xs text-ink-400">{a.time}</p>
              </div>
            </li>
          )
        })}
        {list.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-400">
            No hay actividad de este tipo todavía.
          </li>
        )}
      </ol>
    </Modal>
  )
}
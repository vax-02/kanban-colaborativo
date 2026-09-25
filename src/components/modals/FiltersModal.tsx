import { useState } from 'react'
import { Check, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import Modal from '../Modal'
import Avatar from '../Avatar'
import { team } from '../../data/mock'

type Props = { onClose: () => void }

const labelOptions = [
  { text: 'Frontend', color: '#6366f1' },
  { text: 'Backend', color: '#ef4444' },
  { text: 'Diseño', color: '#8b5cf6' },
  { text: 'QA', color: '#10b981' },
  { text: 'DevOps', color: '#0ea5e9' },
]

const priorities = ['Alta', 'Media', 'Baja']

function ChipFilter({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
      }`}
      style={!active && color ? { backgroundColor: `${color}18`, color } : undefined}
    >
      {label}
      {active && <Check className="ml-1 inline h-3 w-3" strokeWidth={3} />}
    </button>
  )
}

export default function FiltersModal({ onClose }: Props) {
  const [members, setMembers] = useState<string[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [prio, setPrio] = useState<string | null>(null)
  const [due, setDue] = useState('any')
  const [showDone, setShowDone] = useState(false)

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const clear = () => {
    setMembers([])
    setLabels([])
    setPrio(null)
    setDue('any')
    setShowDone(false)
  }

  const activeCount =
    members.length + labels.length + (prio ? 1 : 0) + (due !== 'any' ? 1 : 0) + (showDone ? 1 : 0)

  return (
    <Modal
      title="Filtrar tareas"
      subtitle="Aplica filtros para enfocar el tablero."
      icon={<SlidersHorizontal className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={clear}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="button" onClick={onClose} className="btn-primary">
              Aplicar {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        {/* Miembros */}
        <div>
          <label className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
            Miembros
          </label>
          <div className="flex flex-wrap gap-2">
            {team.map((p) => (
              <ChipFilter
                key={p.id}
                label={p.name.split(' ')[0]}
                active={members.includes(p.id)}
                onClick={() => toggle(members, setMembers, p.id)}
              />
            ))}
          </div>
        </div>

        {/* Etiquetas */}
        <div>
          <label className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
            Etiquetas
          </label>
          <div className="flex flex-wrap gap-2">
            {labelOptions.map((l) => (
              <ChipFilter
                key={l.text}
                label={l.text}
                color={l.color}
                active={labels.includes(l.text)}
                onClick={() => toggle(labels, setLabels, l.text)}
              />
            ))}
          </div>
        </div>

        {/* Prioridad */}
        <div>
          <label className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
            Prioridad
          </label>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <ChipFilter
                key={p}
                label={p}
                active={prio === p}
                onClick={() => setPrio(prio === p ? null : p)}
              />
            ))}
          </div>
        </div>

        {/* Vencimiento */}
        <div>
          <label className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
            Vencimiento
          </label>
          <div className="relative w-full max-w-[220px]">
            <select
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-ink-200 bg-surface py-2 pr-8 pl-3 text-sm text-ink-700 outline-none focus:border-brand-400"
            >
              <option value="any">Cualquier fecha</option>
              <option value="today">Vence hoy</option>
              <option value="week">Esta semana</option>
              <option value="overdue">Vencidas</option>
              <option value="none">Sin fecha</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
          </div>
        </div>

        {/* Terminadas */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-200 bg-ink-50 p-3">
          <span>
            <p className="text-sm font-semibold text-ink-800">Tareas terminadas</p>
            <p className="text-xs text-ink-400">Ocultar o mostrar la columna Terminado</p>
          </span>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
              showDone ? 'bg-brand-600' : 'bg-ink-300'
            }`}
            aria-label="Alternar tareas terminadas"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                showDone ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Vista previa de miembros */}
      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
        <span className="text-xs text-ink-400">Resultado previsto</span>
        <div className="flex items-center gap-2">
          <Avatar initials="AG" color="#6366f1" name="Ana García" size="xs" />
          <Avatar initials="CR" color="#f59e0b" name="Carlos Ruiz" size="xs" />
          <span className="text-xs text-ink-400">6 tareas coinciden</span>
        </div>
      </div>
    </Modal>
  )
}
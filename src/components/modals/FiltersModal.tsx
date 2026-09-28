import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ChevronDown, LoaderCircle, RotateCcw, SlidersHorizontal } from 'lucide-react'
import Modal from '../Modal'
import Avatar from '../Avatar'
import { useBoardsStore } from '../../store/boardsStore'
import { useFiltersStore } from '../../store/filtersStore'
import {
  countActiveFilters,
  isDoneColumn,
  taskMatchesFilters,
  type DueFilter,
  type TaskFilters,
} from '../../lib/filters'
import type { BoardDetailDto, Prioridad } from '../../lib/types'

type Props = { onClose: () => void }

const priorities: { value: Prioridad; label: string }[] = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
]

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
  const { boardId } = useParams()
  const getBoard = useBoardsStore((s) => s.getBoard)
  const setFilters = useFiltersStore((s) => s.setFilters)
  const stored = useFiltersStore((s) => s.filters)
  const isStored = boardId !== undefined && stored.boardId === boardId

  const [board, setBoard] = useState<BoardDetailDto | null>(null)
  const [members, setMembers] = useState<string[]>(isStored ? stored.members : [])
  const [labels, setLabels] = useState<string[]>(isStored ? stored.labels : [])
  const [prio, setPrio] = useState<Prioridad | null>(isStored ? stored.prio : null)
  const [due, setDue] = useState<DueFilter>(isStored ? stored.due : 'any')
  const [showDone, setShowDone] = useState(isStored ? stored.showDone : true)

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
    return () => {
      active = false
    }
  }, [boardId, getBoard])

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const clear = () => {
    setMembers([])
    setLabels([])
    setPrio(null)
    setDue('any')
    setShowDone(true)
  }

  const local: TaskFilters = {
    boardId: boardId ?? null,
    members,
    labels,
    prio,
    due,
    showDone,
  }

  const matchedTasks = useMemo(() => {
    if (!board) return 0
    const filtro: TaskFilters = { boardId: board.id, members, labels, prio, due, showDone }
    return board.columnas
      .filter((c) => showDone || !isDoneColumn(c.titulo))
      .reduce((acc, c) => acc + c.tareas.filter((t) => taskMatchesFilters(t, filtro)).length, 0)
  }, [board, members, labels, prio, due, showDone])

  const selectedMembers = useMemo(
    () => (board ? board.miembros.filter((m) => members.includes(m.id)) : []),
    [board, members],
  )

  const activeCount = countActiveFilters(local)

  const apply = () => {
    if (boardId) {
      setFilters(boardId, { members, labels, prio, due, showDone })
    }
    onClose()
  }

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
            <button type="button" onClick={apply} className="btn-primary">
              Aplicar {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </>
      }
    >
      {!board ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Cargando opciones del tablero…
        </div>
      ) : (
        <div className="space-y-5">
          {/* Miembros */}
          <div>
            <label className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
              Miembros
            </label>
            <div className="flex flex-wrap gap-2">
              {board.miembros.length === 0 && (
                <span className="text-xs text-ink-400">Sin miembros todavía.</span>
              )}
              {board.miembros.map((m) => (
                <ChipFilter
                  key={m.id}
                  label={m.nombre}
                  active={members.includes(m.id)}
                  onClick={() => toggle(members, setMembers, m.id)}
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
              {board.etiquetas.length === 0 && (
                <span className="text-xs text-ink-400">Sin etiquetas todavía.</span>
              )}
              {board.etiquetas.map((l) => (
                <ChipFilter
                  key={l.id}
                  label={l.texto}
                  color={l.color}
                  active={labels.includes(l.texto)}
                  onClick={() => toggle(labels, setLabels, l.texto)}
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
                  key={p.value}
                  label={p.label}
                  active={prio === p.value}
                  onClick={() => setPrio(prio === p.value ? null : p.value)}
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
                onChange={(e) => setDue(e.target.value as DueFilter)}
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
              aria-label="Mostrar u ocultar la columna Terminado"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  showDone ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      )}

      {/* Vista previa de miembros */}
      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
        <span className="text-xs text-ink-400">Resultado previsto</span>
        <div className="flex items-center gap-2">
          {selectedMembers.length > 0 ? (
            selectedMembers.slice(0, 3).map((m) => (
              <Avatar
                key={m.id}
                initials={m.iniciales}
                color={m.avatarColor}
                name={`${m.nombre} ${m.apellidos}`}
                size="xs"
              />
            ))
          ) : (
            <Avatar initials="—" color="#94a3b8" size="xs" />
          )}
          <span className="text-xs text-ink-400">
            {board ? `${matchedTasks} ${matchedTasks === 1 ? 'tarea coincide' : 'tareas coinciden'}` : '—'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
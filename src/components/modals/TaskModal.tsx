import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  Flag,
  LoaderCircle,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useBoardsStore } from '../../store/boardsStore'
import type { BoardDetailDto, ChecklistDto, Prioridad, TaskDto } from '../../lib/types'
import Modal from '../Modal'
import Avatar from '../Avatar'

type Props = {
  boardId: string
  columnId: string
  taskId?: string
  onClose: () => void
}

type ChecklistRow = {
  key: number
  id?: string
  texto: string
  hecho: boolean
}

const LABEL_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899']

const PRIORIDAD_META: Record<Prioridad, string> = {
  ALTA: '#ef4444',
  MEDIA: '#f59e0b',
  BAJA: '#64748b',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-bold tracking-wider text-ink-400 uppercase">
      {children}
    </p>
  )
}

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : ''
}

export default function TaskModal({ boardId, columnId, taskId, onClose }: Props) {
  const getBoard = useBoardsStore((s) => s.getBoard)
  const createTask = useBoardsStore((s) => s.createTask)
  const updateTask = useBoardsStore((s) => s.updateTask)
  const deleteTask = useBoardsStore((s) => s.deleteTask)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardDetailDto | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA')
  const [fecha, setFecha] = useState('')
  const [checklist, setChecklist] = useState<ChecklistRow[]>([])
  const [asignados, setAsignados] = useState<string[]>([])
  const [etiquetasSel, setEtiquetasSel] = useState<{ texto: string; color: string }[]>([])
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('')

  const [columnaSel, setColumnaSel] = useState(columnId)

  useEffect(() => {
    let active = true

    const loadTask = async () => {
      try {
        setBoard(await getBoard(boardId))
        let loaded: TaskDto | null = null
        if (taskId) {
          const res = await api<{ task: TaskDto }>(`/tasks/${taskId}`)
          loaded = res.task
        }
        if (!active) return
        if (loaded) {
          setTitulo(loaded.titulo)
          setDescripcion(loaded.descripcion ?? '')
          setPrioridad(loaded.prioridad)
          setFecha(toDateInput(loaded.fechaVencimiento))
          setChecklist(
            loaded.checklist.map((c: ChecklistDto) => ({
              key: c.posicion,
              id: c.id,
              texto: c.texto,
              hecho: c.hecho,
            })),
          )
          setAsignados(loaded.asignaciones.map((a) => a.id))
          setEtiquetasSel(loaded.etiquetas.map((e) => ({ texto: e.texto, color: e.color })))
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar la tarjeta')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTask()
    return () => {
      active = false
    }
  }, [boardId, taskId, getBoard])

  const columna = useMemo(
    () => board?.columnas.find((c) => c.id === columnaSel),
    [board, columnaSel],
  )

  const doneCount = checklist.filter((c) => c.hecho).length
  const canSave = titulo.trim().length > 0 && !saving

  const toggleAsignado = (id: string) =>
    setAsignados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const toggleEtiqueta = (texto: string, color: string) =>
    setEtiquetasSel((prev) => {
      const exists = prev.some((e) => e.texto.toLowerCase() === texto.toLowerCase())
      return exists
        ? prev.filter((e) => e.texto.toLowerCase() !== texto.toLowerCase())
        : [...prev, { texto, color }]
    })

  const addEtiqueta = () => {
    const t = nuevaEtiqueta.trim()
    if (!t) return
    const exists = etiquetasSel.some((e) => e.texto.toLowerCase() === t.toLowerCase())
    const alreadyBoard = board?.etiquetas.some(
      (e) => e.texto.toLowerCase() === t.toLowerCase(),
    )
    if (!exists && !alreadyBoard) {
      setEtiquetasSel((prev) => [
        ...prev,
        { texto: t, color: LABEL_COLORS[prev.length % LABEL_COLORS.length] },
      ])
    }
    setNuevaEtiqueta('')
  }

  const updateCheck = (i: number, patch: Partial<ChecklistRow>) =>
    setChecklist((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  const addCheck = () =>
    setChecklist((prev) => {
      const lastKey = prev.length ? prev[prev.length - 1].key : 0
      return [...prev, { key: lastKey + 1, texto: '', hecho: false }]
    })

  const removeCheck = (i: number) => setChecklist((prev) => prev.filter((_, idx) => idx !== i))

  const guardar = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      if (taskId) {
        await updateTask(taskId, {
          columnaId: columnaSel,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          prioridad,
          fechaVencimiento: fecha ? new Date(`${fecha}T00:00:00`).toISOString() : null,
          etiquetas: etiquetasSel,
          asignados,
          checklist: checklist
            .filter((c) => c.texto.trim())
            .map((c) => ({ texto: c.texto.trim(), hecho: c.hecho })),
        })
      } else {
        await createTask({
          columnaId: columnId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          prioridad,
          fechaVencimiento: fecha ? new Date(`${fecha}T00:00:00`).toISOString() : null,
          etiquetas: etiquetasSel,
          asignados,
          checklist: checklist.filter((c) => c.texto.trim()).map((c) => c.texto.trim()),
        })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la tarjeta')
      setSaving(false)
    }
  }

  const eliminar = async () => {
    if (!taskId) return onClose()
    if (!window.confirm('¿Eliminar esta tarjeta permanentemente?')) return
    setSaving(true)
    try {
      await deleteTask(taskId)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la tarjeta')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Modal title="Tarjeta" onClose={onClose}>
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          Cargando tarjeta…
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title={taskId ? 'Detalle de la tarjeta' : 'Nueva tarjeta'}
      subtitle={
        columna
          ? taskId
            ? `Columna «${columna.titulo}»`
            : `Se creará en «${columna.titulo}»`
          : undefined
      }
      icon={taskId ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          {error && <p className="mr-auto text-xs font-medium text-rose-500">{error}</p>}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: columna?.color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: columna?.color }}
              />
              {columna?.titulo}
            </span>
            {taskId && (
              <button
                type="button"
                onClick={eliminar}
                disabled={saving}
                className="cursor-pointer text-ink-400 transition hover:text-rose-500 disabled:opacity-40"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!canSave}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Guardando…' : taskId ? 'Guardar cambios' : 'Crear tarjeta'}
            </button>
          </div>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_230px]">
        {/* ==== Contenido principal ==== */}
        <div className="space-y-5">
          <div>
            <SectionLabel>Título</SectionLabel>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              className="input"
            />
          </div>

          <div>
            <SectionLabel>Descripción</SectionLabel>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Añade más contexto a la tarjeta…"
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <SectionLabel>Checklist</SectionLabel>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                {doneCount}/{checklist.length}
              </span>
              <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(doneCount / Math.max(checklist.length, 1)) * 100}%` }}
                />
              </div>
            </div>

            {checklist.length > 0 && (
              <ul className="space-y-2">
                {checklist.map((c, i) => (
                  <li key={c.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCheck(i, { hecho: !c.hecho })}
                      className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border transition"
                      style={{
                        borderColor: c.hecho ? '#10b981' : '#cbd5e1',
                        backgroundColor: c.hecho ? '#10b981' : 'white',
                      }}
                      aria-label={c.hecho ? 'Desmarcar' : 'Marcar'}
                    >
                      <span className={c.hecho ? 'flex h-4 w-4 items-center justify-center' : 'h-4 w-4'}>
                        {c.hecho && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                    </button>
                    <input
                      value={c.texto}
                      onChange={(e) => updateCheck(i, { texto: e.target.value })}
                      placeholder="Ítem del checklist"
                      className="input flex-1 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeCheck(i)}
                      className="cursor-pointer text-ink-300 transition hover:text-rose-500"
                      aria-label="Quitar ítem"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={addCheck}
              className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir ítem
            </button>
          </div>
        </div>

        {/* ==== Panel lateral ==== */}
        <div className="space-y-4">
          <div>
            <SectionLabel>Estado</SectionLabel>
            <div className="space-y-1">
              {board?.columnas.map((c) => {
                const activa = c.id === columnaSel
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColumnaSel(c.id)}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                      activa
                        ? 'bg-ink-100 text-ink-900'
                        : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="flex-1 truncate text-left">{c.titulo}</span>
                    {activa && <Check className="h-3.5 w-3.5 text-brand-600" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Asignados</SectionLabel>
            <div className="space-y-1.5">
              {board?.miembros.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-ink-50"
                >
                  <input
                    type="checkbox"
                    checked={asignados.includes(m.id)}
                    onChange={() => toggleAsignado(m.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                      asignados.includes(m.id) ? 'border-brand-600 bg-brand-600' : 'border-ink-300'
                    }`}
                  >
                    {asignados.includes(m.id) && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <Avatar initials={m.iniciales} color={m.avatarColor} size="xs" />
                  <span className="flex-1 text-xs font-medium text-ink-700">
                    {m.nombre}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Vencimiento</SectionLabel>
            <button
              type="button"
              onClick={() => (document.getElementById('task-due') as HTMLInputElement | null)?.showPicker()}
              className="btn-ghost w-full justify-between px-3 py-2 text-xs"
            >
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {fecha ? fecha : 'Sin fecha'}
              </span>
              <input
                id="task-due"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="sr-only"
              />
            </button>
            {fecha && (
              <button
                type="button"
                onClick={() => setFecha('')}
                className="mt-1 cursor-pointer text-[11px] font-medium text-ink-400 hover:text-rose-500"
              >
                Quitar fecha
              </button>
            )}
          </div>

          <div>
            <SectionLabel>Etiquetas</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {board?.etiquetas.map((l) => {
                const activa = etiquetasSel.some(
                  (e) => e.texto.toLowerCase() === l.texto.toLowerCase(),
                )
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleEtiqueta(l.texto, l.color)}
                    className={`cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      activa
                        ? 'ring-2 ring-ink-400 ring-offset-1'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: `${l.color}18`, color: l.color }}
                  >
                    {l.texto}
                  </button>
                )
              })}
              {etiquetasSel
                .filter((e) => !board?.etiquetas.some((l) => l.texto.toLowerCase() === e.texto.toLowerCase()))
                .map((e) => (
                  <button
                    key={e.texto}
                    type="button"
                    onClick={() => toggleEtiqueta(e.texto, e.color)}
                    className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold ring-2 ring-ink-400 ring-offset-1"
                    style={{ backgroundColor: `${e.color}18`, color: e.color }}
                  >
                    {e.texto}
                  </button>
                ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              <input
                value={nuevaEtiqueta}
                onChange={(e) => setNuevaEtiqueta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addEtiqueta()
                  }
                }}
                placeholder="Nueva etiqueta…"
                className="input flex-1 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={addEtiqueta}
                className="rounded-lg border border-ink-200 px-2 text-ink-500 transition hover:border-brand-300 hover:text-brand-600"
                aria-label="Añadir etiqueta"
              >
                <Tag className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <SectionLabel>Prioridad</SectionLabel>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-ink-100 p-1">
              {(['ALTA', 'MEDIA', 'BAJA'] as Prioridad[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrioridad(p)}
                  className={`flex cursor-pointer items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition ${
                    prioridad === p ? 'bg-surface text-ink-900 shadow-sm' : 'text-ink-500'
                  }`}
                >
                  <Flag className="h-3 w-3" style={{ color: PRIORIDAD_META[p] }} />
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
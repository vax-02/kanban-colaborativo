import { useState, type DragEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  CircleDot,
  GripVertical,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import type { Column, Task } from '../data/mock'

type Props = {
  initialColumns: Column[]
  onOpenTask?: (taskId: string, columnId: string) => void
  onNewTask?: (columnId: string) => void
  onMoveTask?: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void
  onNewColumn?: () => void
  onRenameColumn?: (columnId: string, titulo: string) => void
  onDeleteColumn?: (columnId: string) => void
  onReorderColumns?: (ids: string[]) => void
  canEdit?: boolean
}

type StatusIconProps = {
  column: Column
  className?: string
  strokeWidth?: number
}

function StatusIcon({ column, className, strokeWidth = 2 }: StatusIconProps) {
  const props = { className, strokeWidth, style: { color: column.color } }
  const title = column.title.toLowerCase()
  if (title.includes('pendiente')) return <CircleDashed {...props} />
  if (title.includes('progreso')) return <CircleDot {...props} />
  if (title.includes('revisi')) return <CircleAlert {...props} />
  if (title.includes('termin')) return <CheckCircle2 {...props} />
  return <CircleDot {...props} />
}

type DragHandlers = {
  onDragStart: (e: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
}

function TaskCard({
  task,
  column,
  onOpen,
  drag,
  isDragging,
  insertTop,
  insertBottom,
}: {
  task: Task
  column: Column
  onOpen: () => void
  drag?: DragHandlers
  isDragging: boolean
  insertTop: boolean
  insertBottom: boolean
}) {
  return (
    <article
      draggable={!!drag}
      onClick={onOpen}
      onDragStart={drag?.onDragStart}
      onDragEnd={drag?.onDragEnd}
      onDragOver={drag?.onDragOver}
      onDrop={drag?.onDrop}
      className={`group cursor-pointer rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md ${
        isDragging ? 'opacity-40' : ''
      } ${insertTop ? 'border-t-2 border-t-amber-400' : ''} ${
        insertBottom ? 'border-b-2 border-b-amber-400' : ''
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <StatusIcon column={column} className="h-4 w-4" strokeWidth={2.5} />
        </span>
        {drag && (
          <span
            title="Arrastrar para mover"
            className="cursor-grab opacity-0 transition group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4 text-ink-300" />
          </span>
        )}
      </div>

      <h3 className="mb-0.5 text-sm leading-snug font-semibold text-ink-800">
        {task.title}
      </h3>
      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-ink-500">
          {task.description}
        </p>
      )}

      {/* Etiquetas */}
      {task.labels.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {task.labels.map((l) => (
            <span
              key={l.text}
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `${l.color}18`, color: l.color }}
            >
              {l.text}
            </span>
          ))}
        </div>
      )}

      {/* Checklist */}
      {task.checklist && (
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${(task.checklist.done / task.checklist.total) * 100}%`,
              }}
            />
          </div>
          <span className="text-[11px] font-medium text-ink-500">
            {task.checklist.done}/{task.checklist.total}
          </span>
        </div>
      )}

      {/* Pie de tarjeta */}
      <div className="flex items-center gap-3 text-ink-400">
        <span
          className="flex items-center gap-1 text-[11px] font-medium"
          style={{ color: task.due === 'Hoy' ? '#ef4444' : undefined }}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {task.due}
        </span>

        {task.comments !== undefined && (
          <span className="flex items-center gap-1 text-[11px] font-medium">
            <MessageSquare className="h-3.5 w-3.5" />
            {task.comments}
          </span>
        )}
        {task.attachments !== undefined && (
          <span className="flex items-center gap-1 text-[11px] font-medium">
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachments}
          </span>
        )}

        <div className="ml-auto flex -space-x-1.5">
          {task.assignees.map((a) => (
            <span
              key={a.id}
              title={a.name}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-surface"
              style={{ backgroundColor: a.color }}
            >
              {a.initials}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function KanbanBoard({
  initialColumns,
  onOpenTask,
  onNewTask,
  onMoveTask,
  onNewColumn,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumns,
  canEdit = false,
}: Props) {
  const [dragging, setDragging] = useState<{ taskId: string; fromColumnId: string } | null>(null)
  const [over, setOver] = useState<{ columnId: string; index: number } | null>(null)
  const [draggingCol, setDraggingCol] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const startRename = (col: Column) => {
    setEditingId(col.id)
    setDraft(col.title)
  }

  const commitRename = (col: Column) => {
    const value = draft.trim()
    setEditingId(null)
    if (value && value !== col.title) onRenameColumn?.(col.id, value)
  }

  const handleColDragStart = (colId: string) => (e: DragEvent<HTMLElement>) => {
    setDraggingCol(colId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `columna:${colId}`)
  }

  const handleColDragOver = (colId: string) => (e: DragEvent<HTMLElement>) => {
    if (!draggingCol || draggingCol === colId) return
    e.preventDefault()
    e.stopPropagation()
    setOverCol(colId)
  }

  const handleColDrop = (colId: string) => (e: DragEvent<HTMLElement>) => {
    if (!draggingCol) return
    e.preventDefault()
    e.stopPropagation()
    const fromId = draggingCol
    setDraggingCol(null)
    setOverCol(null)
    if (fromId === colId) return
    const ids = initialColumns.map((c) => c.id)
    const next = ids.filter((cid) => cid !== fromId)
    next.splice(ids.indexOf(colId), 0, fromId)
    onReorderColumns?.(next)
  }

  const endColDrag = () => {
    setDraggingCol(null)
    setOverCol(null)
  }

  const handleDragStart = (taskId: string, fromColumnId: string) => (e: DragEvent<HTMLElement>) => {
    setDragging({ taskId, fromColumnId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragEnd = () => {
    setDragging(null)
    setOver(null)
  }

  const handleCardDragOver =
    (col: Column, index: number) => (e: DragEvent<HTMLElement>) => {
      if (!dragging || draggingCol) return
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      const before = e.clientY < rect.top + rect.height / 2
      setOver({ columnId: col.id, index: before ? index : index + 1 })
    }

  const handleCardDrop = (col: Column, index: number) => (e: DragEvent<HTMLElement>) => {
    if (!dragging || draggingCol) return
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const before = e.clientY < rect.top + rect.height / 2
    const toIndex = before ? index : index + 1
    setOver(null)
    onMoveTask?.(dragging.taskId, dragging.fromColumnId, col.id, toIndex)
    setDragging(null)
  }

  const handleColumnDragOver = (col: Column) => (e: DragEvent<HTMLElement>) => {
    if (!dragging || draggingCol) return
    e.preventDefault()
    setOver({ columnId: col.id, index: col.tasks.length })
  }

  const handleColumnDrop = (col: Column) => (e: DragEvent<HTMLElement>) => {
    if (!dragging || draggingCol) return
    e.preventDefault()
    onMoveTask?.(dragging.taskId, dragging.fromColumnId, col.id, col.tasks.length)
    setOver(null)
    setDragging(null)
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-2">
      {initialColumns.map((col) => {
        const isTarget = dragging !== null && over?.columnId === col.id
        const isColTarget = draggingCol !== null && overCol === col.id && draggingCol !== col.id
        const isEditing = editingId === col.id
        return (
          <section
            key={col.id}
            onDragOver={canEdit ? handleColDragOver(col.id) : undefined}
            onDrop={canEdit ? handleColDrop(col.id) : undefined}
            className={`flex min-w-[280px] flex-1 flex-col rounded-2xl bg-ink-100/70 transition ${
              isTarget ? 'bg-ink-100 ring-2 ring-brand-300/60' : ''
            } ${isColTarget ? 'ring-2 ring-brand-400' : ''} ${
              draggingCol === col.id ? 'opacity-50' : ''
            }`}
          >
            {/* Cabecera de columna */}
            <header className="flex items-center gap-1.5 px-3 pt-4 pb-2">
              {canEdit && (
                <span
                  draggable
                  onDragStart={handleColDragStart(col.id)}
                  onDragEnd={endColDrag}
                  title="Arrastra para mover la columna"
                  className="flex shrink-0 cursor-grab text-ink-300 transition hover:text-ink-500 active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
              )}
              <StatusIcon column={col} className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              {isEditing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitRename(col)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(col)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  maxLength={100}
                  className="min-w-0 flex-1 rounded-md border border-brand-300 bg-surface px-1.5 py-0.5 text-sm font-bold text-ink-700 outline-none"
                />
              ) : (
                <h2
                  onDoubleClick={() => canEdit && startRename(col)}
                  title={canEdit ? 'Doble clic para renombrar' : col.title}
                  className={`min-w-0 truncate text-sm font-bold text-ink-700 ${
                    canEdit ? 'cursor-text' : ''
                  }`}
                >
                  {col.title}
                </h2>
              )}
              <span className="shrink-0 rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                {col.tasks.length}
              </span>
              <div className="ml-auto flex shrink-0 items-center gap-0.5">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => startRename(col)}
                    className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-200 hover:text-ink-700"
                    aria-label={`Renombrar ${col.title}`}
                    title="Renombrar columna"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNewTask?.(col.id)}
                  className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-200 hover:text-ink-700"
                  aria-label={`Agregar tarea a ${col.title}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onDeleteColumn?.(col.id)}
                    className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-100 hover:text-rose-600"
                    aria-label={`Eliminar ${col.title}`}
                    title="Eliminar columna"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </header>

            {/* Tarjetas */}
            <div
              className="flex-1 space-y-3 overflow-y-auto px-3 pt-1 pb-3"
              onDragOver={canEdit ? handleColumnDragOver(col) : undefined}
              onDrop={canEdit ? handleColumnDrop(col) : undefined}
            >
              {col.tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  column={col}
                  onOpen={() => onOpenTask?.(task.id, col.id)}
                  drag={
                    canEdit
                      ? {
                          onDragStart: handleDragStart(task.id, col.id),
                          onDragEnd: handleDragEnd,
                          onDragOver: handleCardDragOver(col, i),
                          onDrop: handleCardDrop(col, i),
                        }
                      : undefined
                  }
                  isDragging={dragging?.taskId === task.id}
                  insertTop={isTarget && over?.index === i}
                  insertBottom={isTarget && over?.index === i + 1}
                />
              ))}

              <button
                type="button"
                onClick={() => onNewTask?.(col.id)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-transparent py-2.5 text-xs font-semibold text-ink-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir tarjeta
              </button>
            </div>
          </section>
        )
      })}

      {canEdit && (
        <button
          type="button"
          onClick={() => onNewColumn?.()}
          className="flex min-w-[200px] cursor-pointer flex-col items-center justify-center gap-1.5 self-start rounded-2xl border-2 border-dashed border-ink-300 bg-ink-50/50 px-4 py-6 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-bold">Añadir columna</span>
        </button>
      )}
    </div>
  )
}
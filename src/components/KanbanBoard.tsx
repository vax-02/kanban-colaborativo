import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  CircleDot,
  GripVertical,
  MessageSquare,
  Paperclip,
  Plus,
} from 'lucide-react'
import type { Column, Task } from '../data/mock'

type Props = {
  initialColumns: Column[]
  onOpenTask?: (taskId: string, columnId: string) => void
  onNewTask?: (columnId: string) => void
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

function TaskCard({
  task,
  column,
  onOpen,
}: {
  task: Task
  column: Column
  onOpen: () => void
}) {
  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <StatusIcon column={column} className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="opacity-0 transition group-hover:opacity-100">
          <GripVertical className="h-4 w-4 cursor-grab text-ink-300" />
        </span>
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

export default function KanbanBoard({ initialColumns, onOpenTask, onNewTask }: Props) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-2">
      {initialColumns.map((col) => (
          <section
            key={col.id}
            className="flex min-w-[280px] flex-1 flex-col rounded-2xl bg-ink-100/70"
          >
            {/* Cabecera de columna */}
            <header className="flex items-center gap-2 px-4 pt-4 pb-2">
              <StatusIcon column={col} className="h-4 w-4" strokeWidth={2.5} />
              <h2 className="text-sm font-bold text-ink-700">{col.title}</h2>
              <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                {col.tasks.length}
              </span>
              <button
                type="button"
                onClick={() => onNewTask?.(col.id)}
                className="ml-auto cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-200 hover:text-ink-700"
                aria-label={`Agregar tarea a ${col.title}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </header>

            {/* Tarjetas */}
            <div className="flex-1 space-y-3 overflow-y-auto px-3 pt-1 pb-3">
              {col.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  column={col}
                  onOpen={() => onOpenTask?.(task.id, col.id)}
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
        ))}
    </div>
  )
}
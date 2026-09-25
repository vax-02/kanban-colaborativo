import { useState } from 'react'
import { Check, KanbanSquare, Lock, LockOpen, Palette } from 'lucide-react'
import Modal from '../Modal'
import { useBoardsStore } from '../../store/boardsStore'

type Props = { boardId: string; onClose: () => void }

const palette = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#0ea5e9',
  '#8b5cf6',
  '#f43f5e',
  '#14b8a6',
]

export default function EditBoardModal({ boardId, onClose }: Props) {
  const board = useBoardsStore((s) => s.boards.find((b) => b.id === boardId))
  const updateBoard = useBoardsStore((s) => s.updateBoard)

  const [nombre, setNombre] = useState(board?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(board?.descripcion ?? '')
  const [color, setColor] = useState(board?.color ?? palette[0])
  const [privateB, setPrivateB] = useState(board?.esPrivado ?? false)
  const [saving, setSaving] = useState(false)

  if (!board) return null

  const save = async () => {
    if (!nombre.trim() || saving) return
    setSaving(true)
    try {
      await updateBoard(boardId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        color,
        esPrivado: privateB,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Editar tablero"
      subtitle="Actualiza los datos de «{board.nombre}»."
      icon={<KanbanSquare className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <span className="text-xs text-ink-500">
            {privateB ? 'Solo visible para miembros' : 'Visible para el equipo'}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!nombre.trim() || saving}
            className="btn-primary"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </>
      }
    >
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        Nombre del tablero
      </label>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="p. ej. Rediseño de la web"
        className="input mb-5"
        autoFocus
      />

      <label className="mb-1.5 block text-sm font-medium text-ink-700">Descripción</label>
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="¿De qué trata este tablero?"
        rows={2}
        className="input mb-5 resize-none"
      />

      <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
        Color de portada
      </p>
      <div className="mb-5 flex items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:scale-110"
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            >
              {color === c && (
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-400">
          <Palette className="h-3.5 w-3.5" />
          Personalizar
        </span>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-500 ring-1 ring-ink-200">
            {privateB ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-800">
              Tablero {privateB ? 'privado' : 'público'}
            </p>
            <p className="text-xs text-ink-400">
              {privateB
                ? 'Solo los miembros invitados podrán verlo.'
                : 'Todo el equipo podrá descubrirlo y unirse.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPrivateB((v) => !v)}
          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
            privateB ? 'bg-brand-600' : 'bg-ink-300'
          }`}
          aria-label="Alternar visibilidad"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              privateB ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </Modal>
  )
}
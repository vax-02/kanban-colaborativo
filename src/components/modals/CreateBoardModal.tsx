import { useState } from 'react'
import { Check, KanbanSquare, Lock, LockOpen, Palette, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../Modal'
import { useBoardsStore } from '../../store/boardsStore'
import type { CreateBoardInput } from '../../lib/types'

type Props = { onClose: () => void }

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

export default function CreateBoardModal({ onClose }: Props) {
  const navigate = useNavigate()
  const createBoard = useBoardsStore((s) => s.createBoard)
  const [name, setName] = useState('')
  const [color, setColor] = useState(palette[0])
  const [privateB, setPrivateB] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    if (!name.trim()) return
    setError(null)
    try {
      const input: CreateBoardInput = {
        nombre: name.trim(),
        color,
        esPrivado: privateB,
      }
      const board = await createBoard(input)
      setCreatedId(board.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el tablero')
    }
  }

  if (createdId) {
    return (
      <Modal title="Tablero creado" onClose={onClose} maxWidth="max-w-md">
        <div className="flex flex-col items-center py-6 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            {name.trim().charAt(0).toUpperCase()}
          </div>
          <h3 className="text-base font-bold text-ink-900">«{name.trim()}» listo</h3>
          <p className="mt-1 max-w-xs text-sm text-ink-500">
            Ya puedes invitar a tu equipo y empezar a mover tarjetas en tiempo real.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/tableros/${createdId}`)}
              className="btn-primary"
            >
              Ir al tablero
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Crear tablero"
      subtitle="Configura tu nuevo tablero kanban y empieza a organizar."
      icon={<KanbanSquare className="h-5 w-5" />}
      onClose={onClose}
      footer={
        <>
          <span className="text-xs text-ink-500">
            {privateB
              ? 'Solo tú puedes verlo ahora. Tendrás acceso inmediato.'
              : 'Invita a tu equipo cuando quieras desde las opciones del tablero.'}
          </span>
          <button
            type="button"
            onClick={create}
            disabled={!name.trim()}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Crear tablero
          </button>
        </>
      }
    >
      {/* Nombre */}
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        Nombre del tablero
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="p. ej. Rediseño de la web"
        className="input mb-5"
        autoFocus
      />

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {/* Color */}
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
              {color === c && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-400">
          <Palette className="h-3.5 w-3.5" />
          Personalizar
        </span>
      </div>

      {/* Privado */}
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
                ? 'Solo tú puedes verlo: los colaboradores se añaden por invitación.'
                : 'Cualquier usuario registrado podrá descubrirlo y unirse.'}
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

      {/* Aviso de acceso */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
        <p className="text-xs leading-relaxed text-ink-500">
          Al crearlo, <strong>solo tú</strong> serás miembro del tablero. No se invitará a nadie de
          forma directa: añade colaboradores cuando quieras enviándoles una invitación.
        </p>
      </div>
    </Modal>
  )
}
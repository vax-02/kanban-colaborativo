import { useEffect, useState } from 'react'
import { LoaderCircle, Plus, Tag, Trash2 } from 'lucide-react'
import Modal from '../Modal'
import { useBoardsStore } from '../../store/boardsStore'
import type { BoardDetailDto, EtiquetaDto } from '../../lib/types'

type Props = {
  boardId: string
  onClose: () => void
}

const COLORES = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b']

type Row = EtiquetaDto & { colorSel: string }

export default function LabelsModal({ boardId, onClose }: Props) {
  const getBoard = useBoardsStore((s) => s.getBoard)
  const createLabel = useBoardsStore((s) => s.createLabel)
  const updateLabel = useBoardsStore((s) => s.updateLabel)
  const deleteLabel = useBoardsStore((s) => s.deleteLabel)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [nuevoColor, setNuevoColor] = useState(COLORES[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getBoard(boardId)
      .then((b: BoardDetailDto) => {
        if (active) setRows(b.etiquetas.map((e) => ({ ...e, colorSel: e.color })))
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar las etiquetas')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [boardId, getBoard])

  const crear = async () => {
    const texto = nuevoTexto.trim()
    if (!texto || saving) return
    setSaving(true)
    setError(null)
    try {
      await createLabel(boardId, { texto, color: nuevoColor })
      const b = await getBoard(boardId)
      setRows(b.etiquetas.map((e) => ({ ...e, colorSel: e.color })))
      setNuevoTexto('')
      setNuevoColor(COLORES[0])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la etiqueta')
    } finally {
      setSaving(false)
    }
  }

  const rename = async (r: Row, texto: string) => {
    const value = texto.trim()
    if (!value || value === r.texto) return
    setError(null)
    try {
      await updateLabel(boardId, r.id, { texto: value })
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, texto: value } : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo renombrar la etiqueta')
    }
  }

  const recolor = async (r: Row, color: string) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, colorSel: color } : x)))
    setError(null)
    try {
      await updateLabel(boardId, r.id, { color })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el color')
      const b = await getBoard(boardId)
      setRows(b.etiquetas.map((x) => ({ ...x, colorSel: x.color })))
    }
  }

  const borrar = async (r: Row) => {
    if (!window.confirm(`¿Eliminar la etiqueta «${r.texto}» de todas las tarjetas?`)) return
    setError(null)
    try {
      await deleteLabel(boardId, r.id)
      setRows((prev) => prev.filter((x) => x.id !== r.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la etiqueta')
    }
  }

  return (
    <Modal
      title="Gestionar etiquetas"
      subtitle="Crea y edita el catálogo de etiquetas del tablero."
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Tag className="h-5 w-5" />
        </span>
      }
      onClose={onClose}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-brand-600" />
          Cargando etiquetas…
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          {rows.length > 0 && (
            <ul className="space-y-2.5">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-surface px-3 py-2.5">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm">
                    <input
                      type="color"
                      value={r.colorSel}
                      onChange={(e) => void recolor(r, e.target.value)}
                      aria-label={`Color de ${r.texto}`}
                      className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </span>
                  <input
                    defaultValue={r.texto}
                    onBlur={(e) => void rename(r, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void rename(r, (e.target as HTMLInputElement).value)
                    }}
                    maxLength={50}
                    className="input flex-1 px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void borrar(r)}
                    className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-500"
                    aria-label={`Eliminar ${r.texto}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
              Aún no hay etiquetas en este tablero.
            </p>
          )}

          <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
            <p className="mb-2 text-xs font-bold text-ink-600">Nueva etiqueta</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={nuevoColor}
                onChange={(e) => setNuevoColor(e.target.value)}
                aria-label="Color de la nueva etiqueta"
                className="h-6 w-6 shrink-0 cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void crear()
                }}
                placeholder="Ej. Alta prioridad, Frontend…"
                maxLength={50}
                className="input flex-1 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => void crear()}
                disabled={!nuevoTexto.trim() || saving}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {saving ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
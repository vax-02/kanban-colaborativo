import { useState } from 'react'
import {
  Archive,
  ChevronDown,
  Inbox,
  Paperclip,
  PenSquare,
  Reply,
  Search,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
import { mails } from '../data/mock'
import type { Mail } from '../data/mock'

export default function InboxPage() {
  const [selected, setSelected] = useState<string>(mails[0].id)
  const [openMail, setOpenMail] = useState<Mail>(mails[0])

  const select = (m: Mail) => {
    setSelected(m.id)
    setOpenMail(m)
  }

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
      {/* ==== Lista de correos ==== */}
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-ink-200">
        {/* Cabecera de lista */}
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-bold text-ink-900">Correo del equipo</h2>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            <PenSquare className="h-3.5 w-3.5" />
            Redactar
          </button>
        </div>

        <div className="border-b border-ink-100 px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Buscar en el correo…"
              className="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pr-3 pl-8 text-sm outline-none placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {mails.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => select(m)}
                className={`w-full cursor-pointer border-b border-ink-50 px-4 py-3 text-left transition hover:bg-ink-50 ${
                  selected === m.id ? 'bg-brand-50/60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm ${
                      m.unread ? 'font-bold text-ink-900' : 'font-medium text-ink-600'
                    }`}
                  >
                    {m.from}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-400">{m.time}</span>
                </div>
                <p
                  className={`mt-0.5 truncate text-sm ${
                    m.unread ? 'font-semibold text-ink-800' : 'text-ink-500'
                  }`}
                >
                  {m.subject}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-400">{m.preview}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {m.attachment && (
                    <span className="flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                      <Paperclip className="h-2.5 w-2.5" />
                      adjunto
                    </span>
                  )}
                  {m.unread && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-brand-600" />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ==== Panel de lectura ==== */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Barra de acciones */}
        <div className="flex items-center gap-1.5 border-b border-ink-100 px-5 py-2.5">
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
            aria-label="Archivar"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
            aria-label="Favorito"
          >
            <Star className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
            aria-label="Responder"
          >
            <Reply className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
            aria-label="Reenviar"
          >
            <Send className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
              aria-label="Mover"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {/* identificador */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: openMail.color }}
              >
                {openMail.from
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink-900">{openMail.from}</p>
                  <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                    team@taskflow.app
                  </span>
                </div>
                <p className="text-xs text-ink-400">
                  para mí · {openMail.time}
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                <Inbox className="h-3.5 w-3.5" />
                Bandeja de entrada
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-ink-900">
              {openMail.subject}
            </h2>
          </div>

          {/* cuerpo */}
          <div className="space-y-3 px-6 pb-6 text-sm leading-relaxed text-ink-600">
            <p>Hola Ana,</p>
            <p>{openMail.preview.replace('…', '.')} Te adjunto los detalles para que los revises antes del viernes. Cualquier duda, respondemos por aquí.</p>
            <p>Quedo atento a tu respuesta.</p>
            <p>Saludos,<br />
              <span className="font-semibold text-ink-800">{openMail.from}</span>
            </p>

            {openMail.attachment && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-ink-500 ring-1 ring-ink-200">
                  <Paperclip className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {openMail.subject.toLowerCase().includes('propuesta')
                      ? 'propuesta_q3.pdf'
                      : 'reporte_pruebas.xlsx'}
                  </p>
                  <p className="text-xs text-ink-400">PDF · 1.2 MB</p>
                </div>
                <button type="button" className="btn-ghost px-3 py-1.5 text-xs">
                  Descargar
                </button>
              </div>
            )}
          </div>

          {/* respuesta rápida */}
          <div className="border-t border-ink-100 px-6 py-4">
            <div className="rounded-xl border border-ink-200 p-3 transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
              <input
                type="text"
                placeholder={`Responder a ${openMail.from}…`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100"
                    aria-label="Adjuntar"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button type="button" className="btn-primary px-3 py-1.5 text-xs">
                  <Send className="h-3.5 w-3.5" />
                  Enviar respuesta
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
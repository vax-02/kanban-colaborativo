import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LoaderCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import type { ChatContactDto } from '../lib/types'

function timeHM(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function listTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return timeHM(iso)
  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function createThrottle(ms: number) {
  let last = 0
  return () => {
    const now = Date.now()
    if (now - last < ms) return true
    last = now
    return false
  }
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const me = useAuthStore((s) => s.user)

  const {
    contacts,
    conversations,
    activeConversationId,
    messages,
    typing,
    loading,
    loadConversations,
    getOrCreateConversation,
    openConversation,
    sendMessage,
    sendTyping,
  } = useChatStore()

  const [showPicker, setShowPicker] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const typingCooldown = useRef(createThrottle(2000))
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null
  const other = activeConversation?.participante ?? null

  useEffect(() => {
    const usuarioId = searchParams.get('usuarioId')
    if (!usuarioId) return
    void getOrCreateConversation(usuarioId).then((conv) => {
      if (conv) void openConversation(conv.id)
      navigate('/mensajes', { replace: true })
    })
  }, [searchParams, getOrCreateConversation, openConversation, navigate])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, activeConversationId])

  const isTyping =
    !!typing &&
    typing.conversationId === activeConversationId &&
    !!other &&
    typing.from === other.id

  const filteredContacts = useMemo(() => {
    const withoutConversation = contacts.filter(
      (c) => !conversations.some((conv) => conv.participante?.id === c.id),
    )
    const q = query.trim().toLowerCase()
    return withoutConversation.filter(
      (c) => !q || `${c.nombre} ${c.apellidos}`.toLowerCase().includes(q),
    )
  }, [contacts, conversations, query])

  const pickerVisible = showPicker || conversations.length === 0

  const startWith = async (c: ChatContactDto) => {
    setShowPicker(false)
    setQuery('')
    const conv = await getOrCreateConversation(c.id)
    if (conv) void openConversation(conv.id)
  }

  const onSend = () => {
    const text = draft.trim()
    if (!text || !activeConversationId) return
    void sendMessage(text)
    setDraft('')
  }

  const onChangeDraft = (value: string) => {
    setDraft(value)
    if (other && !typingCooldown.current()) {
      sendTyping(other.id)
    }
  }

  const isOwn = (autorId: string) => autorId === me?.id

  const statusLabel = isTyping
    ? 'escribiendo…'
    : other?.online
      ? 'En línea'
      : other?.ultimoVistoAt
        ? `Visto ${listTime(other.ultimoVistoAt)}`
        : 'Ausente'

  return (
    <div className="flex h-full gap-4">
      {/* Lista de conversaciones */}
      <section className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 className="text-sm font-bold text-ink-900">Mensajes</h2>
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
              aria-label="Nueva conversación"
              title="Nueva conversación"
            >
              {pickerVisible ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          )}
        </div>

        {pickerVisible ? (
          <div className="flex flex-col gap-3 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar compañero…"
                className="input h-9 pl-9 text-sm"
                autoFocus
              />
            </div>
            {filteredContacts.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-ink-400">
                {contacts.length === 0
                  ? 'No hay compañeros de tablero disponibles.'
                  : 'Sin resultados.'}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredContacts.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void startWith(c)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-ink-50"
                    >
                      <Avatar
                        initials={c.iniciales}
                        color={c.avatarColor}
                        name={`${c.nombre} ${c.apellidos}`}
                        online={c.online}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {c.nombre} {c.apellidos}
                        </p>
                        <p className="truncate text-[11px] text-ink-400">{c.email}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-ink-400">
                Aún no tienes conversaciones. Crea una con un compañero de tablero.
              </p>
            ) : (
              <ul>
                {conversations.map((conv) => {
                  const p = conv.participante
                  const active = conv.id === activeConversationId
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => void openConversation(conv.id)}
                        className={`flex w-full cursor-pointer items-center gap-3 border-b border-ink-100 px-3.5 py-3 text-left transition ${
                          active ? 'bg-brand-50' : 'hover:bg-ink-50'
                        }`}
                      >
                        <Avatar
                          initials={p?.iniciales ?? '?'}
                          color={p?.avatarColor ?? '#94a3b8'}
                          name={p ? `${p.nombre} ${p.apellidos}` : 'Sin contacto'}
                          online={p?.online}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-ink-800">
                              {p ? `${p.nombre} ${p.apellidos}` : 'Sin contacto'}
                            </p>
                            {conv.lastMessage && (
                              <span className="shrink-0 text-[10px] text-ink-400">
                                {listTime(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-ink-400">
                              {conv.lastMessage
                                ? conv.lastMessage.autorId === me?.id
                                  ? `Tú: ${conv.lastMessage.texto}`
                                  : conv.lastMessage.texto
                                : 'Sin mensajes'}
                            </p>
                            {conv.unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Hilo de mensajes */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <MessageSquare className="h-7 w-7" />
            </span>
            <p className="font-semibold text-ink-800">Selecciona una conversación</p>
            <p className="max-w-xs text-sm text-ink-400">
              Elige un chat de la lista o inicia uno nuevo con un compañero de tablero.
            </p>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="btn-primary mt-2"
            >
              <Plus className="h-4 w-4" />
              Nueva conversación
            </button>
          </div>
        ) : (
          <>
            {/* Cabecera del hilo */}
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
              <Avatar
                initials={other?.iniciales ?? '?'}
                color={other?.avatarColor ?? '#94a3b8'}
                name={other ? `${other.nombre} ${other.apellidos}` : ''}
                online={other?.online}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-900">
                  {other ? `${other.nombre} ${other.apellidos}` : ''}
                </p>
                <p className="text-xs text-ink-400">{statusLabel}</p>
              </div>
            </div>

            {/* Mensajes */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
            >
              {loading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-400">
                  <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" />
                  Cargando mensajes…
                </div>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-xs text-ink-400">
                  Sin mensajes todavía. ¡Envía el primero!
                </p>
              ) : (
                messages.map((m) => {
                  const own = isOwn(m.autorId)
                  const isLastOwn =
                    own && messages[messages.length - 1]?.id === m.id
                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}
                    >
                      {!own && (
                        <Avatar
                          initials={other?.iniciales ?? '?'}
                          color={other?.avatarColor ?? '#94a3b8'}
                          name={other ? `${other.nombre} ${other.apellidos}` : ''}
                          size="xs"
                        />
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          own
                            ? 'rounded-br-md bg-brand-600 text-white'
                            : 'rounded-bl-md bg-ink-100 text-ink-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                        <p
                          className={`mt-0.5 flex items-center gap-1 text-[10px] ${
                            own ? 'text-brand-100' : 'text-ink-400'
                          }`}
                        >
                          {timeHM(m.createdAt)}
                          {own && isLastOwn && (
                            <span className="font-semibold">
                              {m.leidoAt ? '· Leído' : '· Enviado'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Entrada */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSend()
              }}
              className="flex items-center gap-2 border-t border-ink-100 px-4 py-3"
            >
              <input
                value={draft}
                onChange={(e) => onChangeDraft(e.target.value)}
                placeholder="Escribe un mensaje…"
                className="input"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="btn-primary shrink-0 px-3.5 py-2.5"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
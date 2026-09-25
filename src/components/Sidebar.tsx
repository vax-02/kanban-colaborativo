import {
  Bell,
  Calendar,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LayoutList,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { useBoardsStore } from '../store/boardsStore'
import { useChatStore } from '../store/chatStore'
import { shortName } from '../lib/format'

const navMain = [
  { to: '/', label: 'Panel general', icon: LayoutDashboard, end: true },
  { to: '/tableros', label: 'Tableros', icon: KanbanSquare },
  { to: '/mis-tareas', label: 'Mis tareas', icon: LayoutList, badge: 4 },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
]

const navTeam = [
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquare },
  { to: '/notificaciones', label: 'Notificaciones', icon: Bell, badge: 3 },
  { to: '/correo', label: 'Correo del equipo', icon: Inbox },
  { to: '/miembros', label: 'Miembros', icon: Users },
]

export default function Sidebar() {
  const openModal = useUiStore((s) => s.openModal)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const boards = useBoardsStore((s) => s.boards)
  const loadBoards = useBoardsStore((s) => s.loadBoards)
  const unreadChats = useChatStore((s) =>
    s.conversations.reduce((acc, c) => acc + c.unread, 0),
  )
  const navigate = useNavigate()

  const sortedBoards = [...boards].sort(
    (a, b) =>
      Number(b.esFavorito) - Number(a.esFavorito) ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    void loadBoards()
  }, [loadBoards, user?.id])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
    }`

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-surface border-r border-ink-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-200">
          <KanbanSquare className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold tracking-tight text-ink-900">
            TaskFlow
          </span>
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
            TEAM
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {/* Navegación principal */}
        <div>
          <p className="px-2 pb-2 text-[11px] font-bold tracking-wider text-ink-400 uppercase">
            Menú
          </p>
          <ul className="space-y-0.5">
            {navMain.map((item) => (
              <li key={item.label}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`h-[18px] w-[18px] transition ${
                          isActive
                            ? 'text-brand-600'
                            : 'text-ink-400 group-hover:text-ink-600'
                        }`}
                      />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Colaboración */}
        <div>
          <p className="px-2 pb-2 text-[11px] font-bold tracking-wider text-ink-400 uppercase">
            Colaboración
          </p>
          <ul className="space-y-0.5">
            {navTeam.map((item) => (
              <li key={item.label}>
                <NavLink to={item.to} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`h-[18px] w-[18px] transition ${
                          isActive
                            ? 'text-brand-600'
                            : 'text-ink-400 group-hover:text-ink-600'
                        }`}
                      />
                      {item.label}
                      {item.label === 'Mensajes' && unreadChats > 0 ? (
                        <span className="ml-auto rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unreadChats}
                        </span>
                      ) : item.badge ? (
                        <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Tableros */}
        <div>
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="text-[11px] font-bold tracking-wider text-ink-400 uppercase">
              Tableros
            </p>
            <button
              type="button"
              onClick={() => openModal({ type: 'createBoard' })}
              className="cursor-pointer rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              aria-label="Crear tablero"
              title="Crear tablero"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-0.5">
            {sortedBoards.slice(0, 8).map((b) => (
              <li key={b.id}>
                <NavLink
                  to={`/tableros/${b.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`
                  }
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
                    style={{ backgroundColor: b.color }}
                  >
                    {shortName(b.nombre)}
                  </span>
                  <span className="truncate">{b.nombre}</span>
                  <span className="ml-auto pr-0">
                    {b.esFavorito && <span className="text-amber-400">★</span>}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Ajustes + perfil */}
      <div className="border-t border-ink-200 px-3 py-3">
        <NavLink
          to="/ajustes"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
            }`
          }
        >
          <Settings className="h-[18px] w-[18px] text-ink-400" />
          Ajustes
        </NavLink>

        <div className="mt-2 flex items-center gap-3 rounded-xl bg-ink-50 p-2.5">
          <div className="relative">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor: user?.avatarColor ?? '#6366f1',
              }}
            >
              {user?.iniciales ?? 'AG'}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-50 bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">
              {user ? `${user.nombre} ${user.apellidos}` : 'Ana García'}
            </p>
            <p className="truncate text-xs text-ink-400">
              {user ? user.email : 'Administrador'}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer rounded-lg p-1.5 text-ink-300 transition hover:bg-ink-100 hover:text-rose-500"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './pages/Layout'
import Overview from './pages/Overview'
import Boards from './pages/Boards'
import BoardPage from './pages/BoardPage'
import MyTasksPage from './pages/MyTasksPage'
import CalendarPage from './pages/CalendarPage'
import ChatPage from './pages/ChatPage'
import NotificationsPage from './pages/NotificationsPage'
import InboxPage from './pages/InboxPage'
import MembersPage from './pages/MembersPage'
import SettingsPage from './pages/SettingsPage'
import { useAuthStore } from './store/authStore'
import { useChatStore } from './store/chatStore'

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const user = useAuthStore((s) => s.user)
  const connectSocket = useChatStore((s) => s.connectSocket)
  const disconnectSocket = useChatStore((s) => s.disconnectSocket)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadContacts = useChatStore((s) => s.loadContacts)

  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (user?.id) {
      connectSocket()
      void loadConversations()
      void loadContacts()
    } else {
      disconnectSocket()
    }
  }, [user?.id, connectSocket, disconnectSocket, loadConversations, loadContacts])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/tableros" element={<Boards />} />
        <Route path="/tableros/:boardId" element={<BoardPage />} />
        <Route path="/mis-tareas" element={<MyTasksPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/mensajes" element={<ChatPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/correo" element={<InboxPage />} />
        <Route path="/miembros" element={<MembersPage />} />
        <Route path="/ajustes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
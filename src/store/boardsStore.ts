import { create } from 'zustand'
import { api, getToken } from '../lib/api'
import type {
  BoardDetailDto,
  BoardDto,
  CreateBoardInput,
  CreateTaskInput,
  InvitacionDto,
  MemberDto,
  RolTablero,
  SentInviteDto,
  TaskDto,
  UpdateBoardInput,
  UpdateTaskInput,
} from '../lib/types'

type BoardsStore = {
  boards: BoardDto[]
  loading: boolean
  taskV: number
  membersV: number
  invites: InvitacionDto[]
  loadingInvites: boolean
  sentInvites: SentInviteDto[]
  minePending: number
  mineTotal: number
  loadBoards: () => Promise<void>
  createBoard: (input: CreateBoardInput) => Promise<BoardDto>
  updateBoard: (id: string, input: UpdateBoardInput) => Promise<BoardDto>
  deleteBoard: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  getBoard: (id: string) => Promise<BoardDetailDto>
  createTask: (input: CreateTaskInput) => Promise<TaskDto>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<TaskDto>
  deleteTask: (id: string) => Promise<void>
  createColumn: (boardId: string, titulo: string, color?: string) => Promise<void>
  updateColumn: (
    boardId: string,
    columnaId: string,
    data: { titulo?: string; color?: string },
  ) => Promise<void>
  deleteColumn: (boardId: string, columnaId: string, moverA?: string) => Promise<void>
  reorderColumns: (boardId: string, ids: string[]) => Promise<void>
  bumpTask: () => void
  loadMine: () => Promise<void>
  addMember: (boardId: string, usuarioId: string, rol: RolTablero) => Promise<void>
  updateMemberRole: (boardId: string, usuarioId: string, rol: RolTablero) => Promise<void>
  removeMember: (boardId: string, usuarioId: string) => Promise<void>
  bumpMembers: () => void
  loadInvitations: () => Promise<void>
  loadSentInvites: () => Promise<void>
  sendInvite: (
    boardId: string,
    usuarioId: string,
    rol: RolTablero,
    email?: string,
  ) => Promise<void>
  updateInviteRole: (
    boardId: string,
    usuarioId: string,
    rol: RolTablero,
  ) => Promise<void>
  acceptInvitation: (id: string) => Promise<void>
  rejectInvitation: (id: string) => Promise<void>
  cancelInvite: (boardId: string, usuarioId: string) => Promise<void>
}

export const useBoardsStore = create<BoardsStore>((set, get) => ({
  boards: [],
  loading: false,
  taskV: 0,
  membersV: 0,
  invites: [],
  loadingInvites: false,
  sentInvites: [],
  minePending: 0,
  mineTotal: 0,

  async loadBoards() {
    if (!getToken()) {
      set({ boards: [], loading: false })
      return
    }
    set({ loading: true })
    try {
      const res = await api<{ boards: BoardDto[] }>('/boards')
      set({ boards: res.boards })
    } finally {
      set({ loading: false })
    }
  },

  async createBoard(input) {
    const res = await api<{ board: BoardDto }>('/boards', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    await get().loadBoards()
    return res.board
  },

  async updateBoard(id, input) {
    const res = await api<{ board: BoardDto }>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    await get().loadBoards()
    return res.board
  },

  async deleteBoard(id) {
    await api<void>(`/boards/${id}`, { method: 'DELETE' })
    set({ boards: get().boards.filter((b) => b.id !== id) })
  },

  async toggleFavorite(id) {
    const board = get().boards.find((b) => b.id === id)
    if (!board) return
    const next = !board.esFavorito
    set({
      boards: get().boards.map((b) => (b.id === id ? { ...b, esFavorito: next } : b)),
    })
    try {
      await api<{ board: { id: string; esFavorito: boolean } }>(`/boards/${id}/favorite`, {
        method: 'PUT',
        body: JSON.stringify({ esFavorito: next }),
      })
    } catch {
      set({
        boards: get().boards.map((b) => (b.id === id ? { ...b, esFavorito: !next } : b)),
      })
    }
  },

  async getBoard(id) {
    const res = await api<{ board: BoardDetailDto }>(`/boards/${id}`)
    return res.board
  },

  async createTask(input) {
    const res = await api<{ task: TaskDto }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    get().bumpTask()
    return res.task
  },

  async updateTask(id, input) {
    const res = await api<{ task: TaskDto }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    get().bumpTask()
    return res.task
  },

  async deleteTask(id) {
    await api<void>(`/tasks/${id}`, { method: 'DELETE' })
    get().bumpTask()
  },

  async createColumn(boardId, titulo, color) {
    await api(`/boards/${boardId}/columnas`, {
      method: 'POST',
      body: JSON.stringify(color ? { titulo, color } : { titulo }),
    })
    get().bumpTask()
  },

  async updateColumn(boardId, columnaId, data) {
    await api(`/boards/${boardId}/columnas/${columnaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    get().bumpTask()
  },

  async deleteColumn(boardId, columnaId, moverA) {
    const q = moverA ? `?moverA=${encodeURIComponent(moverA)}` : ''
    await api<void>(`/boards/${boardId}/columnas/${columnaId}${q}`, {
      method: 'DELETE',
    })
    get().bumpTask()
  },

  async reorderColumns(boardId, ids) {
    await api(`/boards/${boardId}/columnas/orden`, {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    })
    get().bumpTask()
  },

  bumpTask() {
    set({ taskV: get().taskV + 1 })
    void get().loadMine()
  },

  async loadMine() {
    if (!getToken()) {
      set({ minePending: 0, mineTotal: 0 })
      return
    }
    try {
      const res = await api<{ total: number; pendientes: number }>('/tasks/mine')
      set({ mineTotal: res.total, minePending: res.pendientes })
    } catch {
      /* mantiene el último valor conocido si el conteo falla */
    }
  },

  async addMember(boardId, usuarioId, rol) {
    await api<{ member: MemberDto }>(`/boards/${boardId}/members`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId, rol }),
    })
    get().bumpMembers()
  },

  async updateMemberRole(boardId, usuarioId, rol) {
    await api<{ member: MemberDto }>(`/boards/${boardId}/members/${usuarioId}`, {
      method: 'PUT',
      body: JSON.stringify({ rol }),
    })
    get().bumpMembers()
  },

  async removeMember(boardId, usuarioId) {
    await api<void>(`/boards/${boardId}/members/${usuarioId}`, { method: 'DELETE' })
    get().bumpMembers()
  },

  bumpMembers() {
    set({ membersV: get().membersV + 1 })
    get().loadBoards()
    void get().loadMine()
  },

  async loadInvitations() {
    if (!getToken()) {
      set({ invites: [], loadingInvites: false })
      return
    }
    set({ loadingInvites: true })
    try {
      const res = await api<{ invites: InvitacionDto[] }>('/invitaciones')
      set({ invites: res.invites })
    } finally {
      set({ loadingInvites: false })
    }
  },

  async loadSentInvites() {
    try {
      const res = await api<{ invites: SentInviteDto[] }>('/invitaciones/enviadas')
      set({ sentInvites: res.invites })
    } catch {
      set({ sentInvites: [] })
    }
  },

  async sendInvite(
    boardId: string,
    usuarioId: string,
    rol: RolTablero,
    email?: string,
  ) {
    await api<{ invitacion: InvitacionDto }>(`/boards/${boardId}/invitaciones`, {
      method: 'POST',
      body: JSON.stringify(email ? { email, rol } : { usuarioId, rol }),
    })
    get().bumpMembers()
  },

  async updateInviteRole(boardId, usuarioId, rol) {
    await api(`/boards/${boardId}/invitaciones/${usuarioId}`, {
      method: 'PUT',
      body: JSON.stringify({ rol }),
    })
  },

  async acceptInvitation(id) {
    await api<void>(`/invitaciones/${id}/aceptar`, { method: 'POST' })
    set({ invites: get().invites.filter((i) => i.id !== id) })
    await Promise.all([get().loadBoards(), get().loadMine()])
  },

  async rejectInvitation(id) {
    await api<void>(`/invitaciones/${id}/rechazar`, { method: 'POST' })
    set({ invites: get().invites.filter((i) => i.id !== id) })
  },

  async cancelInvite(boardId, usuarioId) {
    await api<void>(`/boards/${boardId}/invitaciones/${usuarioId}`, { method: 'DELETE' })
    get().bumpMembers()
  },
}))
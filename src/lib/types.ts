export type ApiUser = {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  bio: string | null
  estado: 'ACTIVO' | 'INACTIVO'
  esOnline: boolean
  ultimoVistoAt: string | null
  iniciales: string
}

export type AuthResponse = {
  token: string
  user: ApiUser
}

export type Plantilla = 'PROYECTO' | 'SPRINT' | 'TAREAS' | 'VACIO'
export type RolTablero = 'ADMINISTRADOR' | 'MIEMBRO' | 'EDITOR' | 'LECTURA'
export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA'

export type UserMini = {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  iniciales: string
  online: boolean
}

export type MemberDto = UserMini & {
  rol: RolTablero
  ultimoVistoAt: string | null
  ingresoAt?: string | null
  invitadoAt?: string | null
}

export type BoardDto = {
  id: string
  nombre: string
  descripcion: string | null
  color: string
  plantilla: Plantilla
  esPrivado: boolean
  esFavorito: boolean
  tareas: number
  done: number
  updatedAt: string
  creadoPor: UserMini
  miembros: MemberDto[]
}

export type EtiquetaDto = { id: string; texto: string; color: string }
export type ChecklistDto = {
  id: string
  texto: string
  hecho: boolean
  posicion: number
}

export type TaskDto = {
  id: string
  titulo: string
  descripcion: string | null
  prioridad: Prioridad
  fechaVencimiento: string | null
  posicion: number
  createdAt: string
  etiquetas: EtiquetaDto[]
  asignaciones: MemberDto[]
  checklist: ChecklistDto[]
}

export type ColumnaDto = {
  id: string
  titulo: string
  color: string
  posicion: number
  tareas: TaskDto[]
}

export type BoardDetailDto = {
  id: string
  nombre: string
  descripcion: string | null
  color: string
  plantilla: Plantilla
  esPrivado: boolean
  esFavorito: boolean
  updatedAt: string
  creadoPor: UserMini
  miembros: MemberDto[]
  etiquetas: EtiquetaDto[]
  invitaciones: BoardInviteDto[]
  columnas: ColumnaDto[]
  historialMiembros: HistorialMiembroDto[]
}

export type HistorialMiembroDto = {
  usuario: UserMini & { ultimoVistoAt?: string | null }
  rol: RolTablero
  ingresoAt: string
  salidaAt: string
}

export type TipoActividad =
  | 'TABLERO_CREADO'
  | 'TAREA_CREADA'
  | 'TAREA_MOVIDA'
  | 'TAREA_ELIMINADA'
  | 'PRIORIDAD_CAMBIADA'
  | 'MIEMBRO_INVITADO'
  | 'MIEMBRO_UNIDO'
  | 'MIEMBRO_REMOVIDO'

export type ActividadDto = {
  id: string
  tipo: TipoActividad
  detalle: string | null
  de: string | null
  a: string | null
  tareaId: string | null
  createdAt: string
  autor: UserMini | null
  usuario: (UserMini & { ultimoVistoAt?: string | null }) | null
}

export type BoardInviteDto = {
  id: string
  rol: RolTablero
  usuario: MemberDto
  creadoPor: UserMini
  createdAt: string
}

export type InvitacionDto = {
  id: string
  rol: RolTablero
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA'
  createdAt: string
  tablero: {
    id: string
    nombre: string
    color: string
    esPrivado: boolean
    creadoPor: UserMini
  }
  creadoPor: UserMini
}

export type NotificacionDto = {
  id: string
  tipo: string
  titulo: string
  cuerpo: string | null
  leida: boolean
  createdAt: string
  tablero: { id: string; nombre: string; color: string } | null
  invitacion: {
    id: string
    rol: RolTablero
    estado: string
    creadoPor: UserMini
    tablero: { id: string; nombre: string; color: string } | null
  } | null
}

export type CreateBoardInput = {
  nombre: string
  descripcion?: string | null
  color: string
  plantilla?: Plantilla
  esPrivado: boolean
}

export type UpdateBoardInput = Partial<CreateBoardInput>

export type ChatContactDto = {
  id: string
  nombre: string
  apellidos: string
  email: string
  avatarColor: string
  avatarUrl: string | null
  iniciales: string
  online: boolean
  ultimoVistoAt: string | null
}

export type MessageDto = {
  id: string
  conversacionId: string
  autorId: string
  texto: string
  leidoAt: string | null
  createdAt: string
}

export type ConversationDto = {
  id: string
  participante: ChatContactDto | null
  lastMessage: MessageDto | null
  unread: number
  updatedAt: string
}

export type CreateTaskInput = {
  columnaId: string
  titulo: string
  descripcion?: string | null
  prioridad: Prioridad
  fechaVencimiento?: string | null
  etiquetas: { texto: string; color: string }[]
  asignados: string[]
  checklist: string[]
}

export type ChecklistInput = { texto: string; hecho?: boolean }

export type UpdateTaskInput = Partial<
  Omit<CreateTaskInput, 'columnaId' | 'checklist'> & {
    columnaId?: string
    posicion?: number
    orden?: string[]
    checklist: ChecklistInput[]
  }
>
export type ApiSearchedUser = UserMini

export type SentInviteDto = {
  id: string
  rol: RolTablero
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA'
  createdAt: string
  usuario: UserMini
  tablero: { id: string; nombre: string; color: string }
}

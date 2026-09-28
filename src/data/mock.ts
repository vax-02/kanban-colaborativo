export type Person = {
  id: string
  name: string
  email: string
  initials: string
  color: string
  role: string
  online?: boolean
}

export type Label = { text: string; color: string }

export type Task = {
  id: string
  title: string
  description?: string
  labels: Label[]
  assignees: Person[]
  due: string
  checklist?: { done: number; total: number }
  comments?: number
  attachments?: number
}

export type Column = {
  id: string
  title: string
  color: string
  tasks: Task[]
}

export const team: Person[] = [
  { id: 'u1', name: 'Ana García', email: 'ana@empresa.com', initials: 'AG', color: '#6366f1', role: 'Administrador', online: true },
  { id: 'u2', name: 'Carlos Ruiz', email: 'carlos@empresa.com', initials: 'CR', color: '#f59e0b', role: 'Miembro', online: true },
  { id: 'u3', name: 'María López', email: 'maria@empresa.com', initials: 'ML', color: '#10b981', role: 'Miembro', online: true },
  { id: 'u4', name: 'Pedro Sánchez', email: 'pedro@empresa.com', initials: 'PS', color: '#ef4444', role: 'Miembro', online: false },
  { id: 'u5', name: 'Laura Torres', email: 'laura@empresa.com', initials: 'LT', color: '#8b5cf6', role: 'Miembro', online: true },
  { id: 'u6', name: 'Jorge Fernández', email: 'jorge@empresa.com', initials: 'JF', color: '#0ea5e9', role: 'Miembro', online: false },
]

export const columns: Column[] = [
  {
    id: 'c1',
    title: 'Pendiente',
    color: '#94a3b8',
    tasks: [
      {
        id: 't1',
        title: 'Diseñar pantalla de onboarding',
        description: 'Nuevo flujo de bienvenida para usuarios que se registran.',
        labels: [{ text: 'Diseño', color: '#8b5cf6' }],
        assignees: [team[0], team[2]],
        due: 'Mar 5',
        checklist: { done: 1, total: 4 },
        comments: 3,
        attachments: 2,
      },
      {
        id: 't2',
        title: 'Preparar propuesta comercial Q3',
        labels: [{ text: 'Ventas', color: '#0ea5e9' }, { text: 'Alta prioridad', color: '#ef4444' }],
        assignees: [team[1]],
        due: 'Mar 8',
        comments: 1,
      },
      {
        id: 't3',
        title: 'Investigar alternativas de hosting',
        labels: [{ text: 'Infra', color: '#10b981' }],
        assignees: [team[3], team[5]],
        due: 'Mar 12',
        checklist: { done: 0, total: 6 },
      },
    ],
  },
  {
    id: 'c2',
    title: 'En progreso',
    color: '#f59e0b',
    tasks: [
      {
        id: 't4',
        title: 'Implementar drag & drop en tableros',
        description: 'Mover tarjetas entre columnas con animación fluida.',
        labels: [{ text: 'Frontend', color: '#6366f1' }],
        assignees: [team[0]],
        due: 'Hoy',
        checklist: { done: 3, total: 5 },
        comments: 5,
        attachments: 1,
      },
      {
        id: 't5',
        title: 'Conectar websockets con el backend',
        labels: [{ text: 'Backend', color: '#ef4444' }],
        assignees: [team[5], team[3]],
        due: 'Mañana',
        comments: 2,
      },
      {
        id: 't6',
        title: 'Revisar responsividad en móvil',
        labels: [{ text: 'UI', color: '#8b5cf6' }, { text: 'QA', color: '#10b981' }],
        assignees: [team[4]],
        due: 'Jue 27',
      },
    ],
  },
  {
    id: 'c3',
    title: 'En revisión',
    color: '#0ea5e9',
    tasks: [
      {
        id: 't7',
        title: 'Pruebas de carga en el servidor',
        labels: [{ text: 'QA', color: '#10b981' }],
        assignees: [team[2], team[4]],
        due: 'Mar 3',
        checklist: { done: 2, total: 3 },
        comments: 4,
      },
      {
        id: 't8',
        title: 'Migrar iconografía a lucide-react',
        labels: [{ text: 'Frontend', color: '#6366f1' }],
        assignees: [team[0]],
        due: 'Mar 2',
        attachments: 3,
      },
    ],
  },
  {
    id: 'c4',
    title: 'Terminado',
    color: '#10b981',
    tasks: [
      {
        id: 't9',
        title: 'Configurar CI/CD en GitHub Actions',
        labels: [{ text: 'DevOps', color: '#0ea5e9' }],
        assignees: [team[1]],
        due: 'Feb 28',
      },
      {
        id: 't10',
        title: 'Auditoría de accesibilidad',
        labels: [{ text: 'UI', color: '#8b5cf6' }],
        assignees: [team[2], team[4]],
        due: 'Feb 26',
        comments: 6,
      },
    ],
  },
]

export type Board = {
  id: string
  name: string
  short: string
  color: string
  description: string
  tasks: number
  done: number
  favorite?: boolean
  private?: boolean
  updated: string
  members: Person[]
}

export const boards: Board[] = [
  {
    id: 'b1',
    name: 'App móvil',
    short: 'AM',
    color: '#6366f1',
    description: 'Desarrollo del cliente móvil v2.0',
    tasks: 24,
    done: 11,
    favorite: true,
    updated: 'Hace 2 min',
    members: [team[0], team[1], team[3], team[5]],
  },
  {
    id: 'b2',
    name: 'Landing web',
    short: 'LW',
    color: '#f59e0b',
    description: 'Rediseño de la landing corporativa',
    tasks: 12,
    done: 7,
    updated: 'Hace 1 h',
    members: [team[2], team[4]],
  },
  {
    id: 'b3',
    name: 'Marketing Q3',
    short: 'MQ',
    color: '#10b981',
    description: 'Campañas y contenidos del trimestre',
    tasks: 18,
    done: 14,
    private: true,
    updated: 'Hace 3 h',
    members: [team[2], team[1], team[0]],
  },
  {
    id: 'b4',
    name: 'Lanzamiento 2.0',
    short: 'L2',
    color: '#ef4444',
    description: 'Plan de lanzamiento del producto 2.0',
    tasks: 31,
    done: 20,
    favorite: true,
    updated: 'Ayer',
    members: [team[0], team[1], team[2], team[3], team[4], team[5]],
  },
  {
    id: 'b5',
    name: 'Backend & APIs',
    short: 'BA',
    color: '#0ea5e9',
    description: 'Servicios y microservicios internos',
    tasks: 9,
    done: 4,
    updated: 'Ayer',
    members: [team[3], team[5]],
  },
  {
    id: 'b6',
    name: 'Design system',
    short: 'DS',
    color: '#8b5cf6',
    description: 'Tokens, componentes y documentación',
    tasks: 15,
    done: 3,
    favorite: true,
    updated: 'Hace 2 días',
    members: [team[0], team[4]],
  },
]

export type Notice = {
  id: string
  type: 'mention' | 'assign' | 'comment' | 'invite' | 'system'
  title: string
  body: string
  time: string
  read: boolean
  color: string
  person?: Person
}

export const notices: Notice[] = [
  {
    id: 'n1',
    type: 'mention',
    title: 'María te mencionó en «Pruebas de carga en el servidor»',
    body: '¿Puedes revisar los resultados del último test?',
    time: 'Hace 5 min',
    read: false,
    color: '#6366f1',
    person: team[2],
  },
  {
    id: 'n2',
    type: 'assign',
    title: 'Te asignaron «Implementar drag & drop en tableros»',
    body: 'Carlos actualizó la tarea y te la asignó.',
    time: 'Hace 28 min',
    read: false,
    color: '#f59e0b',
    person: team[1],
  },
  {
    id: 'n3',
    type: 'comment',
    title: 'Nuevo comentario en «Configurar CI/CD»',
    body: 'Pedro: “El pipeline quedó en 90s, veremos el cache.”',
    time: 'Hace 1 h',
    read: false,
    color: '#10b981',
    person: team[3],
  },
  {
    id: 'n4',
    type: 'invite',
    title: 'Laura te invitó a «Design system»',
    body: 'Acepta la invitación para colaborar en el tablero.',
    time: 'Hace 3 h',
    read: true,
    color: '#8b5cf6',
    person: team[4],
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Resumen semanal del equipo',
    body: '12 tareas completadas, 5 en progreso esta semana.',
    time: 'Ayer',
    read: true,
    color: '#0ea5e9',
  },
  {
    id: 'n6',
    type: 'assign',
    title: 'Vencimiento próximo: «Preparar propuesta Q3»',
    body: 'La tarea vence mañana y no tiene comentarios.',
    time: 'Ayer',
    read: true,
    color: '#ef4444',
  },
]

export type CalEvent = {
  id: string
  day: number
  month: string
  title: string
  time?: string
  color: string
  type: 'due' | 'meeting' | 'milestone'
}

export const calEvents: CalEvent[] = [
  { id: 'e1', day: 2, month: 'Mar', title: 'Envío de propuesta Q3', color: '#f59e0b', type: 'due' },
  { id: 'e2', day: 3, month: 'Mar', title: 'Review de sprint', time: '10:00', color: '#6366f1', type: 'meeting' },
  { id: 'e3', day: 5, month: 'Mar', title: 'Entrega de onboarding', color: '#ef4444', type: 'milestone' },
  { id: 'e4', day: 6, month: 'Mar', title: 'Demo con stakeholders', time: '16:30', color: '#8b5cf6', type: 'meeting' },
  { id: 'e5', day: 8, month: 'Mar', title: 'Propuesta comercial Q3', color: '#0ea5e9', type: 'due' },
  { id: 'e6', day: 12, month: 'Mar', title: 'Investigación hosting', color: '#10b981', type: 'due' },
  { id: 'e7', day: 14, month: 'Mar', title: 'Retro del equipo', time: '11:00', color: '#f43f5e', type: 'meeting' },
  { id: 'e8', day: 18, month: 'Mar', title: 'Demo interna abril', time: '14:00', color: '#6366f1', type: 'meeting' },
]

export type MyTask = {
  id: string
  title: string
  board: string
  boardColor: string
  column: string
  priority: 'Alta' | 'Media' | 'Baja'
  due: string
  assignees: Person[]
  done?: boolean
}

export const myTasks: MyTask[] = [
  {
    id: 'mt1',
    title: 'Implementar drag & drop en tableros',
    board: 'App móvil',
    boardColor: '#6366f1',
    column: 'En progreso',
    priority: 'Alta',
    due: 'Hoy',
    assignees: [team[0], team[3]],
  },
  {
    id: 'mt2',
    title: 'Diseñar pantalla de onboarding',
    board: 'App móvil',
    boardColor: '#6366f1',
    column: 'Pendiente',
    priority: 'Media',
    due: 'Mar 5',
    assignees: [team[0], team[2]],
  },
  {
    id: 'mt3',
    title: 'Migrar iconografía a lucide-react',
    board: 'App móvil',
    boardColor: '#6366f1',
    column: 'En revisión',
    priority: 'Baja',
    due: 'Mar 2',
    assignees: [team[0]],
  },
  {
    id: 'mt4',
    title: 'Revisar tokens del design system',
    board: 'Design system',
    boardColor: '#8b5cf6',
    column: 'En progreso',
    priority: 'Alta',
    due: 'Jue 27',
    assignees: [team[4], team[0]],
  },
  {
    id: 'mt5',
    title: 'Actualizar documentación de componentes',
    board: 'Design system',
    boardColor: '#8b5cf6',
    column: 'Pendiente',
    priority: 'Media',
    due: 'Mar 10',
    assignees: [team[0]],
  },
  {
    id: 'mt6',
    title: 'Revisar propuesta para el cliente Naranja',
    board: 'Marketing Q3',
    boardColor: '#10b981',
    column: 'En revisión',
    priority: 'Alta',
    due: 'Hoy',
    assignees: [team[1], team[0]],
  },
  {
    id: 'mt7',
    title: 'Plan de contenidos para redes',
    board: 'Marketing Q3',
    boardColor: '#10b981',
    column: 'Pendiente',
    priority: 'Media',
    due: 'Mar 14',
    assignees: [team[2]],
  },
  {
    id: 'mt8',
    title: 'Auditoría de accesibilidad',
    board: 'App móvil',
    boardColor: '#6366f1',
    column: 'Terminado',
    priority: 'Media',
    due: 'Feb 26',
    assignees: [team[2], team[4]],
    done: true,
  },
]
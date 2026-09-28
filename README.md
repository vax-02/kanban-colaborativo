# 📋 Kanban Colaborativo

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.10-1B2638?logo=prisma&logoColor=white)
![React Query](https://img.shields.io/badge/React%20Query-3.39-FF4154?&logo=react%20query&logoColor=white)

---

## 📖 Descripción

**Kanban Colaborativo** es una aplicación web de tableros kanban en tiempo real que permite a los equipos:
- Crear y organizar tableros con columnas ilimitadas
- Arrastacar y soltar tarjetas entre columnas
- Invitar miembros por correo electrónico o búsqueda
- Cambiar roles y permisos de los miembros
- Ver el historial de actividades del tablero
- Archivar tableros para después restaurarlos
- Ver y gestionar membresías y roles

La aplicación está dividida en un **frontend** (React + TypeScript + Vite) y un **backend** (Node.js + Express + Prisma + Socket.io).

---

## ⚡ Arranque rápido

### 1. Prerrequisitos

- [Node.js](https://nodejs.org/) >= 20
- [npm](https://www.npmjs.com/) o [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (opcional, para la base de datos)

### 2. Backend (Servidor Node.js)

```bash
cd server
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de base de datos

# Ejecutar migraciones de Prisma
npm run prisma:migrate

# Iniciar el servidor en modo desarrollo
npm run dev
```

El servidor correrá en `http://localhost:5000` (por defecto).

### 3. Frontend (Aplicación React)

```bash
cd src
# Instalar dependencias
npm install

# Iniciar la aplicación en modo desarrollo
npm run dev
```

La aplicación frontend correrá en `http://localhost:5173` (por defecto).

### 4. Uso

Abre `http://localhost:5173` en tu navegador. Necesitarás registrar una cuenta o iniciar sesión para comenzar a usar la aplicación.

---

## 📁 Estructura del proyecto

```
kanban-colaborativo/
├── server/              # Backend Node.js + Express
│   ├── prisma/          # Schema y migraciones de base de datos
│   ├── src/             # Código fuente del servidor
│   └── package.json
├── src/                 # Frontend React + TypeScript + Vite
│   ├── components/      # Componentes UI reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── store/         # Zustand stores (state management)
│   ├── lib/           # Utilidades y helpers
│   └── package.json
├── .gitignore           # Archivos y patrones ignorados por Git
└── README.md            # Documentación del proyecto
```

---

## 🛠️ Scripts disponibles

### Backend (`server/`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con `tsx watch` |
| `npm run build` | Compila el TypeScript a JavaScript |
| `npm run start` | Inicia el servidor en producción |
| `npm run prisma:generate` | Genera el cliente de Prisma |
| `npm run prisma:migrate` | Ejecuta las migraciones de base de datos |
| `npm run prisma:studio` | Abre la UI de Prisma Studio para ver la BD |

### Frontend (`src/`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el cliente Vite en modo desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run lint` | Ejecuta ESLint para validar el código |

---

## 🏗️ Tecnologías utilizadas

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** como bundler y dev server
- **React Router DOM 7** para enrutamiento
- **Zustand** para gestión de estado global
- **Lucide React** para iconos
- **Tailwind CSS 4** para estilos
- **React Query** para fetching y cacheo
- **Socket.io-client** para tiempo real

### Backend
- **Node.js 20** + **Express 5**
- **Prisma ORM** con PostgreSQL
- **@prisma/client** para queries tipo-safe
- **Socket.io** para comunicación en tiempo real
- **JsonWebTokens** para autenticación
- **Bcryptjs** para hash de contraseñas
- **Zod** para validación de schemas

---

## 📦 Dependencias clave

### Backend
```json
{
  "@prisma/client": "^6.10.0",
  "express": "^5.2.1",
  "socket.io": "^4.8.3",
  "bcryptjs": "^3.0.3",
  "jsonwebtoken": "^9.0.3",
  "zod": "^4.6.5"
}
```

### Frontend
```json
{
  "react": "^19.2.8",
  "typescript": "~6.0.2",
  "vite": "^8.3.0",
  "zod": "^4.6.5",
  "react-router-dom": "^7.18.4",
  "zustand": "^5.0.15",
  "lucide-react": "^1.47.0"
}
```

---

## 🎯 Features principales

### Tableros
- ✅ Crear, renombrar y eliminar tableros
- ✅ Columnas ilimitadas con arrastre y reordenación
- ✅ Tarjetas con descripciones, checklists y prioridades
- ✅ Filtros por estado, etiquetas y fechas

### Colaboración
- ✅ Invitación de miembros por correo electrónico
- ✅ Roles: Administrador, Editor, Miembro, Solo lectura
- ✅ Historial de membresías (ingreso/salida)
- ✅ Impedimento de que el creador sea removido

### Actividad
- ✅ Feed en tiempo real de acciones del tablero
- ✅ Tipos de actividad: Tarea creada, movida, prioridad cambiada, miembro añadido/quítado
- ✅ Iconos y timestamps relativos por tipo

### Utilidades
- ✅ Archivado/restaurado de tableros
- ✅ Búsqueda de usuarios por email/nombre
- ✅ Contadores dinámicos en la navegación
- ✅ Modales de confirmación con diseño system

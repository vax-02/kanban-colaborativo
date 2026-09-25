import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  KanbanSquare,
  Mail,
  Lock,
  Users,
  Sparkles,
  Globe,
  Zap,
  Eye,
  EyeOff,
  LoaderCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, register, loading } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enter = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'register') {
        await register({ nombre, apellidos, email, password })
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar')
    }
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m)
    setShowPass(false)
    setError(null)
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ==== Panel de marca ==== */}
      <aside className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <KanbanSquare className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            TaskFlow
          </span>
        </div>

        <div className="relative z-10 px-10">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Tableros colaborativos en tiempo real
          </span>
          <h1 className="text-4xl leading-[1.15] font-bold tracking-tight text-white">
            Organiza el trabajo
            <br />
            de tu equipo en un solo
            <br />
            lugar.
          </h1>
          <p className="mt-5 max-w-md text-brand-100">
            Arrastra tareas, asigna responsables y comparte tu tablero con
            quién quieras. Todo sincronizado al instante.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              'Tableros Kanban ilimitados',
              'Colaboración en vivo con tu equipo',
              'Sin limites de miembros',
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-8 p-10 text-xs text-brand-100">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" /> +12k equipos
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Disponible en español
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Gratis para empezar
          </div>
        </div>
      </aside>

      {/* ==== Formulario ==== */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600">
              <KanbanSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-ink-900">
              TaskFlow
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="mt-1.5 text-sm text-ink-500">
              {mode === 'login'
                ? 'Inicia sesión para ver tus tableros.'
                : 'Empieza a organizar tu trabajo en minutos.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`cursor-pointer rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-surface text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`cursor-pointer rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'register'
                  ? 'bg-surface text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={enter} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Ana"
                    className="input"
                    required
                    minLength={2}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="García"
                    className="input"
                    required
                    minLength={2}
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  placeholder="tucorreo@empresa.com"
                  className="input pl-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  className="input pr-11 pl-10"
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink-400 transition hover:text-ink-600"
                  aria-label="Mostrar contraseña"
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-ink-600">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-ink-300 accent-brand-600"
                  />
                  Recordarme
                </label>
                <a
                  href="#"
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Procesando…
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
            <div className="h-px flex-1 bg-ink-200" />
            o continúa con
            <div className="h-px flex-1 bg-ink-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="btn-ghost">
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09A6.62 6.62 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.47 1.18 4.93l3.66-2.84Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
                />
              </svg>
              Google
            </button>
            <button className="btn-ghost">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
                <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z" />
              </svg>
              Facebook
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-ink-500">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
            >
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
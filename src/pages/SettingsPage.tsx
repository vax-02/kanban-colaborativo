import { useState } from 'react'
import {
  Bell,
  Camera,
  Check,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sun,
  Upload,
  UserRound,
} from 'lucide-react'
import { ACCENT_PRESETS, useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'

type Section = 'perfil' | 'apariencia' | 'notificaciones' | 'seguridad'

const sections: { id: Section; label: string; icon: typeof UserRound }[] = [
  { id: 'perfil', label: 'Perfil', icon: UserRound },
  { id: 'apariencia', label: 'Apariencia', icon: Palette },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
]

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  desc?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        {desc && <p className="text-xs text-ink-400">{desc}</p>}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
          checked ? 'bg-brand-600' : 'bg-ink-300'
        }`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('perfil')
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const accent = useThemeStore((s) => s.accent)
  const setAccent = useThemeStore((s) => s.setAccent)
  const user = useAuthStore((s) => s.user)
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    emailMention: true,
    emailAssign: true,
    emailDigest: false,
    pushApp: true,
    pushDeadline: true,
    doubleAuth: true,
  })
  const [saved, setSaved] = useState(false)

  const changeT = (k: string) => (v: boolean) =>
    setToggles((t) => ({ ...t, [k]: v }))

  const saveProfile = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl gap-6 overflow-hidden">
      {/* Tabs verticales */}
      <nav className="w-52 shrink-0">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink-900">Ajustes</h1>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  section === s.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                <s.icon
                  className={`h-4 w-4 ${
                    section === s.id ? 'text-brand-600' : 'text-ink-400'
                  }`}
                />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Contenido */}
      <div className="min-w-0 flex-1 overflow-y-auto pb-6">
        <div className="rounded-2xl border border-ink-200 bg-surface p-6 shadow-sm">
          {section === 'perfil' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ backgroundColor: user?.avatarColor ?? '#6366f1' }}
                  >
                    {user?.iniciales ?? 'AG'}
                  </span>
                  <button
                    type="button"
                    className="absolute -right-1 -bottom-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-ink-100 text-ink-500 transition hover:bg-ink-200"
                    aria-label="Cambiar foto"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-bold text-ink-900">Foto de perfil</p>
                  <p className="text-xs text-ink-400">PNG o JPG de hasta 2 MB</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn-ghost px-3 py-1.5 text-xs">
                      <Upload className="h-3.5 w-3.5" />
                      Subir foto
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer text-xs font-semibold text-rose-500 hover:text-rose-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</label>
                  <input defaultValue={user?.nombre ?? 'Ana'} className="input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Apellido
                  </label>
                  <input defaultValue={user?.apellidos ?? 'García'} className="input" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Correo electrónico
                </label>
                <input defaultValue={user?.email ?? 'ana@empresa.com'} className="input" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Biografía</label>
                <textarea
                  rows={3}
                  placeholder="Cuéntale al equipo sobre ti…"
                  defaultValue={user?.bio ?? ''}
                  className="input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
                {saved && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    Cambios guardados
                  </span>
                )}
                <button type="button" className="btn-primary" onClick={saveProfile}>
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {section === 'apariencia' && (
            <div className="space-y-6">
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Tema</p>
                <p className="mb-3 text-xs text-ink-400">
                  Elige cómo se ve la interfaz en esta sesión.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ['light', 'Claro', Sun],
                      ['dark', 'Oscuro', Moon],
                      ['system', 'Sistema', Monitor],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id)}
                      className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                        theme === id
                          ? 'border-brand-400 ring-2 ring-brand-100'
                          : 'border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      <span
                        className={`mb-2 flex h-10 items-center justify-center rounded-lg transition ${
                          theme === id ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-400'
                        } ${id === 'dark' ? '!bg-ink-900 !text-ink-100' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-xs font-semibold text-ink-800">{label}</p>
                      {id === 'system' && (
                        <p className="text-[10px] text-ink-400">Usa tu sistema</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Color de acento</p>
                <p className="mb-3 text-xs text-ink-400">
                  Se aplica a botones, enlaces y estado activo.
                </p>
                <div className="flex gap-2.5">
                  {ACCENT_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccent(c)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition hover:scale-110"
                      style={{ backgroundColor: c }}
                      aria-label={`Acento ${c}`}
                      title={c}
                    >
                      {accent === c && (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'notificaciones' && (
            <div className="space-y-5">
              <div>
                <p className="mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">
                  Correo electrónico
                </p>
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
                  <Toggle checked={toggles.emailMention} onChange={changeT('emailMention')} label="Menciones" desc="Cuando alguien te mencione en un comentario" />
                  <Toggle checked={toggles.emailAssign} onChange={changeT('emailAssign')} label="Asignaciones" desc="Cuando te asignen una tarea o tarjeta" />
                  <Toggle checked={toggles.emailDigest} onChange={changeT('emailDigest')} label="Resumen semanal" desc="Resumen de actividad cada lunes" />
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">
                  En la aplicación
                </p>
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
                  <Toggle checked={toggles.pushApp} onChange={changeT('pushApp')} label="Notificaciones push" desc="Recibe avisos en el navegador" />
                  <Toggle checked={toggles.pushDeadline} onChange={changeT('pushDeadline')} label="Vencimientos" desc="Aviso 24 h antes de una fecha límite" />
                </div>
              </div>

              <div className="flex justify-end border-t border-ink-100 pt-4">
                <button type="button" className="btn-primary">Guardar preferencias</button>
              </div>
            </div>
          )}

          {section === 'seguridad' && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Contraseña actual
                  </label>
                  <input type="password" placeholder="••••••••" className="input" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Nueva contraseña
                    </label>
                    <input type="password" placeholder="••••••••" className="input" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">
                      Confirmar nueva contraseña
                    </label>
                    <input type="password" placeholder="••••••••" className="input" />
                  </div>
                </div>
                <button type="button" className="btn-primary">Actualizar contraseña</button>
              </div>

              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <Shield className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Verificación en dos pasos</p>
                      <p className="text-xs text-ink-500">Código por aplicación de autenticación</p>
                    </div>
                  </div>
                  <Toggle checked={toggles.doubleAuth} onChange={changeT('doubleAuth')} label="" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
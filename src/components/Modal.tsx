import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export default function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl ${maxWidth}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-ink-200 px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink-900">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 max-w-sm text-sm text-ink-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-between gap-3 border-t border-ink-200 bg-ink-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
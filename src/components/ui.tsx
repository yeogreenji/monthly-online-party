import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { ToastMessage } from '../types'

let modalDepth = 0

export function Modal({
  onClose,
  children,
  label,
  size = 'md',
  align = 'center',
}: {
  onClose: () => void
  children: ReactNode
  label: string
  size?: 'sm' | 'md' | 'lg'
  align?: 'center' | 'top'
}) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    modalDepth += 1
    document.body.dataset.modalOpen = 'true'
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      modalDepth = Math.max(0, modalDepth - 1)
      if (modalDepth === 0) delete document.body.dataset.modalOpen
      document.body.style.overflow = previous
    }
  }, [])

  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl'

  return (
    <div
      className={`fixed inset-0 z-[70] flex justify-center overflow-y-auto px-4 ${
        align === 'top' ? 'items-start py-8' : 'items-center py-6'
      }`}
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(6px)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative w-full ${width} card animate-fade-up outline-none`}
        style={{ boxShadow: 'var(--shadow)', background: 'var(--surface)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 z-10 rounded-full p-2 transition-colors hover:bg-black/5"
          style={{ color: 'var(--muted)' }}
        >
          <X size={17} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-[76px] z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 sm:left-auto sm:right-5 sm:top-auto sm:bottom-6 sm:translate-x-0 sm:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="animate-fade-up pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[12.5px] shadow-lg"
          style={{
            background: toast.tone === 'success' ? 'var(--forest)' : 'var(--ink)',
            color: toast.tone === 'success' ? 'var(--forest-ink)' : 'var(--bg)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: toast.tone === 'success' ? 'var(--gold)' : 'var(--gold)' }}
          />
          {toast.text}
        </div>
      ))}
    </div>
  )
}

export function useReveal(dep?: unknown) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'))
    if (nodes.length === 0) return
    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    nodes.forEach((node) => observer.observe(node))
    // 스크롤이 없거나 관찰이 동작하지 않는 환경에서도 내용이 보이도록 안전장치를 둡니다.
    const fallback = window.setTimeout(() => {
      nodes.forEach((node) => node.classList.add('is-visible'))
    }, 1600)
    return () => {
      window.clearTimeout(fallback)
      observer.disconnect()
    }
  }, [dep])
}

export function SectionHead({
  kicker,
  title,
  description,
  action,
  align = 'left',
}: {
  kicker: string
  title: ReactNode
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <div
      className={`mb-9 flex flex-col gap-5 ${
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      }`}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-2xl'}>
        <p className="kicker mb-3">{kicker}</p>
        <h2 className="serif text-[26px] leading-[1.35] sm:text-[32px]">{title}</h2>
        {description && (
          <p className="mt-3 text-[13.5px] leading-[1.85]" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (text: string, key = 'default') => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1800)
  }

  return { copied, copy }
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

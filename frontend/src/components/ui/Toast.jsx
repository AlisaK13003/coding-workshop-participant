import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import './Toast.css'

/** Bottom-right message. tone: 'success' | 'error'. Renders nothing when message is empty. Shown by ToastProvider. */
export function Toast({ message, tone = 'success', onDismiss }) {
  if (!message) return null
  const Icon = tone === 'error' ? CircleAlert : CheckCircle2
  return (
    <div className={cx('toast', tone === 'error' && 'toast-error')} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      {message}
      <button onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}

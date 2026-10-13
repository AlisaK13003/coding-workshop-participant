import { CheckCircle2, X } from 'lucide-react'
import './Toast.css'

/** Bottom-right confirmation message. Renders nothing when message is empty. Pair with useToast. */
export function Toast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={18} />
      {message}
      <button onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}

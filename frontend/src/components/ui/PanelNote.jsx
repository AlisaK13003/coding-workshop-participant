import { CircleAlert } from 'lucide-react'
import './PanelNote.css'

const TONE_CLASS = {
  teal: 'profile-cost-note',
  muted: 'profile-maintained-note',
}

/** Small note at the bottom of a panel. tone: 'teal' | 'muted'. */
export function PanelNote({ tone = 'teal', children }) {
  return (
    <div className={TONE_CLASS[tone]}>
      <CircleAlert size={16} />
      {children}
    </div>
  )
}

import { ArrowLeft } from 'lucide-react'
import './BackLink.css'

/** "← Back to …" link-styled button above detail pages. */
export function BackLink({ onClick, children }) {
  return (
    <button className="back-link" onClick={onClick}>
      <ArrowLeft size={16} />
      {children}
    </button>
  )
}

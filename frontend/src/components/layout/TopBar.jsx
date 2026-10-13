import { Menu } from 'lucide-react'
import './TopBar.css'

/** Sticky header: mobile menu button, workspace label and page title, actions as children. */
export function TopBar({ workspaceLabel, title, onMenuClick, children }) {
  return (
    <header className="topbar">
      <button
        className="icon-button mobile-menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="top-title">
        <span>{workspaceLabel}</span>
        <strong>{title}</strong>
      </div>
      <div className="top-actions">{children}</div>
    </header>
  )
}

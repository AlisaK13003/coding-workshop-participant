import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { Avatar } from '../ui'
import './Popover.css'
import './ProfileMenu.css'

/**
 * Avatar button with a dropdown. Always ends with "Sign out" (back to /).
 * user: { name, subtitle }.
 * summary (optional): short line shown under the name, e.g. "5 direct reports".
 * actions (optional): [{ label, icon, onClick }] menu items above Sign out.
 */
export function ProfileMenu({ user, summary, actions = [] }) {
  const menu = useDisclosure()
  const navigate = useNavigate()

  return (
    <div className="popover-wrap">
      <button
        className="profile-button"
        aria-expanded={menu.isOpen}
        onClick={menu.toggle}
      >
        <Avatar name={user.name} />
        <span>
          <strong>{user.name}</strong>
          <small>{user.subtitle}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {menu.isOpen && (
        <div className="popover profile-popover">
          {summary && (
            <div className="manager-profile-summary">
              <strong>{user.name}</strong>
              <span>{summary}</span>
            </div>
          )}
          {actions.map(({ label, icon: Icon, onClick }) => (
            <button key={label} onClick={onClick}>
              <Icon size={16} />
              {label}
            </button>
          ))}
          <button onClick={() => navigate('/')}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

import { cx } from '../../utils/cx.js'
import './Sidebar.css'

/**
 * Fixed left navigation.
 * items: [{ name, icon, count? }]; a count above 0 shows as a pill.
 * footer: { icon, title, subtitle } describes the workspace.
 */
export function Sidebar({ brandTag, items, active, onNavigate, footer, isOpen }) {
  const FooterIcon = footer.icon
  return (
    <aside className={cx('sidebar', isOpen && 'sidebar-open')}>
      <div className="brand">
        <span className="brand-mark" />
        ATLAS <small>{brandTag}</small>
      </div>
      <nav>
        {items.map(({ name, icon: Icon, count }) => (
          <button
            key={name}
            className={name === active ? 'active' : undefined}
            aria-current={name === active ? 'page' : undefined}
            onClick={() => onNavigate(name)}
          >
            <Icon size={18} />
            {name}
            {count > 0 && <span className="nav-count">{count}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <FooterIcon size={18} />
        <div>
          <strong>{footer.title}</strong>
          <span>{footer.subtitle}</span>
        </div>
      </div>
    </aside>
  )
}

import { cx } from '../../utils/cx.js'
import './StatCard.css'

/**
 * Metric card. `icon` is a lucide-react icon component; `accent` adds a teal top border.
 * With `onSelect` the card is a button (e.g. to switch what a dashboard shows below it),
 * and `selected` marks the chosen one with the teal border.
 */
export function StatCard({ label, value, note, icon: Icon, accent = false, selected = false, onSelect }) {
  const content = (
    <>
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </>
  )
  if (!onSelect) return <div className={cx('stat-card', accent && 'stat-accent')}>{content}</div>
  return (
    <button
      type="button"
      className={cx('stat-card', 'stat-selectable', (accent || selected) && 'stat-accent')}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {content}
    </button>
  )
}

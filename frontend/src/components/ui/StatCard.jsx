import { cx } from '../../utils/cx.js'
import './StatCard.css'

/** Metric card. `icon` is a lucide-react icon component; `accent` adds a teal top border. */
export function StatCard({ label, value, note, icon: Icon, accent = false }) {
  return (
    <div className={cx('stat-card', accent && 'stat-accent')}>
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}

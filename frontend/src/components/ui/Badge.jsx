import { cx } from '../../utils/cx.js'
import './Badge.css'

/**
 * Status pill. The tone becomes a `badge-<tone>` class, so a status such as
 * "Awaiting review" or a role such as "Manager" can be passed straight in.
 */
export function Badge({ children, tone = 'neutral' }) {
  return (
    <span
      className={cx('badge', `badge-${tone.toLowerCase().replace(/\s+/g, '-')}`)}
    >
      {children}
    </span>
  )
}

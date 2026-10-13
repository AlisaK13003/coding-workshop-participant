import { cx } from '../../utils/cx.js'
import { initials } from '../../utils/format.js'
import './Avatar.css'

/** Round initials avatar. size: 'sm' | 'md'. */
export function Avatar({ name, size = 'md' }) {
  return <span className={cx('avatar', `avatar-${size}`)}>{initials(name)}</span>
}

import { CircleAlert } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import './dialogs.css'

/** Amber rule reminder inside a dialog; tone="danger" makes it red. */
export function ValidationNote({ tone, children }) {
  return (
    <div className={cx('validation-note', tone === 'danger' && 'danger-note')}>
      <CircleAlert size={17} />
      <span>{children}</span>
    </div>
  )
}

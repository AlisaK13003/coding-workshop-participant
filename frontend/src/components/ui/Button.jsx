import { cx } from '../../utils/cx.js'
import './Button.css'

/** Pill button. variant: 'primary' | 'secondary' | 'ghost' | 'danger'. Extra props reach the <button>. */
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button className={cx('button', `button-${variant}`)} type={type} {...props}>
      {children}
    </button>
  )
}

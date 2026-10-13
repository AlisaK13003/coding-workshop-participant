import { cx } from '../../utils/cx.js'
import './forms.css'

/**
 * Select control. onChange receives the selected value, not the event.
 * Without `value` it is uncontrolled. Extra props (name, multiple…) reach the <select>.
 */
export function Select({ children, value, onChange, className, ...props }) {
  return (
    <select
      className={cx('control', className)}
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      {...props}
    >
      {children}
    </select>
  )
}

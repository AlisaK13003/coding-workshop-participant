import { cx } from '../../utils/cx.js'
import './forms.css'

/** Text-like input styled as a form control. Extra props (name, value, onChange…) reach the <input>. */
export function Input({ type = 'text', className, ...props }) {
  return <input className={cx('control', className)} type={type} {...props} />
}

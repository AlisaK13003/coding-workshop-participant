import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { formatAmount, parseAmount } from '../../utils/format.js'
import './forms.css'
import './MoneyInput.css'

/**
 * A dollar amount field that accepts commas ("100,000"), tidies the number when you
 * leave it, and steps by `step` with its ▲▼ buttons or the arrow keys (never below 0).
 * The form receives the plain number under `name` (e.g. "100000").
 * onEdit (optional) is called whenever the person changes the amount, by typing or stepping.
 */
export function MoneyInput({ name, defaultValue, step = 10000, required, placeholder, onEdit, ...props }) {
  const [text, setText] = useState(formatAmount(defaultValue == null ? null : Number(defaultValue)))
  const amount = parseAmount(text)

  const edit = (next) => {
    setText(next)
    onEdit?.()
  }
  const stepBy = (direction) => edit(formatAmount(Math.max(0, (amount ?? 0) + direction * step)))

  return (
    <span className="money-input">
      <span className="money-prefix" aria-hidden="true">$</span>
      <input
        className="control"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        required={required}
        // Only digits, commas, one decimal point and spaces can be typed.
        onChange={(event) => edit(event.target.value.replace(/[^\d.,\s]/g, ''))}
        onBlur={() => amount != null && setText(formatAmount(amount))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            stepBy(event.key === 'ArrowUp' ? 1 : -1)
          }
        }}
        {...props}
      />
      <span className="money-steppers">
        <button type="button" tabIndex={-1} aria-label={`Add $${formatAmount(step)}`} onClick={() => stepBy(1)}>
          <ChevronUp size={12} />
        </button>
        <button type="button" tabIndex={-1} aria-label={`Subtract $${formatAmount(step)}`} onClick={() => stepBy(-1)}>
          <ChevronDown size={12} />
        </button>
      </span>
      <input type="hidden" name={name} value={amount ?? (text.trim() ? text : '')} />
    </span>
  )
}

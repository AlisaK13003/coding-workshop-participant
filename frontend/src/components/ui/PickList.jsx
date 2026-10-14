import { X } from 'lucide-react'
import { useState } from 'react'
import './forms.css'
import './PickList.css'

/**
 * Choose several items: a dropdown adds each pick to a list below, where × removes it.
 * The form receives every pick under `name` (formData.getAll(name)).
 * options: [{ value, label, disabledReason? }]: a reason greys the option out and says why.
 * locked: [{ value, label, note }]: always-kept items shown without × (not submitted).
 */
export function PickList({
  label, name, options, defaultValues = [], locked = [], placeholder = 'Add…', hint, error, emptyText,
}) {
  const [picked, setPicked] = useState(defaultValues)
  const labelOf = (value) => options.find((option) => option.value === value)?.label ?? value
  const available = options.filter((option) => !picked.includes(option.value))

  return (
    <fieldset className="field pick-list">
      <legend>{label}</legend>
      <select
        className="control"
        value=""
        aria-label={`${label}: add`}
        onChange={(event) => {
          const value = options.find((option) => String(option.value) === event.target.value)?.value
          if (value !== undefined) setPicked((current) => [...current, value])
        }}
      >
        <option value="">{available.some((option) => !option.disabledReason) ? placeholder : 'Nothing else to add'}</option>
        {available.map((option) => (
          <option key={option.value} value={option.value} disabled={Boolean(option.disabledReason)}>
            {option.label}
            {option.disabledReason ? ` (${option.disabledReason})` : ''}
          </option>
        ))}
      </select>
      {locked.length + picked.length > 0 ? (
        <ul className="pick-list-items">
          {locked.map((item) => (
            <li key={`locked-${item.value}`} className="locked">
              <span>{item.label}</span>
              <small>{item.note}</small>
            </li>
          ))}
          {picked.map((value) => (
            <li key={value}>
              <span>{labelOf(value)}</span>
              <button
                type="button"
                aria-label={`Remove ${labelOf(value)}`}
                onClick={() => setPicked((current) => current.filter((item) => item !== value))}
              >
                <X size={13} />
              </button>
              <input type="hidden" name={name} value={value} />
            </li>
          ))}
        </ul>
      ) : (
        emptyText && <small>{emptyText}</small>
      )}
      {hint && !error && <small>{hint}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </fieldset>
  )
}
